import { useState } from 'react';
import { ArrowLeft, Flag, Check, MessageSquare, AlertOctagon, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReports, useResolveReport, useFermatas, useDispatchers } from '@/hooks/useSupabaseData';
import { Report, ReportStatus, ReportReason } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const statusColors: Record<ReportStatus, string> = {
  open: 'bg-destructive text-destructive-foreground',
  in_progress: 'bg-warning text-warning-foreground',
  resolved: 'bg-success text-success-foreground',
  closed: 'bg-muted text-muted-foreground',
};

const reasonLabels: Record<ReportReason, string> = {
  wrong_fermata: 'wrongFermata',
  wrong_association: 'wrongAssociation',
  unauthorized_dispatch: 'unauthorizedDispatch',
  excessive_skips: 'excessiveSkips',
  timeout: 'timeout',
  other: 'otherReason',
};

const ReportCenter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedFermata, setSelectedFermata] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDispatcher, setSelectedDispatcher] = useState<string>('all');
  
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const { fermatas } = useFermatas();
  const { dispatchers } = useDispatchers();
  const { reports, loading } = useReports({
    fermataId: selectedFermata,
    status: selectedStatus,
    dispatcherId: selectedDispatcher,
  });
  const { resolveReport, loading: resolving } = useResolveReport();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openResolveModal = (report: Report) => {
    setSelectedReport(report);
    setAdminComment(report.admin_comments || '');
    setResolveModalOpen(true);
  };

  const handleResolve = async (status: 'resolved' | 'closed') => {
    if (!selectedReport || !user) return;
    
    await resolveReport(selectedReport.id, user.id, status, adminComment);
    setResolveModalOpen(false);
    setSelectedReport(null);
    setAdminComment('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('am-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openReportsCount = reports.filter(r => r.status === 'open').length;

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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Flag className="h-6 w-6" />
                {t('reportCenter')}
              </h1>
              <p className="text-muted-foreground">
                {openReportsCount} {t('openReports')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('filterByFermata')}</label>
            <Select value={selectedFermata} onValueChange={setSelectedFermata}>
              <SelectTrigger>
                <SelectValue placeholder={t('allFermatas')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allFermatas')}</SelectItem>
                {fermatas.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} - {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('filterByDispatcher')}</label>
            <Select value={selectedDispatcher} onValueChange={setSelectedDispatcher}>
              <SelectTrigger>
                <SelectValue placeholder={t('allDispatchers')} />
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
          <div>
            <label className="text-sm font-medium mb-2 block">{t('filterByStatus')}</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="open">{t('open')}</SelectItem>
                <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
                <SelectItem value="resolved">{t('resolved')}</SelectItem>
                <SelectItem value="closed">{t('closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-card rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('loading')}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noReports')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-muted/50',
                    report.status === 'open' && 'border-l-4 border-l-destructive'
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[report.status]}>
                          {t(report.status === 'in_progress' ? 'inProgress' : report.status)}
                        </Badge>
                        <Badge variant="outline">
                          {t(reasonLabels[report.reason])}
                        </Badge>
                        {report.is_auto_generated && (
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            {t('autoGenerated')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('taxi')}: </span>
                          <Badge variant="outline" className="font-mono">
                            {report.taxi?.plate_number || 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('driverName')}: </span>
                          <span className="font-medium">
                            {report.taxi?.driver?.name || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('fermatas')}: </span>
                          <span className="font-medium">
                            {report.fermata ? `${report.fermata.code} - ${report.fermata.name}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('dispatcher')}: </span>
                          <span className="font-medium">{report.dispatcher?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('createdAt')}: </span>
                          <span className="font-medium">{formatDate(report.created_at)}</span>
                        </div>
                      </div>

                      {report.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      )}

                      {report.admin_comments && (
                        <div className="mt-2 p-2 bg-muted rounded-lg text-sm">
                          <span className="font-medium">{t('comments')}: </span>
                          {report.admin_comments}
                        </div>
                      )}

                      {report.resolved_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t('resolvedAt')}: {formatDate(report.resolved_at)}
                          {report.resolver && ` - ${t('resolvedBy')}: ${report.resolver.name}`}
                        </p>
                      )}
                    </div>

                    {['open', 'in_progress'].includes(report.status) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openResolveModal(report)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {t('addComment')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            handleResolve('resolved');
                          }}
                          disabled={resolving}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {t('resolveReport')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Resolve Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resolveReport')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('comments')}</label>
              <Textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder={t('addComment')}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleResolve('closed')}
              disabled={resolving}
            >
              {t('closeReport')}
            </Button>
            <Button
              onClick={() => handleResolve('resolved')}
              disabled={resolving}
            >
              <Check className="h-4 w-4 mr-1" />
              {t('resolveReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportCenter;
