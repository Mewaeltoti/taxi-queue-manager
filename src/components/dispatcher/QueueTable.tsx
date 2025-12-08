import { Clock, Car, User, Hash, ArrowRight } from 'lucide-react';
import { QueueEntry } from '@/types/taxi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QueueTableProps {
  entries: QueueEntry[];
  onDispatch?: (id: string) => void;
}

function formatDuration(arrivalTime: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - arrivalTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

export function QueueTable({ entries }: QueueTableProps) {
  const waitingEntries = entries.filter(e => e.status === 'waiting');

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden">
        {waitingEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No taxis in queue</p>
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
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center font-bold',
                      index === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                    )}>
                      #{entry.queueNumber}
                    </div>
                    <div>
                      <p className="font-semibold">{entry.plateNumber}</p>
                      <p className="text-sm text-muted-foreground">{entry.driverName}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                      Next
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
                    Waiting {formatDuration(entry.arrivalTime)}
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
                  Queue
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Plate
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Driver
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Arrival
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Waiting
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {waitingEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No taxis in queue</p>
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
                    <div className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm',
                      index === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary'
                    )}>
                      {entry.queueNumber}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold">{entry.plateNumber}</td>
                  <td className="px-4 py-4">{entry.driverName}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatTime(entry.arrivalTime)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'font-medium',
                      index === 0 ? 'text-accent' : 'text-muted-foreground'
                    )}>
                      {formatDuration(entry.arrivalTime)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {index === 0 ? (
                      <Badge className="bg-accent text-accent-foreground animate-pulse-subtle">
                        Next
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Waiting</Badge>
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
