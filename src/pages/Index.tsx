import { useState } from 'react';
import { Plus, Send, Car, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { DestinationSelector } from '@/components/dispatcher/DestinationSelector';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas } from '@/data/mockData';
import { QueueEntry } from '@/types/taxi';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Index = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(mockQueueEntries);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const waitingCount = queueEntries.filter(e => e.status === 'waiting').length;
  const nextTaxi = queueEntries.find(e => e.status === 'waiting');

  const handleRegisterTaxi = (data: { plateNumber: string; driverName: string; taxiType: string }) => {
    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      queueNumber: queueEntries.length + 1,
      taxiId: `T${Date.now()}`,
      plateNumber: data.plateNumber,
      driverName: data.driverName,
      arrivalTime: new Date(),
      status: 'waiting',
    };
    setQueueEntries([...queueEntries, newEntry]);
  };

  const handleDispatchNext = () => {
    if (!nextTaxi) {
      toast.error('No taxi in queue');
      return;
    }
    if (!selectedDestination) {
      toast.error('Please select a destination');
      return;
    }

    const destination = mockFermatas.find(f => f.id === selectedDestination);
    
    setQueueEntries(entries => 
      entries.map(entry => 
        entry.id === nextTaxi.id 
          ? { ...entry, status: 'dispatched' as const, dispatchedAt: new Date(), destinationId: selectedDestination }
          : entry
      )
    );

    toast.success(
      `Dispatched ${nextTaxi.plateNumber} to ${destination?.code} - ${destination?.name}`
    );
    setSelectedDestination(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        associationName="Metro Taxi Association" 
        dispatcherName="Alex Johnson"
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
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Send className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Dispatched Today</p>
              </div>
            </div>
          </div>
          <Link to="/reports" className="stat-card hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/fermatas" className="stat-card hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <svg className="h-5 w-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{mockFermatas.length}</p>
                <p className="text-sm text-muted-foreground">Destinations</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold">Taxi Queue</h2>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsRegisterModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register Taxi
            </Button>
            <Button 
              onClick={handleDispatchNext}
              disabled={!nextTaxi || !selectedDestination}
              className="dispatch-button flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Dispatch Next
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
              destinations={mockFermatas}
              selectedId={selectedDestination}
              onSelect={setSelectedDestination}
            />
          </div>
        </div>
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
