import { Car, Clock, MapPin, Timer } from 'lucide-react';
import { DailyStats } from '@/types/taxi';

interface StatsCardsProps {
  stats: DailyStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Dispatched',
      value: stats.totalDispatched,
      icon: Car,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Peak Hour',
      value: stats.peakHour,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Top Destination',
      value: stats.mostFrequentDestination,
      icon: MapPin,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Avg Wait Time',
      value: `${stats.averageWaitTime} min`,
      icon: Timer,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div 
          key={card.label}
          className="stat-card animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">{card.value}</p>
          <p className="text-sm text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
