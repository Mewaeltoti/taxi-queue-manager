import { LogOut, Menu, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/translations';

interface HeaderProps {
  associationName: string;
  dispatcherName: string;
  onLogout?: () => void;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ 
  associationName, 
  dispatcherName, 
  onLogout,
  onMenuClick,
  showMenu = false 
}: HeaderProps) {
  return (
    <header className="h-16 border-b bg-card px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {showMenu && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              ታ
            </span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-foreground leading-tight">{associationName}</h1>
            <p className="text-xs text-muted-foreground">{t.queueManagement}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-accent">
            3
          </Badge>
        </Button>
        
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-xs">
              {dispatcherName.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-medium">{dispatcherName}</span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLogout} 
          className="text-muted-foreground hover:text-destructive"
          title={t.logout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
