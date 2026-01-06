import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    // Check if user dismissed the banner
    const dismissed = localStorage.getItem('install-banner-dismissed');
    
    // Show banner only on mobile, not installed, and not dismissed
    if (isMobile && !isStandalone && !dismissed) {
      setIsVisible(true);
    }
  }, [isMobile]);

  const handleDismiss = () => {
    localStorage.setItem('install-banner-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-primary text-primary-foreground animate-slide-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Download className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium truncate">
            Install app for better experience
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-8 px-3"
          >
            <Link to="/install">Install</Link>
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-primary-foreground/10 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
