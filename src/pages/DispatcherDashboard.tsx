import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Send, Car, Download, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTableEnhanced } from '@/components/dispatcher/QueueTableEnhanced';
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const DispatcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [fermatas, setFermatas] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');

  // Load data
  useEffect(() => {
    if (!user) return navigate('/login');
  
    const loadData = async () => {
      setIsLoading(true);
  
      const { data: fermData } = await supabase.from('fermatas').select('*');
      setFermatas(fermData || []);
  
      const { data: queueData } = await supabase
        .from('queue_entries')
        .select('*')
        .order('queue_number', { ascending: true });
      setQueueEntries(queueData || []);
  
      const today = new Date().toISOString().split('T')[0];
      const { data: logsData } = await supabase
        .from('dispatch_logs')
        .select('*, queue_entry(*), fermata:fermata_id(code, name)')
        .gte('dispatched_at', today)
        .order('dispatched_at', { ascending: false });
      setDispatchLogs(logsData || []);
  
      setIsLoading(false);
    };
  
    loadData();
  
    const channel = supabase
      .channel('dispatcher-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_logs' }, loadData)
      .subscribe();
  
    // Correct cleanup — do NOT return the promise
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const assignedFermatas = fermatas.filter(f => user?.assigned_fermata_ids?.includes(f.id));
  const primaryFermata = assignedFermatas[0];

  const activeEntries = queueEntries.filter(e =>
    ['waiting', 'not_ready', 'returned'].includes(e.status)
  );
  const waitingCount = activeEntries.length;
  const nextDispatchableTaxi = activeEntries.find(e => e.status === 'waiting' || e.status === 'returned');
  const dispatchedToday = dispatchLogs.length;

  // Add to queue directly
  const handleAddToQueue = async () => {
    if (!plateNumber.trim() || !driverName.trim()) {
      toast.error(t('fillAllFields') || 'Please enter plate and driver name');
      return;
    }

    if (!primaryFermata) {
      toast.error(t('noAssignedDestination') || 'You are not assigned to any destination');
      return;
    }

    setIsLoading(true);

    const newQueueNumber = activeEntries.length + 1;

    const { error } = await supabase.from('queue_entries').insert({
      queue_number: newQueueNumber,
      plate_number: plateNumber.trim().toUpperCase(),
      driver_name: driverName.trim(),
      arrival_time: new Date().toISOString(),
      status: 'waiting',
      fermata_id: primaryFermata.id,
      dispatcher_id: user?.id,
    });

    if (error) {
      toast.error('Failed to add to queue');
      console.error(error);
    } else {
      toast.success(`${plateNumber.toUpperCase()} added to queue`);
      setPlateNumber('');
      setDriverName('');
      setIsAddModalOpen(false);

      // Refetch queue
      const { data } = await supabase
        .from('queue_entries')
        .select('*')
        .order('queue_number', { ascending: true });
      setQueueEntries(data || []);
    }

    setIsLoading(false);
  };

  const handleDispatchNext = async () => {
    if (!nextDispatchableTaxi) {
      toast.error(t('noTaxiInQueue') || 'No taxi ready to dispatch');
      return;
    }
    if (!primaryFermata) {
      toast.error(t('noAssignedDestination') || 'No destination assigned');
      return;
    }

    setIsLoading(true);
    const dispatchedAt = new Date().toISOString();

    await supabase
      .from('queue_entries')
      .update({ status: 'dispatched', dispatched_at: dispatchedAt })
      .eq('id', nextDispatchableTaxi.id);

    await supabase.from('dispatch_logs').insert({
      queue_entry_id: nextDispatchableTaxi.id,
      fermata_id: primaryFermata.id,
      dispatched_at: dispatchedAt,
    });

    // Refresh
    const { data: queue } = await supabase.from('queue_entries').select('*').order('queue_number');
    setQueueEntries(queue || []);

    const { data: logs } = await supabase
      .from('dispatch_logs')
      .select('*, queue_entry(*), fermata:fermata_id(code, name)')
      .gte('dispatched_at', new Date().toISOString().split('T')[0])
      .order('dispatched_at', { ascending: false });
    setDispatchLogs(logs || []);

    toast.success(`${nextDispatchableTaxi.plate_number} dispatched to ${primaryFermata.code}`);
    setIsLoading(false);
  };

  const handleStatusChange = async (entryId: string, status: 'not_ready' | 'returned' | 'canceled' | 'waiting') => {
    await supabase
      .from('queue_entries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    const { data } = await supabase.from('queue_entries').select('*').order('queue_number');
    setQueueEntries(data || []);

    toast.success('Status updated');
  };

  const exportTodaysLogToCSV = () => {
    if (dispatchLogs.length === 0) return toast.error('No logs today');

    const headers = ['Plate', 'Driver', 'Destination', 'Time'];
    const rows = dispatchLogs.map(log => [
      log.queue_entry?.plate_number || '',
      log.queue_entry?.driver_name || '',
      log.fermata ? `${log.fermata.code} - ${log.fermata.name}` : '',
      new Date(log.dispatched_at).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispatch-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header associationName={t('appName')} dispatcherName={user.name} onLogout={handleLogout} />

      <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Assigned Destination */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Assigned Destination:</p>
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
          <div className="stat-card p-4 rounded-lg bg-card border">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-accent" />
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
            </div>
          </div>
          <div className="stat-card p-4 rounded-lg bg-card border">
            <div className="flex items-center gap-3">
              <Send className="h-6 w-6 text-success" />
              <div>
                <p className="text-2xl font-bold">{dispatchedToday}</p>
                <p className="text-sm text-muted-foreground">Dispatched Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Taxi Queue</h2>
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
                Today's Dispatches
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

      {/* Simple Add to Queue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Taxi to Queue</DialogTitle>
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
                placeholder="John Doe"
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
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatcherDashboard;