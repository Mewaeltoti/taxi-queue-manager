import { Clock, MapPin, Car, Download } from 'lucide-react';
import { DispatchLog } from '@/types/taxi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DispatchLogTableProps {
  logs: DispatchLog[];
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatDuration(arrivalTime: Date, dispatchTime: Date): string {
  const diffMs = dispatchTime.getTime() - arrivalTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  return `${diffMins} min`;
}

export function DispatchLogTable({ logs, onExportCSV, onExportPDF }: DispatchLogTableProps) {
  return (
    <div className="bg-card rounded-xl border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="font-semibold">Dispatch Log</h3>
          <Badge variant="secondary">{logs.length} entries</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden divide-y">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No dispatch records</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{log.queueEntry.plateNumber}</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Dispatched
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{log.queueEntry.driverName}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {log.destination.code} - {log.destination.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Dispatched at {formatTime(log.dispatchedAt)}</span>
                <span>Wait: {formatDuration(log.queueEntry.arrivalTime, log.dispatchedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Taxi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Driver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Destination
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Wait Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No dispatch records</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatTime(log.dispatchedAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {log.queueEntry.plateNumber}
                  </td>
                  <td className="px-4 py-3">
                    {log.queueEntry.driverName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded bg-secondary flex items-center justify-center text-xs font-bold">
                        {log.destination.code}
                      </span>
                      <span>{log.destination.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDuration(log.queueEntry.arrivalTime, log.dispatchedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Dispatched
                    </Badge>
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
