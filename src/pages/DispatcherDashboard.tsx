import { useState, useEffect, useMemo } from 'react';
import { Plus, Send, Car, Download, FileText } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { QueueTableEnhanced } from '@/components/dispatcher/QueueTableEnhanced';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

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

  // Normalize assigned_fermata_ids to always be an array
  const assignedFermataIds = Array.isArray(user?.assigned_fermata_ids) 
    ? user.assigned_fermata_ids 
    : [];

  const assignedFermatas = fermatas.filter(f => assignedFermataIds.includes(f.id));
  const primaryFermata = assignedFermatas[0];

  // Load data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const [{ data: queue }, { data: logs }, { data: ferm }] = await Promise.all([
        supabase
          .from('queue_entries')
          .select('*')
          .eq('dispatcher_id', user.id)
          .order('queue_number', { ascending: true }),
        supabase
          .from('dispatch_logs')
          .select('*, queue_entry(id, queue_number, plate_number, driver_name, arrival_time, status, dispatched_at), fermata:fermata_id(code, name)')
          .gte('dispatched_at', today)
          .order('dispatched_at', { ascending: false }),
        supabase.from('fermatas').select('*')
      ]);

      // Filter logs for this dispatcher
      const filteredLogs = logs?.filter(log => log.queue_entry?.dispatcher_id === user.id) || [];

      setQueueEntries(queue ?? []);
      setDispatchLogs(filteredLogs);
      setFermatas(ferm ?? []);
      setIsLoading(false);
    };

    loadData();

    const channel = supabase
      .channel('dispatcher-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries', filter: `dispatcher_id=eq.${user.id}` },
        loadData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_logs' },
        loadData
      )
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [user]);

  const activeEntries = useMemo(() =>
    queueEntries.filter(e => ['waiting', 'not_ready', 'returned'].includes(e.status)),
    [queueEntries]
  );

  const waitingCount = activeEntries.length;
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
    const newQueueNumber = activeEntries.length + 1;

    // Optimistic update
    const tempId = 'temp-' + Date.now();
    const optimisticEntry = {
      id: tempId,
      queue_number: newQueueNumber,
      plate_number: normalizedPlate,
      driver_name: driverName.trim(),
      arrival_time: new Date().toISOString(),
      status: 'waiting',
    };

    setQueueEntries(prev => [...prev, optimisticEntry]);
    toast.success(`${normalizedPlate} added!`);

    setPlateNumber('');
    setDriverName('');
    setIsAddModalOpen(false);

    const { error } = await supabase
      .from('queue_entries')
      .insert({
        queue_number: newQueueNumber,
        plate_number: normalizedPlate,
        driver_name: driverName.trim(),
        arrival_time: new Date().toISOString(),
        status: 'waiting',
        fermata_id: primaryFermata.id,
        dispatcher_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error('Failed to add');
      console.error(error);
      setQueueEntries(prev => prev.filter(e => e.id !== tempId));
    }
  };

  // ... rest of your functions (handleDispatchNext, handleStatusChange, exportTodaysLogToCSV) remain the same

  if (!user) return null;

  return (
    // ... your JSX remains exactly the same
    // The only change is the assignedFermataIds normalization above
  );
};

export default DispatcherDashboard;
