import { Clock, Car, User, Hash, ArrowRight } from 'lucide-react';
import { QueueEntry } from '@/types/taxi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface QueueTableProps {
  entries: QueueEntry[];
  onDispatch?: (id: string) => void;
  readOnly?: boolean;
}

export function QueueTable({ entries, readOnly = false }: QueueTableProps) {
  const { t } = useLanguage(); // ✅ Use t from context
  const waitingEntries = entries.filter(e => e.status === 'waiting');

  const formatDuration = (arrivalTime: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(arrivalTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins} ${t('minutes')}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} ${t('hours')} ${mins} ${t('minutes')}`;
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('am-ET', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden">
        {waitingEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noTaxisInQueue')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {waitingEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  'p-4 transition-colors animate-slide-up',
                  index === 0 ? 'queue-row-next' : 'queue-row-waiting'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center font-bold',
                        index === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                      )}
                    >
                      #{entry.queueNumber}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.plateNumber}</p>
                      <p className="text-sm text-muted-foreground">{entry.driverName}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                      {t('next')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(entry.arrivalTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowRight className="h-4 w-4" />
                    {formatDuration(entry.arrivalTime)}
                  </span>
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
                {t('status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {waitingEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('noTaxisInQueue')}</p>
                </td>
              </tr>
            ) : (
              waitingEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'transition-colors animate-slide-up',
                    index === 0 ? 'queue-row-next' : 'queue-row-waiting hover:bg-muted/50'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-4">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm',
                        index === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                      )}
                    >
                      {entry.queueNumber}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{entry.plateNumber}</td>
                  <td className="px-4 py-4">{entry.driverName}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatTime(entry.arrivalTime)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'font-medium',
                        index === 0 ? 'text-accent' : 'text-muted-foreground'
                      )}
                    >
                      {formatDuration(entry.arrivalTime)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {index === 0 ? (
                      <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                        {t('next')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t('waiting')}</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
