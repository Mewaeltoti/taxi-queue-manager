import { LogOut, Menu, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

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

  const { lang, setLang, t } = useLanguage();

  return (
    <header className="h-14 sm:h-16 border-b bg-card/95 backdrop-blur-lg px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {showMenu && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden shrink-0 h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="text-primary-foreground font-bold text-sm sm:text-base">
              T
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground leading-tight text-sm sm:text-base truncate">{associationName}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">{t('queueManagement')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] bg-accent border-2 border-card">
            3
          </Badge>
        </Button>

        {/* Dispatcher info - hidden on small screens */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/50">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            <span className="text-primary font-semibold text-xs">
              {dispatcherName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium">{dispatcherName}</span>
        </div>

        {/* Language switch */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === 'en' ? 'ti' : 'en')}
          className="h-9 px-2 sm:px-3 gap-1 text-xs sm:text-sm"
        >
          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{lang === 'en' ? 'ትግ' : 'EN'}</span>
        </Button>

        {/* Logout */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLogout} 
          className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title={t('logout')}
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  );
}

