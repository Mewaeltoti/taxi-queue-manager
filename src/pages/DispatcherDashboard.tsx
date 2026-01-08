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

  const assignedFermatas = fermatas.filter(f => user?.assigned_fermata_ids?.includes(f.id));
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

  // Filter logs for this dispatcher in code (safe way)
  const filteredLogs = logs?.filter(log => log.queue_entry?.dispatcher_id === user.id) || [];

  setQueueEntries(queue ?? []);
  setDispatchLogs(filteredLogs);
  setFermatas(ferm ?? []);
  setIsLoading(false);
};

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

  // Optimistic update — show instantly
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

  // Save to Supabase — simple fields only
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

    await Promise.all([
      supabase
        .from('queue_entries')
        .update({ status: 'dispatched', dispatched_at: dispatchedAt, updated_at: dispatchedAt })
        .eq('id', nextDispatchableTaxi.id),
      supabase.from('dispatch_logs').insert({
        queue_entry_id: nextDispatchableTaxi.id,
        fermata_id: primaryFermata.id,
        dispatched_at: dispatchedAt,
      })
    ]);

    toast.success(`${nextDispatchableTaxi.plate_number} dispatched!`);
    setIsLoading(false);
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
            {assignedFermatas.map(f => (
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
          <h2 className="text-2xl font-bold">Your Taxi Queue</h2>
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
            <DialogDescription>
              Enter the plate number and driver name to add a taxi.
            </DialogDescription>
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
