import { useState } from 'react';
import { Clock, Car, User, Hash, ArrowRight, SkipForward, AlertTriangle, RotateCcw, X, Flag } from 'lucide-react';
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
  onSkip?: (entryId: string) => void;
  onDispatch?: (entryId: string) => void;
  onStatusChange?: (entryId: string, status: 'not_ready' | 'returned' | 'canceled') => void;
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
  onSkip, 
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
    ['waiting', 'skipped', 'not_ready', 'returned'].includes(e.status)
  );

  const formatDuration = (arrivalTime: string): string => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diffMs = now.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins} ${t('minutes')}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} ${t('hours')} ${mins} ${t('minutes')}`;
  };

  const formatTime = (date: string): string => {
    return new Date(date).toLocaleTimeString('am-ET', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusLabel = (status: QueueStatus): string => {
    const labels: Record<QueueStatus, string> = {
      waiting: t('waiting'),
      dispatched: t('dispatched'),
      skipped: t('skipped'),
      not_ready: t('notReady'),
      returned: t('returned'),
      canceled: t('canceled'),
    };
    return labels[status];
  };

  const handleOpenReport = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setReportModalOpen(true);
  };

  const handleSubmitReport = (reason: string, description?: string) => {
    if (selectedEntry && onReport) {
      onReport(selectedEntry.id, selectedEntry.taxi_id, reason, description);
    }
    setReportModalOpen(false);
    setSelectedEntry(null);
  };

  const isNextInQueue = (entry: QueueEntry, index: number) => {
    return index === 0 && entry.status === 'waiting';
  };

  const canSkip = (entry: QueueEntry, index: number) => {
    return !readOnly && 
           ['waiting', 'returned'].includes(entry.status) && 
           index < activeEntries.length - 1;
  };

  return (
    <>
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Mobile View */}
        <div className="lg:hidden">
          {activeEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noTaxisInQueue')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {activeEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'p-4 transition-colors animate-slide-up',
                    isNextInQueue(entry, index) ? 'queue-row-next' : statusColors[entry.status]
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
                        #{entry.queue_number}
                      </div>
                      <div>
                        <p className="font-semibold">{entry.taxi?.plate_number || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.taxi?.driver?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.skip_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {entry.skip_count}x {t('skipped')}
                        </Badge>
                      )}
                      {isNextInQueue(entry, index) ? (
                        <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                          {t('next')}
                        </Badge>
                      ) : (
                        <Badge variant={statusBadgeVariants[entry.status]}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatTime(entry.arrival_time)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ArrowRight className="h-4 w-4" />
                        {formatDuration(entry.arrival_time)}
                      </span>
                    </div>
                    
                    {!readOnly && (
                      <div className="flex gap-1">
                        {canSkip(entry, index) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSkip?.(entry.id)}
                            disabled={isLoading}
                            className="h-8 px-2"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 px-2">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {t('markNotReady')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {t('markReturned')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'canceled')}>
                              <X className="h-4 w-4 mr-2" />
                              {t('removeFromQueue')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenReport(entry)}>
                              <Flag className="h-4 w-4 mr-2" />
                              {t('reportTaxi')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t('queueNumber')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t('plateNumber')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('driver')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('arrivalTime')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('waitingTime')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('skipCount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('status')}
                </th>
                {!readOnly && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('action')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeEntries.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} className="px-4 py-12 text-center text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('noTaxisInQueue')}</p>
                  </td>
                </tr>
              ) : (
                activeEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={cn(
                      'transition-colors animate-slide-up',
                      isNextInQueue(entry, index) ? 'queue-row-next' : statusColors[entry.status],
                      !isNextInQueue(entry, index) && entry.status === 'waiting' && 'hover:bg-muted/50'
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
                    <td className="px-4 py-4 font-semibold">{entry.taxi?.plate_number || 'N/A'}</td>
                    <td className="px-4 py-4">{entry.taxi?.driver?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatTime(entry.arrival_time)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'font-medium',
                          isNextInQueue(entry, index) ? 'text-accent' : 'text-muted-foreground'
                        )}
                      >
                        {formatDuration(entry.arrival_time)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {entry.skip_count > 0 ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          {entry.skip_count}x
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isNextInQueue(entry, index) ? (
                        <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                          {t('next')}
                        </Badge>
                      ) : (
                        <Badge variant={statusBadgeVariants[entry.status]}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canSkip(entry, index) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSkip?.(entry.id)}
                              disabled={isLoading}
                              className="h-8"
                            >
                              <SkipForward className="h-4 w-4 mr-1" />
                              {t('skipOne')}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'not_ready')}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {t('markNotReady')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onStatusChange?.(entry.id, 'returned')}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {t('markReturned')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange?.(entry.id, 'canceled')}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t('removeFromQueue')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenReport(entry)}>
                                <Flag className="h-4 w-4 mr-2" />
                                {t('reportTaxi')}
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
      </div>

      <ReportTaxiModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSubmit={handleSubmitReport}
        taxiPlate={selectedEntry?.taxi?.plate_number}
      />
    </>
  );
}
