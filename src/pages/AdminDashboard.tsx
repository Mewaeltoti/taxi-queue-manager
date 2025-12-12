import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Send, Users, MapPin, FileText, Download, UserPlus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { mockQueueEntries, mockFermatas, mockUsers, mockDispatchLogs } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [destinationFilter, setDestinationFilter] = useState<string>('all');

  const waitingCount = mockQueueEntries.filter(e => e.status === 'waiting').length;
  const dispatchedToday = mockDispatchLogs.length;
  const activeDispatchers = mockUsers.filter(u => u.role === 'dispatcher').length;
  const totalFermatas = mockFermatas.length;

  const filteredLogs = destinationFilter === 'all' 
    ? mockDispatchLogs 
    : mockDispatchLogs.filter(log => log.destination.id === destinationFilter);

  const formatTime = (date: Date) => date.toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' });

  const exportCSV = () => {
    const headers = ['Plate Number', 'Driver', 'Destination', 'Dispatch Time'];
    const rows = filteredLogs.map(log => [
      log.queueEntry.plateNumber,
      log.queueEntry.driverName,
      log.destination.name,
      formatTime(log.dispatchedAt),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispatch-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        {/* Admin Role Badge */}
        <div className="mb-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {t('admin')}
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDispatchers}</p>
                <p className="text-sm text-muted-foreground">{t('totalDispatchers')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFermatas}</p>
                <p className="text-sm text-muted-foreground">{t('totalDestinations')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Car className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingCount}</p>
                <p className="text-sm text-muted-foreground">{t('taxisToday')}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Send className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dispatchedToday}</p>
                <p className="text-sm text-muted-foreground">{t('dispatchesToday')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 p-4 bg-muted/30 rounded-xl">
          <h3 className="font-medium mb-3">{t('adminPanel')}</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/dispatchers">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {t('manageDispatchers')}
              </Button>
            </Link>
            <Link to="/admin/drivers">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('manageDrivers')}
              </Button>
            </Link>
            <Link to="/admin/taxis">
              <Button variant="outline" size="sm">
                <Car className="h-4 w-4 mr-2" />
                {t('manageTaxis')}
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="default" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {t('reports')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Dispatches Table */}
        <div className="bg-card rounded-xl border p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">{t('todayDispatches')}</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('filterByDestination')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allDestinations')}</SelectItem>
                  {mockFermatas.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.code} - {f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {t('downloadCSV')}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t('plateNumber')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('driverName')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('destination')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('dispatchTime')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('noDispatchesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <TableRow key={`${log.id}-${idx}`}>
                      <TableCell className="font-mono">{log.queueEntry.plateNumber}</TableCell>
                      <TableCell>{log.queueEntry.driverName}</TableCell>
                      <TableCell>{log.destination.code} - {log.destination.name}</TableCell>
                      <TableCell>{formatTime(log.dispatchedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
