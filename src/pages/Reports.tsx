import { useState } from 'react';
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
import { DailyStats } from '@/types/taxi';

const Reports = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedDate] = useState(new Date());
  const [selectedFermata, setSelectedFermata] = useState<string>('all');
  const [selectedDispatcher, setSelectedDispatcher] = useState<string>('all');

  const dispatchers = mockUsers.filter(u => u.role === 'dispatcher');

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
    const fermataMatch =
      selectedFermata === 'all' || log.destination.id === selectedFermata;

    const dispatcherMatch =
      selectedDispatcher === 'all' ||
      log.queueEntry.driverName === dispatchers.find(d => d.id === selectedDispatcher)?.name;

    return fermataMatch && dispatcherMatch;
  });

  const filteredStats: DailyStats = {
    totalDispatched: filteredLogs.length,
    peakHour: (() => {
      if (!filteredLogs.length) return '-';
      const hourCount: Record<string, number> = {};
      filteredLogs.forEach(log => {
        const hour = log.dispatchedAt.getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const peak = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0][0];
      return `${peak}:00 - ${Number(peak) + 1}:00`;
    })(),
    mostFrequentDestination: (() => {
      if (!filteredLogs.length) return '-';
      const count: Record<string, number> = {};
      filteredLogs.forEach(log => {
        const name = log.destination.name;
        count[name] = (count[name] || 0) + 1;
      });
      return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
    })(),
    averageWaitTime: (() => {
      if (!filteredLogs.length) return 0;
      const total = filteredLogs.reduce((sum, log) => {
        const wait = (log.dispatchedAt.getTime() - log.queueEntry.arrivalTime.getTime()) / 60000;
        return sum + wait;
      }, 0);
      return Math.round(total / filteredLogs.length);
    })(),
  };

  const exportCSV = () => {
    if (!filteredLogs.length) {
      toast.error(t('noDataToExport'));
      return;
    }
  
    const csvHeader = ['Queue #', 'Plate Number', 'Driver', 'Destination', 'Dispatched At'];
    const csvRows = filteredLogs.map(log => [
      log.queueEntry.queueNumber,
      log.queueEntry.plateNumber,
      log.queueEntry.driverName,
      `${log.destination.code} - ${log.destination.name}`,
      log.dispatchedAt.toLocaleString('am-ET')
    ]);
  
    const csvContent =
      [csvHeader, ...csvRows]
        .map(e => e.join(','))
        .join('\n');
  
    // Add BOM for UTF-8
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispatch_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    toast.success(t('exportCSVSuccess'));
  };
  

 

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
            <Button variant="outline" onClick={exportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              {t('exportCSV')}
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
          <StatsCards stats={filteredStats} />
        </div>

        {/* Dispatch Log Table */}
        <DispatchLogTable
          logs={filteredLogs}
          onExportCSV={exportCSV}
                />
      </main>
    </div>
  );
};

export default Reports;
