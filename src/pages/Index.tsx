import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Car, Users, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { DestinationSelector } from '@/components/dispatcher/DestinationSelector';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas } from '@/data/mockData';
import { QueueEntry } from '@/types/taxi';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';

const Index = () => {
  const { user, logout, isAdmin, isDispatcher } = useAuth();
  const navigate = useNavigate();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(mockQueueEntries);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [dispatchedToday, setDispatchedToday] = useState(12);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter destinations based on role
  const availableDestinations = isAdmin 
    ? mockFermatas 
    : mockFermatas.filter(f => user?.assignedFermatas?.includes(f.id));

  const waitingCount = queueEntries.filter(e => e.status === 'waiting').length;
  const nextTaxi = queueEntries.find(e => e.status === 'waiting');

  const handleRegisterTaxi = (data: { plateNumber: string; driverName: string; taxiType: string }) => {
    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      queueNumber: queueEntries.filter(e => e.status === 'waiting').length + 1,
      plateNumber: data.plateNumber,
      driverName: data.driverName,
      arrivalTime: new Date(),
      status: 'waiting',
    };
    setQueueEntries([...queueEntries, newEntry]);
  };

  const handleDispatchNext = () => {
    if (!nextTaxi) {
      toast.error('ታክሲ ኣብ ወረፋ የለን');
      return;
    }
    if (!selectedDestination) {
      toast.error('መድረሻ ምረጽ');
      return;
    }

    const destination = availableDestinations.find(f => f.id === selectedDestination);
    
    setQueueEntries(entries => {
      const updated = entries.map(entry => 
        entry.id === nextTaxi.id 
          ? { ...entry, status: 'dispatched' as const, dispatchedAt: new Date(), destinationId: selectedDestination }
          : entry
      );
      
      // Renumber waiting taxis
      let queueNum = 1;
      return updated.map(entry =>
        entry.status === 'waiting' ? { ...entry, queueNumber: queueNum++ } : entry
      );
    });

    setDispatchedToday(prev => prev + 1);
    toast.success(`${nextTaxi.plateNumber} ናብ ${destination?.code} - ${destination?.name} ተላኢኹ`);
    setSelectedDestination(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        associationName={t.appName}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Car className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-muted-foreground">{t.inQueue}</p>
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
                <p className="text-sm text-muted-foreground">{t.dispatchedToday}</p>
              </div>
            </div>
          </div>
          {isAdmin && (
            <>
              <Link to="/reports" className="stat-card hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-sm text-muted-foreground">{t.activeDrivers}</p>
                  </div>
                </div>
              </Link>
              <Link to="/admin/fermatas" className="stat-card hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <MapPin className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{mockFermatas.length}</p>
                    <p className="text-sm text-muted-foreground">{t.destinations}</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold">{t.taxiQueue}</h2>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsRegisterModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.registerTaxi}
            </Button>
            <Button 
              onClick={handleDispatchNext}
              disabled={!nextTaxi || !selectedDestination}
              className="dispatch-button flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {t.dispatchNext}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QueueTable entries={queueEntries} />
          </div>
          <div className="lg:col-span-1">
            <DestinationSelector 
              destinations={availableDestinations}
              selectedId={selectedDestination}
              onSelect={setSelectedDestination}
            />
          </div>
        </div>

        {/* Admin Quick Links */}
        {isAdmin && (
          <div className="mt-6 p-4 bg-muted/30 rounded-xl">
            <h3 className="font-medium mb-3">{t.adminPanel}</h3>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/drivers">
                <Button variant="outline" size="sm">{t.manageDrivers}</Button>
              </Link>
              <Link to="/admin/taxis">
                <Button variant="outline" size="sm">{t.manageTaxis}</Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" size="sm">{t.manageUsers}</Button>
              </Link>
              <Link to="/admin/fermatas">
                <Button variant="outline" size="sm">{t.manageFermatas}</Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" size="sm">{t.reports}</Button>
              </Link>
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

export default Index;
