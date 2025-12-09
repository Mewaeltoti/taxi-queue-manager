import { useState, useContext } from 'react';
import { Calendar, ArrowLeft, FileDown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/reports/StatsCards';
import { DispatchLogTable } from '@/components/reports/DispatchLogTable';
import { Button } from '@/components/ui/button';
import { mockDailyStats, mockDispatchLogs, mockFermatas, mockUsers } from '@/data/mockData';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Reports = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedDate] = useState(new Date());
  const [selectedFermata, setSelectedFermata] = useState<string>('all');
  const [selectedDispatcher, setSelectedDispatcher] = useState<string>('all');

  const dispatchers = mockUsers.filter(u => u.role === 'dispatcher');

  const handleExportCSV = () => toast.success(t('exportCSVSuccess'));
  const handleExportPDF = () => toast.success(t('exportPDFSuccess'));
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('am-ET', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const filteredLogs = mockDispatchLogs.filter(log => {
    if (selectedFermata !== 'all' && log.destination.id !== selectedFermata) return false;
    if (selectedDispatcher !== 'all' && log.id !== selectedDispatcher) return false;
    
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('dailyReport')}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(selectedDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              {t('exportCSV')}
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {t('exportPDF')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('fermatas')}</label>
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
          <div>
            <label className="text-sm font-medium mb-2 block">{t('dispatcher')}</label>
            <Select value={selectedDispatcher} onValueChange={setSelectedDispatcher}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectDispatcher')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDispatchers')}</SelectItem>
                {dispatchers.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <StatsCards stats={mockDailyStats} />
        </div>

        {/* Dispatch Log Table */}
        <DispatchLogTable
          logs={filteredLogs}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      </main>
    </div>
  );
};

export default Reports;
