import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QueueEntry, Fermata, Profile, Report, DispatchLog, QueueActivityLog, AuditLog } from '@/types/database';
import { toast } from 'sonner';

// Hook for fetching fermatas
export function useFermatas() {
  const [fermatas, setFermatas] = useState<Fermata[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFermatas = useCallback(async () => {
    const { data, error } = await supabase
      .from('fermatas')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching fermatas:', error);
      return;
    }
    setFermatas((data || []) as Fermata[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFermatas();
  }, [fetchFermatas]);

  return { fermatas, loading, refetch: fetchFermatas };
}

// Hook for fetching dispatcher's assigned fermatas
export function useDispatcherFermatas(dispatcherId: string | undefined) {
  const [assignedFermatas, setAssignedFermatas] = useState<Fermata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dispatcherId) {
      setLoading(false);
      return;
    }

    const fetchAssigned = async () => {
      const { data, error } = await supabase
        .from('dispatcher_fermatas')
        .select('fermata_id, fermatas(*)')
        .eq('dispatcher_id', dispatcherId);

      if (error) {
        console.error('Error fetching assigned fermatas:', error);
        setLoading(false);
        return;
      }

      const fermataList = data?.map((d: any) => d.fermatas).filter(Boolean) as Fermata[];
      setAssignedFermatas(fermataList || []);
      setLoading(false);
    };

    fetchAssigned();
  }, [dispatcherId]);

  return { assignedFermatas, loading };
}

// Hook for fetching queue entries with realtime updates
export function useQueueEntries(fermataIds?: string[]) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    let query = supabase
      .from('queue_entries')
      .select(`
        *,
        taxis(*,drivers(*)),
        fermatas(*)
      `)
      .in('status', ['waiting', 'skipped', 'not_ready', 'returned'])
      .order('queue_number');

    if (fermataIds && fermataIds.length > 0) {
      query = query.in('fermata_id', fermataIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching queue entries:', error);
      setLoading(false);
      return;
    }

    // Map to expected structure
    const mapped = (data || []).map((e: any) => ({
      ...e,
      taxi: e.taxis ? { ...e.taxis, driver: e.taxis.drivers } : undefined,
      fermata: e.fermatas,
    })) as QueueEntry[];

    setEntries(mapped);
    setLoading(false);
  }, [fermataIds]);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  return { entries, loading, refetch: fetchEntries };
}

