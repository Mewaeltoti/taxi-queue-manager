import { useState, useEffect, useMemo, lazy } from 'react';
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
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [taxis, setTaxis] = useState<any[]>([]);
const [selectedTaxi, setSelectedTaxi] = useState<string>('');
  useEffect(() => {
    // Load taxis for dropdown
    supabase
      .from('taxis')
      .select('id, plate_number, driver(name)')
      .then(({ data }) => setTaxis(data || []));
  }, []);
  // Load data — filtered by current dispatcher
  useEffect(() => {
    if (!user) return navigate('/login');
    const loadData = async () => {
      setIsLoading(true);
      // Load fermatas
      const { data: fermData } = await supabase.from('fermatas').select('*');
      setFermatas(fermData || []);
      // Load ONLY this dispatcher's queue entries
      const { data: queueData } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('dispatcher_id', user.id)  // ← Critical: only their taxis
        .order('queue_number', { ascending: true });
      setQueueEntries(queueData || []);
      // Load today's dispatch logs (only this dispatcher's)
      const today = new Date().toLocaleDateString('en-CA');
      const { data: logsData } = await supabase
        .from('dispatch_logs')
        .select('*, queue_entry(id, queue_number, plate_number, driver_name, arrival_time, status, dispatched_at), fermata:fermata_id(code, name)')
        .eq('queue_entry.dispatcher_id', user.id)  // ← Only their dispatches
        .gte('dispatched_at', today + 'T00:00:00')
        .order('dispatched_at', { ascending: false });
      setDispatchLogs(logsData || []);
      setIsLoading(false);
    };
    loadData();
    // Real-time: reload when queue or logs change
    const channel = supabase
      .channel('dispatcher-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_logs' }, loadData)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, navigate]);
  const assignedFermatas = fermatas.filter(f => user?.assigned_fermata_ids?.includes(f.id));
  const primaryFermata = assignedFermatas[0];
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
        dispatcher_id: user.id,  // ← Always set to current user
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
      // Refetch only this dispatcher's queue
      const { data } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('dispatcher_id', user.id)
        .order('queue_number', { ascending: true });
      setQueueEntries(data || []);
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
    // Update queue entry
    await supabase
      .from('queue_entries')
      .update({
        status: 'dispatched',
        dispatched_at: dispatchedAt,
        updated_at: dispatchedAt,
      })
      .eq('id', nextDispatchableTaxi.id);
    // Add to dispatch logs
    await supabase.from('dispatch_logs').insert({
      queue_entry_id: nextDispatchableTaxi.id,
      fermata_id: primaryFermata.id,
      dispatched_at: dispatchedAt,
    });
    // Refetch this dispatcher's data only
    const { data: queue } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('dispatcher_id', user.id)
      .order('queue_number', { ascending: true });
    setQueueEntries(queue || []);
    const today = new Date().toLocaleDateString('en-CA');
    const { data: logs } = await supabase
      .from('dispatch_logs')
      .select('*, queue_entry(id, queue_number, plate_number, driver_name, arrival_time, status, dispatched_at), fermata:fermata_id(code, name)')
      .eq('queue_entry.dispatcher_id', user.id)
      .gte('dispatched_at', today + 'T00:00:00')
      .order('dispatched_at', { ascending: false });
    setDispatchLogs(logs || []);
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
      return;
    }
 
    // Refetch ONLY this dispatcher's queue
    const { data } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('dispatcher_id', user.id)
      .order('queue_number', { ascending: true });
 
    setQueueEntries(data || []);
 
    toast.success('Status updated');
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
    <div className="min-h-screen page-container">
      <main className="content-container pb-28 sm:pb-6">
        {/* Assigned Destination - Mobile Optimized */}
        <div className="mb-4 sm:mb-5 animate-fade-in">
          <p className="text-[11px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium uppercase tracking-wide">{t('yourDestination') || 'Your Destination'}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {assignedFermatas.map(f => (
              <Badge 
                key={f.id} 
                variant="secondary" 
                className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg"
              >
                {f.code} - {f.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats - Mobile First Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-5 sm:mb-6 animate-slide-up">
          <div className="stat-card group p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="stat-card-icon bg-accent/10 h-10 w-10 sm:h-12 sm:w-12">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('queue') || 'Queue'}</span>
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-foreground leading-none">{waitingCount}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mt-1">{t('inQueue') || 'In Queue'}</p>
          </div>
          <div className="stat-card group p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="stat-card-icon bg-success/10 h-10 w-10 sm:h-12 sm:w-12">
                <Send className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('today') || 'Today'}</span>
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-foreground leading-none">{dispatchedToday}</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mt-1">{t('dispatched') || 'Dispatched'}</p>
          </div>
        </div>

        {/* Action Bar - Mobile Optimized */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{t('yourQueue') || 'Taxi Queue'}</h2>
          <div className="hidden sm:flex gap-3">
            <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="rounded-xl h-11 gap-2">
              <Plus className="h-4 w-4" />
              {t('addToQueue') || 'Add to Queue'}
            </Button>
            <Button
              onClick={handleDispatchNext}
              disabled={!nextDispatchableTaxi || isLoading}
              className="dispatch-button h-11 gap-2"
            >
              <Send className="h-4 w-4" />
              {t('dispatchNext') || 'Dispatch Next'}
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <QueueTableEnhanced
            entries={queueEntries}
            onStatusChange={handleStatusChange}
            onReport={() => toast.success('Report submitted')}
            isLoading={isLoading}
          />
        </div>

        {/* Today's Log - Mobile Optimized */}
        {dispatchLogs.length > 0 && (
          <div className="mt-6 sm:mt-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="truncate">{t('yourDispatchesToday') || "Today's Dispatches"}</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{dispatchLogs.length}</Badge>
              </h3>
              <Button onClick={exportTodaysLogToCSV} variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs h-8 px-2 sm:px-3 shrink-0">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('exportCSV') || 'Export'}</span>
              </Button>
            </div>
            
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {dispatchLogs.slice(0, 8).map((log, i) => (
                <div 
                  key={log.id} 
                  className="bg-card rounded-xl border p-3 flex items-center justify-between gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Send className="h-4 w-4 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{log.queue_entry?.plate_number}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{log.queue_entry?.driver_name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="text-[10px] mb-0.5">{log.fermata?.code}</Badge>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(log.dispatched_at).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block premium-card overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('plate') || 'Plate'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('driver') || 'Driver'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('destination') || 'Dest.'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('time') || 'Time'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {dispatchLogs.slice(0, 10).map((log, i) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <td className="px-4 py-3 font-semibold text-sm">{log.queue_entry?.plate_number}</td>
                        <td className="px-4 py-3 text-sm">{log.queue_entry?.driver_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="secondary" className="text-xs">{log.fermata?.code}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
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

      {/* Mobile Bottom Action Bar - Enhanced */}
      <div className="mobile-bottom-nav sm:hidden z-50">
        <div className="flex gap-2.5">
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            variant="outline" 
            className="flex-1 h-[52px] rounded-xl gap-2 text-sm font-semibold border-2 active:scale-[0.98] transition-transform"
          >
            <Plus className="h-5 w-5" />
            <span>{t('add') || 'Add'}</span>
          </Button>
          <Button
            onClick={handleDispatchNext}
            disabled={!nextDispatchableTaxi || isLoading}
            className="flex-[1.5] h-[52px] rounded-xl gap-2 text-sm font-semibold shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:shadow-none"
          >
            <Send className="h-5 w-5" />
            <span>{t('dispatch') || 'Dispatch'}</span>
            {nextDispatchableTaxi && (
              <Badge className="ml-1 bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5">
                #{nextDispatchableTaxi.queue_number}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Add to Queue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('addTaxiToQueue') || 'Add Taxi to Your Queue'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-sm font-medium">{t('plateNumber') || 'Plate Number'}</Label>
              <Input
                id="plate"
                placeholder="TX-1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                autoFocus
                className="modern-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver" className="text-sm font-medium">{t('driverName') || 'Driver Name'}</Label>
              <Input
                id="driver"
                placeholder={t('fullName') || 'Full name'}
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="modern-input"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1 sm:flex-none h-11 rounded-xl">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleAddToQueue} disabled={isLoading} className="flex-1 sm:flex-none h-11 rounded-xl">
              {isLoading ? t('adding') || 'Adding...' : t('addToQueue') || 'Add to Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default DispatcherDashboard;
