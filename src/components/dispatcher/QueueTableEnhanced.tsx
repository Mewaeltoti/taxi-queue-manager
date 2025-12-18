import { useState } from 'react';
import { Clock, Car, User, Hash, AlertTriangle, RotateCcw, X, Flag, CheckCircle } from 'lucide-react';
import { QueueEntry, QueueStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportTaxiModal } from './ReportTaxiModal';

interface QueueTableEnhancedProps {
  entries: QueueEntry[];
  onDispatch?: (entryId: string) => void;
  onStatusChange?: (entryId: string, status: 'not_ready' | 'returned' | 'canceled' | 'waiting') => void;
  onReport?: (entryId: string, taxiId: string, reason: string, description?: string) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

const statusColors: Record<QueueStatus, string> = {
  waiting: 'bg-queue-waiting',
  dispatched: 'bg-queue-dispatched text-muted-foreground',
  not_ready: 'bg-destructive/10 border-l-4 border-l-destructive',
  returned: 'bg-primary/10 border-l-4 border-l-primary',
  canceled: 'bg-muted text-muted-foreground line-through',
};

const statusBadgeVariants: Record<QueueStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  waiting: 'secondary',
  dispatched: 'default',
   not_ready: 'destructive',
  returned: 'secondary',
  canceled: 'outline',
};

export function QueueTableEnhanced({
  entries,
  onDispatch,
  onStatusChange,
  onReport,
  readOnly = false,
  isLoading = false
}: QueueTableEnhancedProps) {
  const { t } = useLanguage();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);

  const activeEntries = entries.filter(e =>
    e && ['waiting', 'not_ready', 'returned'].includes(e.status)
  );

  const formatDuration = (arrivalTime: string): string => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diffMs = now.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutes') || 'min'}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} ${t('hours') || 'h'} ${mins > 0 ? `${mins} ${t('minutes') || 'min'}` : ''}`;
  };

  const formatTime = (arrivalTime: string): string => {
    return new Date(arrivalTime).toLocaleTimeString('am-ET', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isNextInQueue = (entry: QueueEntry, index: number) => {
    return index === 0 && entry.status === 'waiting';
  };

  const handleOpenReport = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setReportModalOpen(true);
  };

  const handleSubmitReport = (reason: string, description?: string) => {
    if (selectedEntry) {
      onReport?.(selectedEntry.id, selectedEntry.id, reason, description); // taxi_id not used anymore
    }
    setReportModalOpen(false);
    setSelectedEntry(null);
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden space-y-0">
        {activeEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noTaxisInQueue') || 'No taxis in queue'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeEntries.map((entry, index) => (
              <div
                key={entry.id}
                onClick={() => !readOnly && isNextInQueue(entry, index) && onDispatch?.(entry.id)}
                onTouchEnd={() => {
                  if (isNextInQueue(entry, index) && !readOnly) {
                    navigator.vibrate?.([50, 30, 50]);
                  }
                }}
                className={cn(
                  'p-4 transition-colors animate-slide-up cursor-pointer',
                  isNextInQueue(entry, index) ? 'queue-row-next animate-pulse' : statusColors[entry.status]
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center font-bold',
                        isNextInQueue(entry, index) ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                      )}
                    >
                      {entry.queue_number}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.plate_number || '—'}</p>
                      <p className="text-sm text-muted-foreground">{entry.driver_name || 'Unknown Driver'}</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {entry.status !== 'not_ready' && (
                          <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {t('markNotReady') || 'Mark Not Ready'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {t('markReturned') || 'Mark Returned'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(entry.id, 'canceled')}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('removeFromQueue') || 'Remove from Queue'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenReport(entry)}>
                          <Flag className="h-4 w-4 mr-2" />
                          {t('reportTaxi') || 'Report Taxi'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(entry.arrival_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      'font-medium',
                      isNextInQueue(entry, index) ? 'text-accent' : 'text-muted-foreground'
                    )}>
                      {formatDuration(entry.arrival_time)}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge 
                    variant={statusBadgeVariants[entry.status]} 
                    className={cn(
                      entry.status === 'waiting' && isNextInQueue(entry, index) && 'animate-pulse-subtle bg-accent text-accent-foreground'
                    )}
                  >
                    {t(entry.status) || entry.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('plateNumber') || 'Plate'}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('driver') || 'Driver'}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('arrivalTime') || 'Arrival'}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('waitingTime') || 'Waiting'}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('status') || 'Status'}</th>
              {!readOnly && <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('actions') || 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeEntries.length === 0 ? (
              <tr>
                <td colSpan={!readOnly ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('noTaxisInQueue') || 'No taxis in queue'}</p>
                </td>
              </tr>
            ) : (
              activeEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'transition-colors animate-slide-up',
                    isNextInQueue(entry, index) ? 'queue-row-next hover:bg-accent/10' : `${statusColors[entry.status]} hover:bg-muted/50`
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-4">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm',
                        isNextInQueue(entry, index) ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                      )}
                    >
                      {entry.queue_number}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{entry.plate_number || '—'}</td>
                  <td className="px-4 py-4">{entry.driver_name || 'Unknown Driver'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{formatTime(entry.arrival_time)}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'font-medium',
                      isNextInQueue(entry, index) ? 'text-accent' : 'text-muted-foreground'
                    )}>
                      {formatDuration(entry.arrival_time)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusBadgeVariants[entry.status]}>
                      {t(entry.status) || entry.status}
                    </Badge>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.status === 'not_ready' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs border-success text-success hover:bg-success/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange?.(entry.id, 'waiting');
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('readyNow') || 'Ready'}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {entry.status !== 'not_ready' && (
                              <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {t('markNotReady') || 'Not Ready'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {t('markReturned') || 'Returned'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onStatusChange?.(entry.id, 'canceled')}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              {t('removeFromQueue') || 'Cancel'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReport(entry)}>
                              <Flag className="h-4 w-4 mr-2" />
                              {t('reportTaxi') || 'Report'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReportTaxiModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSubmit={handleSubmitReport}
        taxiPlate={selectedEntry?.plate_number || ''}
      />
    </div>
  );
}