// Hook for dispatching a taxi
export function useDispatchTaxi() {
  const [loading, setLoading] = useState(false);

  const dispatch = useCallback(async (entryId: string, dispatcherId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase.rpc('dispatch_taxi', {
      _entry_id: entryId,
      _dispatcher_id: dispatcherId
    });

    setLoading(false);

    if (error) {
      console.error('Error dispatching taxi:', error);
      toast.error('ታክሲ ክልኣኽ ኣይከኣለን');
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    
    if (!result.success) {
      toast.error(result.error || 'ታክሲ ክልኣኽ ኣይከኣለን');
      return result;
    }

    toast.success('ታክሲ ተላኢኹ');
    return result;
  }, []);

  return { dispatch, loading };
}

// Hook for skipping a taxi
export function useSkipTaxi() {
  const [loading, setLoading] = useState(false);

  const skip = useCallback(async (entryId: string, dispatcherId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase.rpc('skip_taxi_in_queue', {
      _entry_id: entryId,
      _dispatcher_id: dispatcherId
    });

    setLoading(false);

    if (error) {
      console.error('Error skipping taxi:', error);
      toast.error('ታክሲ ክሰግር ኣይከኣለን');
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    
    if (!result.success) {
      toast.error(result.error || 'ታክሲ ክሰግር ኣይከኣለን');
      return result;
    }

    toast.success('ታክሲ ተሰጊሩ');
    return result;
  }, []);

  return { skip, loading };
}

// Hook for registering a new taxi to queue
export function useRegisterTaxi() {
  const [loading, setLoading] = useState(false);

  const register = useCallback(async (
    plateNumber: string,
    driverName: string,
    fermataId: string,
    dispatcherId: string
  ) => {
    setLoading(true);

    let { data: existingTaxi } = await supabase
      .from('taxis')
      .select('*')
      .eq('plate_number', plateNumber)
      .maybeSingle();

    let taxiId = existingTaxi?.id;

    if (!existingTaxi) {
      const { data: newDriver, error: driverError } = await supabase
        .from('drivers')
        .insert({ name: driverName })
        .select()
        .single();

      if (driverError) {
        setLoading(false);
        toast.error('ሾፌር ክፍጠር ኣይከኣለን');
        return { success: false, error: driverError.message };
      }

      const { data: newTaxi, error: taxiError } = await supabase
        .from('taxis')
        .insert({ 
          plate_number: plateNumber, 
          driver_id: newDriver.id,
          type: 'sedan'
        })
        .select()
        .single();

      if (taxiError) {
        setLoading(false);
        toast.error('ታክሲ ክፍጠር ኣይከኣለን');
        return { success: false, error: taxiError.message };
      }

      taxiId = newTaxi.id;
    }

    const { data: existingEntry } = await supabase
      .from('queue_entries')
      .select('id')
      .eq('taxi_id', taxiId)
      .in('status', ['waiting', 'skipped', 'not_ready', 'returned'])
      .maybeSingle();

    if (existingEntry) {
      setLoading(false);
      toast.error('ታክሲ ድሮ ኣብ ወረፋ ኣሎ');
      return { success: false, error: 'Taxi already in queue' };
    }

    const { error: queueError } = await supabase
      .from('queue_entries')
      .insert({
        taxi_id: taxiId,
        fermata_id: fermataId,
        dispatcher_id: dispatcherId,
        queue_number: 0
      });

    setLoading(false);

    if (queueError) {
      console.error('Error adding to queue:', queueError);
      toast.error('ናብ ወረፋ ክወሃሃድ ኣይከኣለን');
      return { success: false, error: queueError.message };
    }

    toast.success(`${plateNumber} ናብ ወረፋ ተወሲኹ`);
    return { success: true };
  }, []);

  return { register, loading };
}

// Hook for fetching reports
export function useReports(filters?: { 
  fermataId?: string; 
  dispatcherId?: string; 
  taxiId?: string;
  status?: string;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    let query = supabase
      .from('reports')
      .select(`*,taxis(*),fermatas(*)`)
      .order('created_at', { ascending: false });

    if (filters?.fermataId && filters.fermataId !== 'all') {
      query = query.eq('fermata_id', filters.fermataId);
    }
    if (filters?.dispatcherId && filters.dispatcherId !== 'all') {
      query = query.eq('dispatcher_id', filters.dispatcherId);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((r: any) => ({
      ...r,
      taxi: r.taxis,
      fermata: r.fermatas,
      metadata: r.metadata as Record<string, unknown> || null
    })) as Report[];

    setReports(mapped);
    setLoading(false);
  }, [filters?.fermataId, filters?.dispatcherId, filters?.status]);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  return { reports, loading, refetch: fetchReports };
}

// Hook for creating a report
export function useCreateReport() {
  const [loading, setLoading] = useState(false);

  const createReport = useCallback(async (
    taxiId: string,
    fermataId: string,
    dispatcherId: string,
    reason: string,
    description?: string
  ) => {
    setLoading(true);

    const { error } = await supabase
      .from('reports')
      .insert({
        taxi_id: taxiId,
        fermata_id: fermataId,
        dispatcher_id: dispatcherId,
        reason: reason as any,
        description
      });

    setLoading(false);

    if (error) {
      console.error('Error creating report:', error);
      toast.error('ጸብጻብ ክፍጠር ኣይከኣለን');
      return { success: false, error: error.message };
    }

    toast.success('ጸብጻብ ተፈጢሩ');
    return { success: true };
  }, []);

  return { createReport, loading };
}

// Hook for resolving a report
export function useResolveReport() {
  const [loading, setLoading] = useState(false);

  const resolveReport = useCallback(async (
    reportId: string,
    adminId: string,
    status: 'resolved' | 'closed',
    comments?: string
  ) => {
    setLoading(true);

    const { error } = await supabase
      .from('reports')
      .update({
        status: status as any,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        admin_comments: comments
      })
      .eq('id', reportId);

    setLoading(false);

    if (error) {
      console.error('Error resolving report:', error);
      toast.error('ጸብጻብ ክዕጾ ኣይከኣለን');
      return { success: false, error: error.message };
    }

    toast.success('ጸብጻብ ተዓጽዩ');
    return { success: true };
  }, []);

  return { resolveReport, loading };
}

// Hook for dispatch logs
export function useDispatchLogs(filters?: { fermataId?: string; dispatcherId?: string }) {
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    let query = supabase
      .from('dispatch_logs')
      .select(`*,taxis(*),fermatas(*)`)
      .order('dispatched_at', { ascending: false });

    if (filters?.fermataId && filters.fermataId !== 'all') {
      query = query.eq('fermata_id', filters.fermataId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dispatch logs:', error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((l: any) => ({
      ...l,
      taxi: l.taxis,
      fermata: l.fermatas
    })) as DispatchLog[];

    setLogs(mapped);
    setLoading(false);
  }, [filters?.fermataId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

// Hook for activity logs
export function useActivityLogs() {
  const [logs, setLogs] = useState<QueueActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('queue_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activity logs:', error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((l: any) => ({
      ...l,
      metadata: l.metadata as Record<string, unknown> || null
    })) as QueueActivityLog[];

    setLogs(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

// Hook for audit logs
export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((l: any) => ({
      ...l,
      old_values: l.old_values as Record<string, unknown> || null,
      new_values: l.new_values as Record<string, unknown> || null,
      metadata: l.metadata as Record<string, unknown> || null
    })) as AuditLog[];

    setLogs(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}

// Hook for dispatchers
export function useDispatchers() {
  const [dispatchers, setDispatchers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDispatchers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'dispatcher');

    if (error) {
      console.error('Error fetching dispatchers:', error);
      setLoading(false);
      return;
    }

    const userIds = data?.map(d => d.user_id) || [];
    
    if (userIds.length === 0) {
      setDispatchers([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    setDispatchers((profiles || []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDispatchers();
  }, [fetchDispatchers]);

  return { dispatchers, loading, refetch: fetchDispatchers };
}

// Hook for updating taxi status
export function useUpdateTaxiStatus() {
  const [loading, setLoading] = useState(false);

  const updateStatus = useCallback(async (
    entryId: string,
    newStatus: 'not_ready' | 'returned' | 'canceled',
    dispatcherId: string
  ) => {
    setLoading(true);

    const { data: entry, error: fetchError } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError) {
      setLoading(false);
      toast.error('ታክሲ ኣይተረኽበን');
      return { success: false, error: fetchError.message };
    }

    const { error } = await supabase
      .from('queue_entries')
      .update({ status: newStatus as any })
      .eq('id', entryId);

    if (error) {
      setLoading(false);
      toast.error('ኩነታት ክቕየር ኣይከኣለን');
      return { success: false, error: error.message };
    }

    await supabase.from('queue_activity_logs').insert({
      queue_entry_id: entryId,
      taxi_id: entry.taxi_id,
      fermata_id: entry.fermata_id,
      dispatcher_id: dispatcherId,
      action: newStatus,
      old_status: entry.status,
      new_status: newStatus
    });

    if (newStatus === 'canceled') {
      await supabase.rpc('normalize_queue_positions', { _fermata_id: entry.fermata_id });
    }

    setLoading(false);
    toast.success('ኩነታት ተቐይሩ');
    return { success: true };
  }, []);

  return { updateStatus, loading };
}
