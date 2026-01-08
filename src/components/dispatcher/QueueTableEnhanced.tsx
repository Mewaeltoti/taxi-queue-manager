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
  skipped: 'bg-warning/10 border-l-4 border-l-warning',
  not_ready: 'bg-destructive/10 border-l-4 border-l-destructive',
  returned: 'bg-primary/10 border-l-4 border-l-primary',
  canceled: 'bg-muted text-muted-foreground line-through',
};

const statusBadgeVariants: Record<QueueStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  waiting: 'secondary',
  dispatched: 'default',
  skipped: 'outline',
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
    <div className="premium-card overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden">
        {activeEntries.length === 0 ? (
          <div className="p-10 text-center animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{t('noTaxisInQueue') || 'No taxis in queue'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
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
                  'p-4 transition-all duration-200 touch-target animate-slide-up',
                  isNextInQueue(entry, index) 
                    ? 'queue-row-next bg-gradient-to-r from-primary/10 to-primary/5' 
                    : statusColors[entry.status],
                  !readOnly && 'active:bg-muted/50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm',
                        isNextInQueue(entry, index) 
                          ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-accent/30' 
                          : 'bg-secondary'
                      )}
                    >
                      {entry.queue_number}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base truncate">{entry.plate_number || '—'}</p>
                      <p className="text-sm text-muted-foreground truncate">{entry.driver_name || 'Unknown Driver'}</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        {entry.status !== 'not_ready' && (
                          <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')} className="gap-2 py-3">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            {t('markNotReady') || 'Mark Not Ready'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')} className="gap-2 py-3">
                          <RotateCcw className="h-4 w-4 text-primary" />
                          {t('markReturned') || 'Mark Returned'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(entry.id, 'canceled')}
                          className="text-destructive gap-2 py-3"
                        >
                          <X className="h-4 w-4" />
                          {t('removeFromQueue') || 'Remove from Queue'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenReport(entry)} className="gap-2 py-3">
                          <Flag className="h-4 w-4 text-muted-foreground" />
                          {t('reportTaxi') || 'Report Taxi'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(entry.arrival_time)}</span>
                    </div>
                    <span className={cn(
                      'font-medium',
                      isNextInQueue(entry, index) ? 'text-accent' : 'text-muted-foreground'
                    )}>
                      {formatDuration(entry.arrival_time)}
                    </span>
                  </div>
                  <Badge 
                    variant={statusBadgeVariants[entry.status]} 
                    className={cn(
                      'text-xs',
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
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('plateNumber') || 'Plate'}</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('driver') || 'Driver'}</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('arrivalTime') || 'Arrival'}</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('waitingTime') || 'Waiting'}</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('status') || 'Status'}</th>
              {!readOnly && <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('actions') || 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {activeEntries.length === 0 ? (
              <tr>
                <td colSpan={!readOnly ? 7 : 6} className="px-4 py-16 text-center text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Car className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">{t('noTaxisInQueue') || 'No taxis in queue'}</p>
                </td>
              </tr>
            ) : (
              activeEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'transition-all duration-200 animate-slide-up',
                    isNextInQueue(entry, index) 
                      ? 'queue-row-next bg-gradient-to-r from-primary/10 to-transparent hover:from-primary/15' 
                      : `${statusColors[entry.status]} hover:bg-muted/30`
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-4">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm',
                        isNextInQueue(entry, index) 
                          ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-accent/20' 
                          : 'bg-secondary'
                      )}
                    >
                      {entry.queue_number}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-base">{entry.plate_number || '—'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{entry.driver_name || 'Unknown Driver'}</td>
                  <td className="px-4 py-4 text-muted-foreground">{formatTime(entry.arrival_time)}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'font-semibold',
                      isNextInQueue(entry, index) ? 'text-accent' : 'text-muted-foreground'
                    )}>
                      {formatDuration(entry.arrival_time)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant={statusBadgeVariants[entry.status]}
                      className={cn(
                        isNextInQueue(entry, index) && 'bg-accent text-accent-foreground'
                      )}
                    >
                      {t(entry.status) || entry.status}
                    </Badge>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'not_ready' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 text-xs rounded-lg border-success text-success hover:bg-success/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange?.(entry.id, 'waiting');
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {t('readyNow') || 'Ready'}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-9 w-9 rounded-lg">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            {entry.status !== 'not_ready' && (
                              <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')} className="gap-2 py-2.5">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                {t('markNotReady') || 'Not Ready'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')} className="gap-2 py-2.5">
                              <RotateCcw className="h-4 w-4 text-primary" />
                              {t('markReturned') || 'Returned'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onStatusChange?.(entry.id, 'canceled')}
                              className="text-destructive gap-2 py-2.5"
                            >
                              <X className="h-4 w-4" />
                              {t('removeFromQueue') || 'Cancel'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReport(entry)} className="gap-2 py-2.5">
                              <Flag className="h-4 w-4 text-muted-foreground" />
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