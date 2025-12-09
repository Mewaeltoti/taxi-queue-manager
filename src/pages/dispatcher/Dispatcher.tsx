"use client";

import { useState } from 'react';
import { Plus, Send, Car } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { DestinationSelector } from '@/components/dispatcher/DestinationSelector';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QueueEntry } from '@/types/taxi';
import { mockQueueEntries, mockFermatas } from '@/data/mockData';

export default function DispatcherPage() {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(mockQueueEntries);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const nextTaxi = queueEntries.find(e => e.status === 'waiting');

  const handleRegisterTaxi = (data: { plateNumber: string; driverName: string; taxiType: string }) => {
   const newEntry: QueueEntry = {
  id: Date.now().toString(),
  queueNumber: queueEntries.length + 1,
  plateNumber: data.plateNumber,
  driverName: data.driverName,
  arrivalTime: new Date(),
  status: 'waiting',
};
    setQueueEntries([...queueEntries, newEntry]);
    setIsRegisterModalOpen(false);
    toast.success(`Taxi ${data.plateNumber} registered`);
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

    setQueueEntries((prev: QueueEntry[]) => {
      const updated: QueueEntry[] = prev.map(entry =>
        entry.id === nextTaxi.id
          ? { 
              ...entry, 
              status: 'dispatched', 
              destinationId: selectedDestination, 
              dispatchedAt: new Date() 
            }
          : entry
      );
    
      // Optional: renumber waiting taxis
      let queueNum = 1;
      const renumbered = updated.map(entry =>
        entry.status === 'waiting' ? { ...entry, queueNumber: queueNum++ } : entry
      );
    
      return renumbered;
    });
    
    const destination = mockFermatas.find(f => f.id === selectedDestination);
    toast.success(`Dispatched ${nextTaxi.plateNumber} to ${destination?.code} - ${destination?.name}`);
    setSelectedDestination(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header associationName="Metro Taxi Association" dispatcherName="Alex Johnson" />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold">Taxi Queue</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsRegisterModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" /> Register Taxi
            </Button>
            <Button
              onClick={handleDispatchNext}
              disabled={!nextTaxi || !selectedDestination}
              className="flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" /> Dispatch Next
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

      {/* Register Taxi Modal */}
      <RegisterTaxiModal
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSubmit={handleRegisterTaxi}
      />
    </div>
  );
}
