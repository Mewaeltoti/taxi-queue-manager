import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Car, 
  UserCog, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  currentPage: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'fermatas', label: 'Fermatas', icon: MapPin, path: '/admin/fermatas', adminOnly: true },
  { id: 'drivers', label: 'Drivers', icon: Users, path: '/admin/drivers', adminOnly: true },
  { id: 'taxis', label: 'Taxis', icon: Car, path: '/admin/taxis', adminOnly: true },
  { id: 'users', label: 'Users', icon: UserCog, path: '/admin/users', adminOnly: true },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
];

export function AdminSidebar({ currentPage }: AdminSidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-sidebar min-h-screen border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Car className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">TaxiQueue</h2>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            )}
            activeClassName="bg-sidebar-accent text-sidebar-foreground"
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            {currentPage === item.id && (
              <ChevronRight className="h-4 w-4" />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}