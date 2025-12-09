import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Send, Users, MapPin, FileText, Eye } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { QueueTable } from '@/components/dispatcher/QueueTable';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import {  useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedFermata, setSelectedFermata] = useState<string>('all');

  const waitingCount = mockQueueEntries.filter(e => e.status === 'waiting').length;
  const dispatchedToday = mockQueueEntries.filter(e => e.status === 'dispatched').length + 12;
  const activeDispatchers = mockUsers.filter(u => u.role === 'dispatcher').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredQueue = selectedFermata === 'all'
    ? mockQueueEntries
    : mockQueueEntries.filter(e => e.destinationId === selectedFermata );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Admin Role Badge */}
        <div className="mb-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {t('admin')} - {t('viewAllQueues')}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Car className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-muted-foreground">{t('inQueue')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Send className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dispatchedToday}</p>
                <p className="text-sm text-muted-foreground">{t('dispatchedToday')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDispatchers}</p>
                <p className="text-sm text-muted-foreground">{t('dispatcher')}</p>
              </div>
            </div>
          </div>
          <Link to="/admin/fermatas" className="stat-card hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockFermatas.length}</p>
                <p className="text-sm text-muted-foreground">{t('fermatas')}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Quick Actions */}
        <div className="mb-6 p-4 bg-muted/30 rounded-xl">
          <h3 className="font-medium mb-3">{t('adminPanel')}</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {t('manageUsers')}
              </Button>
            </Link>
            <Link to="/admin/fermatas">
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                {t('manageFermatas')}
              </Button>
            </Link>
            <Link to="/admin/drivers">
              <Button variant="outline" size="sm">
                {t('manageDrivers')}
              </Button>
            </Link>
            <Link to="/admin/taxis">
              <Button variant="outline" size="sm">
                {t('manageTaxis')}
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="default" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {t('reports')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Fermata Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('viewAllQueues')}
          </h2>
          <div className="w-full sm:w-64">
            <Select value={selectedFermata} onValueChange={setSelectedFermata}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectDestination')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allFermatas')}</SelectItem>
                {mockFermatas.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} - {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Queue Table - Read Only for Admin */}
        <div className="relative">
          <div className="relative top-3 right-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {t('viewAllQueues')} ({t('readOnly')})
            </Badge>
          </div>
          <QueueTable entries={filteredQueue} readOnly />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
