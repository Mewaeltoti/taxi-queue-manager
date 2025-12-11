import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Send, Car, Download, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTableEnhanced } from '@/components/dispatcher/QueueTableEnhanced';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas, mockDispatchLogs } from '@/data/mockData';
import { QueueEntry as MockQueueEntry, DispatchLog } from '@/types/taxi';
import { QueueEntry } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

const DispatcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Convert mock data to enhanced format
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(() => 
    mockQueueEntries.map((entry, index) => ({
      id: entry.id,
      taxi_id: entry.id,
      fermata_id: 'fermata-1',
      queue_number: entry.queueNumber,
      arrival_time: entry.arrivalTime.toISOString(),
      status: entry.status as QueueEntry['status'],
      skip_count: 0,
      dispatcher_id: null,
      dispatched_at: entry.dispatchedAt?.toISOString() || null,
      last_skip_at: null,
      created_at: entry.arrivalTime.toISOString(),
      updated_at: entry.arrivalTime.toISOString(),
      taxi: {
        id: entry.id,
        plate_number: entry.plateNumber,
        type: 'sedan',
        is_suspended: false,
        driver_id: null,
        association_id: null,
        created_at: entry.arrivalTime.toISOString(),
        updated_at: entry.arrivalTime.toISOString(),
        driver: {
          id: entry.id,
          name: entry.driverName,
          phone: null,
          license_id: null,
          association_id: null,
          created_at: entry.arrivalTime.toISOString(),
          updated_at: entry.arrivalTime.toISOString(),
        }
      }
    }))
  );
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(mockDispatchLogs);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter assigned fermatas
  const assignedFermatas = mockFermatas.filter(f => user?.assignedFermatas?.includes(f.id));
  const primaryFermata = assignedFermatas[0];

  const activeEntries = queueEntries.filter(e => 
    ['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
  );
  const waitingCount = activeEntries.length;
  const nextTaxi = activeEntries[0];
  const dispatchedToday = dispatchLogs.length;

  const handleRegisterTaxi = (data: { plateNumber: string; driverName: string; taxiType: string }) => {
    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      taxi_id: Date.now().toString(),
      fermata_id: primaryFermata?.id || 'fermata-1',
      queue_number: waitingCount + 1,
      arrival_time: new Date().toISOString(),
      status: 'waiting',
      skip_count: 0,
      dispatcher_id: user?.id || null,
      dispatched_at: null,
      last_skip_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      taxi: {
        id: Date.now().toString(),
        plate_number: data.plateNumber,
        type: data.taxiType,
        is_suspended: false,
        driver_id: null,
        association_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        driver: {
          id: Date.now().toString(),
          name: data.driverName,
          phone: null,
          license_id: null,
          association_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    };
    setQueueEntries([...queueEntries, newEntry]);
    toast.success(`${data.plateNumber} ${t('addedToQueue')}`);
  };

  // Get the first waiting taxi (not not_ready)
  const nextDispatchableTaxi = activeEntries.find(e => e.status === 'waiting' || e.status === 'returned');

  const handleDispatchNext = () => {
    if (!nextDispatchableTaxi) {
      // Check if there are taxis but all are not_ready
      if (activeEntries.length > 0 && activeEntries[0].status === 'not_ready') {
        toast.error(t('taxiNotReadyError'));
        return;
      }
      toast.error(t('noTaxiInQueue'));
      return;
    }
    if (!primaryFermata) {
      toast.error(t('noAssignedDestination'));
      return;
    }

    const newLog: DispatchLog = {
      id: Date.now().toString(),
      dispatchedAt: new Date(),
      destination: primaryFermata,
      queueEntry: {
        id: nextDispatchableTaxi.id,
        queueNumber: nextDispatchableTaxi.queue_number,
        plateNumber: nextDispatchableTaxi.taxi?.plate_number || '',
        driverName: nextDispatchableTaxi.taxi?.driver?.name || 'Unknown',
        arrivalTime: new Date(nextDispatchableTaxi.arrival_time),
        status: 'dispatched',
      }
    };

    setQueueEntries(entries => {
      const updated = entries.map(entry =>
        entry.id === nextDispatchableTaxi.id 
          ? { ...entry, status: 'dispatched' as const, dispatched_at: new Date().toISOString() } 
          : entry
      );
      // Renumber active entries
      let queueNum = 1;
      return updated.map(entry =>
        ['waiting', 'skipped', 'not_ready', 'returned'].includes(entry.status) 
          ? { ...entry, queue_number: queueNum++ } 
          : entry
      );
    });

    setDispatchLogs(logs => [newLog, ...logs]);
    toast.success(`${nextDispatchableTaxi.taxi?.plate_number} ${t('dispatchedTo')} ${primaryFermata.code} - ${primaryFermata.name}`);
  };

  const handleSkip = (entryId: string, positions: number) => {
    setIsLoading(true);
    
    setQueueEntries(entries => {
      const activeOnly = entries.filter(e => 
        ['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
      );
      const inactiveEntries = entries.filter(e => 
        !['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
      );

      const currentIndex = activeOnly.findIndex(e => e.id === entryId);
      if (currentIndex === -1 || currentIndex >= activeOnly.length - 1) {
        return entries;
      }

      // Calculate new index (can't go beyond last position)
      const newIndex = Math.min(currentIndex + positions, activeOnly.length - 1);
      
      // Remove from current position and insert at new position
      const [movedEntry] = activeOnly.splice(currentIndex, 1);
      const updatedEntry = { 
        ...movedEntry, 
        status: 'skipped' as const, 
        skip_count: movedEntry.skip_count + 1,
        last_skip_at: new Date().toISOString()
      };
      activeOnly.splice(newIndex, 0, updatedEntry);

      // Renumber queue
      const renumbered = activeOnly.map((entry, idx) => ({
        ...entry,
        queue_number: idx + 1
      }));

      return [...renumbered, ...inactiveEntries];
    });

    toast.success(t('taxiSkippedSuccessfully'));
    setIsLoading(false);
  };

  const handleStatusChange = (entryId: string, status: 'not_ready' | 'returned' | 'canceled' | 'waiting') => {
    setQueueEntries(entries => {
      const updated = entries.map(entry =>
        entry.id === entryId 
          ? { ...entry, status, updated_at: new Date().toISOString() } 
          : entry
      );
      
      // If canceled, renumber remaining active entries
      if (status === 'canceled') {
        const active = updated.filter(e => 
          ['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
        );
        const inactive = updated.filter(e => 
          !['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
        );
        const renumbered = active.map((entry, idx) => ({
          ...entry,
          queue_number: idx + 1
        }));
        return [...renumbered, ...inactive];
      }
      
      return updated;
    });

    const statusMessages: Record<string, string> = {
      not_ready: t('markedNotReady'),
      returned: t('markedReturned'),
      canceled: t('removedFromQueue'),
      waiting: t('markedReady'),
    };
    toast.success(statusMessages[status]);
  };

  const handleReport = (entryId: string, taxiId: string, reason: string, description?: string) => {
    // TODO: Connect to Supabase to create report
    toast.success(t('reportSubmitted'));
  };

  const exportTodaysLogToCSV = () => {
    if (dispatchLogs.length === 0) {
      toast.error(t('noDataToExport'));
      return;
    }

    const headers = [
      t('plateNumber'),
      t('driverName'),
      t('destination'),
      t('dispatchTime'),
    ];

    const rows = dispatchLogs.map(log => [
      log.queueEntry.plateNumber,
      log.queueEntry.driverName,
      `${log.destination.code} - ${log.destination.name}`,
      log.dispatchedAt.toLocaleString('am-ET'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dispatch-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('exportCSVSuccess'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Assigned Fermata Badge */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">{t('assignedDestinations')}:</p>
          <div className="flex flex-wrap gap-2">
            {assignedFermatas.map(f => (
              <Badge key={f.id} variant="secondary" className="px-3 py-1 text-sm">
                {f.code} - {f.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Car className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-muted-foreground">{t('inQueue')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Send className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dispatchedToday}</p>
                <p className="text-sm text-muted-foreground">{t('dispatchedToday')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold">{t('taxiQueue')}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsRegisterModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('registerTaxi')}
            </Button>
            <Button
              onClick={handleDispatchNext}
              disabled={!nextDispatchableTaxi}
              className="dispatch-button flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {t('dispatchNext')}
            </Button>
          </div>
        </div>

        {/* Enhanced Queue Table */}
        <QueueTableEnhanced 
          entries={queueEntries}
          onSkip={handleSkip}
          onStatusChange={handleStatusChange}
          onReport={handleReport}
          isLoading={isLoading}
        />

        {/* Today's Dispatch Log */}
        {dispatchLogs.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('todaysDispatchLog')}
              </h3>
              <div className="flex gap-2">
                <Button onClick={exportTodaysLogToCSV} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('exportCSV')}
                </Button>
                <Link to="/dispatcher/reports">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    {t('viewAllReports')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('plateNumber')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('driver')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('destination')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dispatchTime')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dispatchLogs.slice(0, 10).map(log => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{log.queueEntry.plateNumber}</td>
                        <td className="px-4 py-3">{log.queueEntry.driverName}</td>
                        <td className="px-4 py-3">{log.destination.code} - {log.destination.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.dispatchedAt.toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}
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

      <RegisterTaxiModal
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSubmit={handleRegisterTaxi}
      />
    </div>
  );
};

export default DispatcherDashboard;