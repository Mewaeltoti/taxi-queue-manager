import { useState } from 'react';
import { ArrowLeft, Calendar, Download, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDispatchLogs, mockFermatas } from '@/data/mockData';
import { toast } from 'sonner';

const DispatcherReports = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter logs based on date selection
  const filteredLogs = mockDispatchLogs.filter(log => {
    const logDate = log.dispatchedAt.toISOString().split('T')[0];
    
    if (dateMode === 'single') {
      return logDate === selectedDate;
    } else {
      return logDate >= startDate && logDate <= endDate;
    }
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error(t('noDataToExport'));
      return;
    }

    const headers = [
      t('plateNumber'),
      t('driverName'),
      t('destination'),
      t('dispatchTime'),
    ];

    const rows = filteredLogs.map(log => [
      log.queueEntry.plateNumber,
      log.queueEntry.driverName,
      `${log.destination.code} - ${log.destination.name}`,
      log.dispatchedAt.toLocaleString('am-ET'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dispatch-report-${dateMode === 'single' ? selectedDate : `${startDate}-to-${endDate}`}.csv`;
    link.click();
    toast.success(t('exportCSVSuccess'));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('am-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/dispatcher">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {t('dispatchLogs')}
              </h1>
              <p className="text-muted-foreground">
                {t('dailyReport')}
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('exportCSV')}
          </Button>
        </div>

        {/* Date Filter Card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t('selectDate')}</h2>
          </div>

          <RadioGroup
            value={dateMode}
            onValueChange={(value) => setDateMode(value as 'single' | 'range')}
            className="flex gap-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single">{t('singleDate')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range">{t('dateRange')}</Label>
            </div>
          </RadioGroup>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dateMode === 'single' ? (
              <div>
                <Label htmlFor="date">{t('selectDate')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="modern-input"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="startDate">{t('startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="modern-input"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">{t('endDate')}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="modern-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-3xl font-bold text-primary">{filteredLogs.length}</p>
            <p className="text-sm text-muted-foreground">{t('totalDispatched')}</p>
          </div>
        </div>

        {/* Dispatch Logs Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold">{t('dispatchLogs')}</h3>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} {t('reports').toLowerCase()}
            </p>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noLogs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('plateNumber')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('driverName')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('destination')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('dispatchTime')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono font-semibold">
                          {log.queueEntry.plateNumber}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {log.queueEntry.driverName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {log.destination.code} - {log.destination.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(log.dispatchedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DispatcherReports;
