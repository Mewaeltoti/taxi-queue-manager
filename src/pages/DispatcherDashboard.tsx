import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Send, Car, Download, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { QueueTableEnhanced } from '@/components/dispatcher/QueueTableEnhanced';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const DispatcherDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [fermatas, setFermatas] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');

  const assignedFermataIds = user?.assigned_fermata_ids || [];
  const primaryFermata = fermatas.find(f => assignedFermataIds.includes(f.id));

  const loadQueueEntries = useCallback(async () => {
    if (!assignedFermataIds.length) return;
    
    const { data, error } = await supabase
      .from('queue_entries')
      .select(`
        *,
        taxis!inner(id, plate_number, drivers(id, name)),
        fermatas(id, code, name)
      `)
      .in('fermata_id', assignedFermataIds)
      .in('status', ['waiting', 'not_ready', 'returned', 'skipped'])
      .order('queue_number', { ascending: true });

    if (error) {
      console.error('Error loading queue:', error);
      return;
    }

    // Map to flat structure for display
    const mapped = (data || []).map((e: any) => ({
      ...e,
      plate_number: e.taxis?.plate_number,
      driver_name: e.taxis?.drivers?.name,
      taxi: e.taxis,
      fermata: e.fermatas,
    }));

    setQueueEntries(mapped);
  }, [assignedFermataIds]);

  const loadDispatchLogs = useCallback(async () => {
    if (!assignedFermataIds.length) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Use explicit foreign key name to avoid schema cache issues
    const { data, error } = await supabase
      .from('dispatch_logs')
      .select(`
        *,
        fermatas!dispatch_logs_fermata_id_fkey(id, code, name),
        queue_entries!dispatch_logs_queue_entry_id_fkey(
          id,
          taxis!queue_entries_taxi_id_fkey(
            id, 
            plate_number,
            drivers!taxis_driver_id_fkey(id, name)
          )
        )
      `)
      .in('fermata_id', assignedFermataIds)
      .gte('dispatched_at', today)
      .order('dispatched_at', { ascending: false });

    if (error) {
      console.error('Error loading dispatch logs:', error);
      return;
    }

    const mapped = (data || []).map((l: any) => ({
      ...l,
      queue_entry: {
        plate_number: l.queue_entries?.taxis?.plate_number,
        driver_name: l.queue_entries?.taxis?.drivers?.name,
      },
      fermata: l.fermatas,
    }));

    setDispatchLogs(mapped);
  }, [assignedFermataIds]);

  const loadFermatas = useCallback(async () => {
    const { data } = await supabase.from('fermatas').select('*');
    setFermatas(data ?? []);
  }, []);

  // Initial load
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    Promise.all([loadQueueEntries(), loadDispatchLogs(), loadFermatas()])
      .finally(() => setIsLoading(false));
  }, [user, loadQueueEntries, loadDispatchLogs, loadFermatas]);

  // Real-time subscription - listen to ALL queue changes, then refetch
  useEffect(() => {
    if (!user || !assignedFermataIds.length) return;

    const channel = supabase
      .channel('queue-realtime-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries' },
        (payload) => {
          console.log('Queue change detected:', payload);
          loadQueueEntries();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_logs' },
        (payload) => {
          console.log('Dispatch log change:', payload);
          loadDispatchLogs();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, assignedFermataIds, loadQueueEntries, loadDispatchLogs]);

  const activeEntries = useMemo(() =>
    queueEntries.filter(e => ['waiting', 'not_ready', 'returned'].includes(e.status)),
    [queueEntries]
  );

  const waitingCount = activeEntries.filter(e => e.status === 'waiting').length;
  const nextDispatchableTaxi = activeEntries.find(e => e.status === 'waiting' || e.status === 'returned');
  const dispatchedToday = dispatchLogs.length;

  const handleAddToQueue = async () => {
    if (!plateNumber.trim() || !driverName.trim()) {
      toast.error('Please enter plate and driver name');
      return;
    }

    if (!primaryFermata) {
      toast.error('No destination assigned');
      return;
    }

    const normalizedPlate = plateNumber.trim().toUpperCase();
    const trimmedDriver = driverName.trim();

    setIsLoading(true);
    setPlateNumber('');
    setDriverName('');
    setIsAddModalOpen(false);

    try {
      // 1. Check if taxi exists, or create it with driver
      let { data: existingTaxi } = await supabase
        .from('taxis')
        .select('id, driver_id')
        .eq('plate_number', normalizedPlate)
        .maybeSingle();

      let taxiId = existingTaxi?.id;

      if (!existingTaxi) {
        // Create driver first
        const { data: newDriver, error: driverError } = await supabase
          .from('drivers')
          .insert({ name: trimmedDriver })
          .select('id')
          .single();

        if (driverError) {
          toast.error('Failed to create driver');
          setIsLoading(false);
          return;
        }

        // Create taxi
        const { data: newTaxi, error: taxiError } = await supabase
          .from('taxis')
          .insert({ 
            plate_number: normalizedPlate, 
            driver_id: newDriver.id,
            type: 'sedan'
          })
          .select('id')
          .single();

        if (taxiError) {
          toast.error('Failed to create taxi');
          setIsLoading(false);
          return;
        }

        taxiId = newTaxi.id;
      }

      // 2. Check if taxi is already in active queue
      const { data: existingEntry } = await supabase
        .from('queue_entries')
        .select('id')
        .eq('taxi_id', taxiId)
        .in('status', ['waiting', 'not_ready', 'returned', 'skipped'])
        .maybeSingle();

      if (existingEntry) {
        toast.error('This taxi is already in the queue');
        setIsLoading(false);
        return;
      }

      // 3. Get next queue number
      const { data: queueNum } = await supabase.rpc('get_next_queue_number', {
        _fermata_id: primaryFermata.id
      });

      // 4. Add to queue
      const { error: queueError } = await supabase
        .from('queue_entries')
        .insert({
          taxi_id: taxiId,
          fermata_id: primaryFermata.id,
          dispatcher_id: user?.id,
          queue_number: queueNum || 1,
          status: 'waiting',
          arrival_time: new Date().toISOString(),
        });

      if (queueError) {
        toast.error('Failed to add to queue: ' + queueError.message);
        console.error(queueError);
      } else {
        toast.success(`${normalizedPlate} added to queue!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchNext = async () => {
    if (!nextDispatchableTaxi) {
      toast.error('No taxi ready to dispatch');
      return;
    }

    if (!primaryFermata) {
      toast.error('No destination assigned');
      return;
    }

    setIsLoading(true);
    const dispatchedAt = new Date().toISOString();

    try {
      await Promise.all([
        supabase
          .from('queue_entries')
          .update({ status: 'dispatched', dispatched_at: dispatchedAt, updated_at: dispatchedAt })
          .eq('id', nextDispatchableTaxi.id),
        supabase.from('dispatch_logs').insert({
          queue_entry_id: nextDispatchableTaxi.id,
          taxi_id: nextDispatchableTaxi.taxi_id,
          fermata_id: primaryFermata.id,
          dispatcher_id: user?.id,
          dispatched_at: dispatchedAt,
        })
      ]);

      toast.success(`${nextDispatchableTaxi.plate_number} dispatched!`);
    } catch (err) {
      console.error(err);
      toast.error('Dispatch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (entryId: string, status: 'not_ready' | 'returned' | 'canceled' | 'waiting') => {
    const { error } = await supabase
      .from('queue_entries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    if (error) {
      toast.error('Status update failed');
      console.error(error);
    } else {
      toast.success('Status updated');
    }
  };

  const exportTodaysLogToCSV = () => {
    if (dispatchLogs.length === 0) {
      toast.error('No dispatches today');
      return;
    }

    const headers = ['Plate', 'Driver', 'Destination', 'Time'];
    const rows = dispatchLogs.map(log => [
      log.queue_entry?.plate_number || '',
      log.queue_entry?.driver_name || '',
      log.fermata ? `${log.fermata.code} - ${log.fermata.name}` : '',
      new Date(log.dispatched_at).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-dispatches-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported!');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Assigned Destination */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Your Assigned Destination:</p>
          <div className="flex flex-wrap gap-2">
            {fermatas.filter(f => user?.assigned_fermata_ids?.includes(f.id)).map(f => (
              <Badge key={f.id} variant="secondary" className="px-3 py-1 text-sm">
                {f.code} - {f.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-card border text-center">
            <Car className="h-8 w-8 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">{waitingCount}</p>
            <p className="text-sm text-muted-foreground">In Your Queue</p>
          </div>
          <div className="p-4 rounded-lg bg-card border text-center">
            <Send className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{dispatchedToday}</p>
            <p className="text-sm text-muted-foreground">Dispatched Today</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Your Taxi Queue</h2>
            <Button 
              onClick={() => {
                loadQueueEntries();
                loadDispatchLogs();
                toast.success('Refreshed');
              }} 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsAddModalOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add to Queue
            </Button>
            <Button
              onClick={handleDispatchNext}
              disabled={!nextDispatchableTaxi || isLoading}
              className="bg-accent hover:bg-accent/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Dispatch Next
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <QueueTableEnhanced
          entries={queueEntries}
          onStatusChange={handleStatusChange}
          onReport={() => toast.success('Report submitted')}
          isLoading={isLoading}
        />

        {/* Today's Log */}
        {dispatchLogs.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Dispatches Today
              </h3>
              <Button onClick={exportTodaysLogToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Plate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Destination</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dispatchLogs.slice(0, 10).map(log => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium">{log.queue_entry?.plate_number}</td>
                        <td className="px-4 py-3">{log.queue_entry?.driver_name}</td>
                        <td className="px-4 py-3">{log.fermata?.code} - {log.fermata?.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(log.dispatched_at).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add to Queue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Taxi to Your Queue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Plate Number</Label>
              <Input
                id="plate"
                placeholder="TX-1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Driver Name</Label>
              <Input
                id="driver"
                placeholder="Full name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToQueue} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add to Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatcherDashboard;
