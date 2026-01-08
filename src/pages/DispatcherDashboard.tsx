import { useState, useEffect, useMemo } from 'react';
import { Plus, Send, Car, Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

  const primaryFermata = fermatas.find(f => user?.assigned_fermata_ids?.includes(f.id));

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);

      const [{ data: queue }, { data: logs }, { data: ferm }] = await Promise.all([
        supabase
          .from('queue_entries')
          .select('*')
          .eq('dispatcher_id', user.id)
          .order('queue_number', { ascending: true }),
        supabase
          .from('dispatch_logs')
          .select('*, queue_entry!inner(plate_number, driver_name), fermata:fermata_id(code, name)')
          .eq('queue_entry.dispatcher_id', user.id)
          .gte('dispatched_at', new Date().toISOString().split('T')[0])
          .order('dispatched_at', { ascending: false }),
        supabase.from('fermatas').select('*')
      ]);

      setQueueEntries(queue ?? []);
      setDispatchLogs(logs ?? []);
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

    const newQueueNumber = activeEntries.length + 1;

    const { error } = await supabase
      .from('queue_entries')
      .insert({
        queue_number: newQueueNumber,
        plate_number: plateNumber.trim().toUpperCase(),
        driver_name: driverName.trim(),
        arrival_time: new Date().toISOString(),
        status: 'waiting',
        fermata_id: primaryFermata.id,
        dispatcher_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error('Failed to add: ' + error.message);
      console.error(error);
    } else {
      toast.success(`${plateNumber.toUpperCase()} added to queue!`);
      setPlateNumber('');
      setDriverName('');
      setIsAddModalOpen(false);
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

    const csv = [headers.join(','), ...rows.map(r => `"${r.join('","')}"`)].join('\n');
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="p-4 pt-20 lg:p-8 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3">Your Queue</h1>
          <p className="text-xl lg:text-2xl text-muted-foreground">
            {primaryFermata ? `${primaryFermata.code} - ${primaryFermata.name}` : 'No destination assigned'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <Card className="text-center py-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-2xl">
            <Car className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <p className="text-6xl font-bold">{waitingCount}</p>
            <p className="text-xl mt-2 opacity-90">In Queue</p>
          </Card>

          <Card className="text-center py-8 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-2xl">
            <Send className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <p className="text-6xl font-bold">{dispatchedToday}</p>
            <p className="text-xl mt-2 opacity-90">Dispatched Today</p>
          </Card>
        </div>

        {/* BIG NEXT TO DISPATCH CARD */}
        {nextDispatchableTaxi && (
          <Card className="mb-12 border-4 border-accent/50 shadow-2xl bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="pt-10 pb-12">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="text-center sm:text-left">
                  <p className="text-xl text-muted-foreground mb-4 uppercase tracking-wider">
                    Next to Dispatch
                  </p>
                  <p className="text-7xl font-bold tracking-tight">
                    {nextDispatchableTaxi.plate_number}
                  </p>
                  <p className="text-4xl text-muted-foreground mt-6">
                    {nextDispatchableTaxi.driver_name}
                  </p>
                  {nextDispatchableTaxi.status === 'returned' && (
                    <Badge variant="destructive" className="mt-6 text-xl px-6 py-3">
                      Returned — Ready Again
                    </Badge>
                  )}
                </div>
                <Button
  onClick={handleDispatchNext}
  disabled={!nextDispatchableTaxi || isLoading}
  size="lg"
  className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 shadow-lg"
>
  <Send className="h-8 w-8 mr-4" />
  Dispatch Next
</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Current Queue</h2>
          <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-6 w-6 mr-3" />
            Add Taxi
          </Button>
        </div>

        {/* Full Queue Table */}
        <QueueTableEnhanced
          entries={queueEntries}
          onStatusChange={handleStatusChange}
          onReport={() => toast.success('Report submitted')}
          isLoading={isLoading}
        />

        {/* Today's Dispatches */}
        {dispatchLogs.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Today's Dispatches</h2>
              <Button variant="outline" size="lg" onClick={exportTodaysLogToCSV}>
                <Download className="h-6 w-6 mr-3" />
                Export CSV
              </Button>
            </div>
            <Card className="shadow-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-muted to-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase">Plate</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase">Driver</th>
                        <th className="px-6 py-4 text-left text-sm font-medium uppercase">Destination</th>
                        <th className="px-6 py-4 text-right text-sm font-medium uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dispatchLogs.map(log => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-xl">
                            {log.queue_entry?.plate_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-xl">{log.queue_entry?.driver_name || '-'}</td>
                          <td className="px-6 py-4">
                            {log.fermata ? (
                              <Badge variant="secondary" className="text-lg px-5 py-3">
                                {log.fermata.code} - {log.fermata.name}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right text-xl text-muted-foreground">
                            {new Date(log.dispatched_at).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Add to Queue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Taxi to Queue</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-lg">Plate Number</Label>
              <Input
                id="plate"
                placeholder="TX-1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="text-2xl h-16"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver" className="text-lg">Driver Name</Label>
              <Input
                id="driver"
                placeholder="Full name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="text-xl h-14"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="lg" className="text-xl px-10" onClick={handleAddToQueue}>
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatcherDashboard;
