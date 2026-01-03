import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export function OfflineIndicator() {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Working with cached data.</span>
    </div>
  );
}
