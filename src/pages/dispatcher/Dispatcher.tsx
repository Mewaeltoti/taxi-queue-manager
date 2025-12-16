"use client";

import { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { DestinationSelector } from '@/components/dispatcher/DestinationSelector';
import { RegisterTaxiModal } from '@/components/dispatcher/RegisterTaxiModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QueueEntry } from '@/types/taxi';
import { mockQueueEntries, mockFermatas } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DispatcherPage() {
  const { t } = useLanguage();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>(mockQueueEntries);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const nextTaxi = queueEntries.find(e => e.status === 'waiting');

  const handleRegisterTaxi = async (data: {
    plateNumber: string;
    driverName: string;
    taxiType: string;
  }) => {
    // Simulate API delay (remove when backend is ready)
    await new Promise(res => setTimeout(res, 300));

    const waitingCount = queueEntries.filter(e => e.status === 'waiting').length;

    const newEntry: QueueEntry = {
      id: Date.now().toString(),
      queueNumber: waitingCount + 1,
      plateNumber: data.plateNumber,
      driverName: data.driverName,
      arrivalTime: new Date(),
      status: 'waiting',
    };

    setQueueEntries(prev => [...prev, newEntry]);

    toast.success(
      `${t('taxiRegistered')} ${data.plateNumber}`
    );
  };


  const handleDispatchNext = () => {
    if (!nextTaxi) {
      toast.error(t('noTaxiInQueue'));
      return;
    }
    if (!selectedDestination) {
      toast.error(t('selectDestinationFirst'));
      return;
    }

    setQueueEntries(prev => {
      let queueNum = 1;
      return prev.map(entry =>
        entry.id === nextTaxi.id
          ? { ...entry, status: 'dispatched', destinationId: selectedDestination, dispatchedAt: new Date() }
          : entry.status === 'waiting'
            ? { ...entry, queueNumber: queueNum++ }
            : entry
      );
    });

    const destination = mockFermatas.find(f => f.id === selectedDestination);
    toast.success(`t('dispatchedTaxi', { plate: nextTaxi.plateNumber, code: destination?.code, name: destination?.name })`);
    setSelectedDestination(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header associationName={t('appName')} dispatcherName={t('dispatcherNameExample')} />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold">{t('taxiQueue')}</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsRegisterModalOpen(true)} variant="outline" className="flex-1 sm:flex-initial">
              <Plus className="h-4 w-4 mr-2" /> {t('registerTaxi')}
            </Button>
            <Button
              onClick={handleDispatchNext}
              disabled={!nextTaxi || !selectedDestination}
              className="flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" /> {t('dispatchNext')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QueueTable entries={queueEntries} />
          </div>
          <div className="lg:col-span-1">
            <DestinationSelector
              destinations={mockFermatas}
              selectedId={selectedDestination}
              onSelect={setSelectedDestination}
              placeholder={t('selectDestination')}
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
}
