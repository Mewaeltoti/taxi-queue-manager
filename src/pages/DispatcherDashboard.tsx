import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Car } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas, mockDispatchLogs } from '@/data/mockData';
import { QueueEntry, DispatchLog } from '@/types/taxi';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

const DispatcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(mockQueueEntries);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(mockDispatchLogs);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter assigned fermatas
  const assignedFermatas = mockFermatas.filter(f => user?.assignedFermatas?.includes(f.id));
  const primaryFermata = assignedFermatas[0];

  const waitingEntries = queueEntries.filter(e => e.status === 'waiting');
  const waitingCount = waitingEntries.length;
  const nextTaxi = waitingEntries[0];
  const dispatchedToday = dispatchLogs.length;

  const handleRegisterTaxi = (data: { plateNumber: string; driverName: string; taxiType: string }) => {
    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      queueNumber: waitingCount + 1,
      plateNumber: data.plateNumber,
      driverName: data.driverName,
      arrivalTime: new Date(),
      status: 'waiting',
    };
    setQueueEntries([...queueEntries, newEntry]);
    toast.success(`${data.plateNumber} ${t('addedToQueue')}`);
  };

  const handleDispatchNext = () => {
    if (!nextTaxi) {
      toast.error(t('noTaxiInQueue'));
      return;
    }
    if (!primaryFermata) {
      toast.error(t('noAssignedDestination'));
      return;
    }

    const dispatchedEntry: QueueEntry = {
      ...nextTaxi,
      status: 'dispatched',
      dispatchedAt: new Date(),
      destinationId: primaryFermata.id
    };

    const newLog: DispatchLog = {
      id: Date.now().toString(),
      queueEntry: dispatchedEntry,
      destination: primaryFermata,
      dispatchedAt: new Date(),
    };

    setDispatchLogs(prev => [newLog, ...prev]);
    setQueueEntries(entries => {
      const updated = entries.map(entry =>
        entry.id === nextTaxi.id ? dispatchedEntry : entry
      );
      // Renumber waiting taxis
      let queueNum = 1;
      return updated.map(entry =>
        entry.status === 'waiting' ? { ...entry, queueNumber: queueNum++ } : entry
      );
    });

    toast.success(`${nextTaxi.plateNumber} ${t('dispatchedTo')} ${primaryFermata.code} - ${primaryFermata.name}`);
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

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
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
              disabled={!nextTaxi}
              className="dispatch-button flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {t('dispatchNext')}
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <QueueTable entries={queueEntries} />

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
