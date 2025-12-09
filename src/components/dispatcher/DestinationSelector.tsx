import { MapPin, Check } from 'lucide-react';
import { Fermata } from '@/types/taxi';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';

interface DestinationSelectorProps {
  destinations: Fermata[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DestinationSelector({ destinations, selectedId, onSelect }: DestinationSelectorProps) {
  return (
    <div className="bg-card rounded-xl border p-4 lg:p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">{t.selectDestination}</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {destinations.map((dest) => (
          <button
            key={dest.id}
            onClick={() => onSelect(dest.id)}
            className={cn(
              'destination-chip text-left',
              selectedId === dest.id 
                ? 'destination-chip-selected' 
                : 'destination-chip-unselected'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm',
                selectedId === dest.id 
                  ? 'bg-accent-foreground/20' 
                  : 'bg-secondary'
              )}>
                {dest.code}
              </span>
              <span className="text-sm font-medium truncate">{dest.name}</span>
            </div>
          </button>
        ))}
      </div>

      {destinations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>ዝተመደበልካ መድረሻ የለን</p>
        </div>
      )}
    </div>
  );
}
