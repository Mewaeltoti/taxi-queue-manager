import { ArrowLeft, FileText, User, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuditLogs } from '@/hooks/useSupabaseData';
import { AuditAction } from '@/types/database';

const actionLabels: Record<AuditAction, string> = {
  queue_created: 'queueCreated',
  queue_updated: 'queueUpdated',
  queue_skipped: 'queueSkipped',
  queue_dispatched: 'queueDispatched',
  queue_canceled: 'queueCanceled',
  taxi_not_ready: 'taxiNotReady',
  taxi_returned: 'taxiReturned',
  unauthorized_attempt: 'unauthorizedAttempt',
  report_created: 'reportCreated',
  report_resolved: 'reportResolved',
  dispatcher_assigned: 'dispatcherAssigned',
  fermata_created: 'fermataCreated',
  driver_created: 'driverCreated',
  taxi_created: 'taxiCreated',
};

const actionColors: Record<string, string> = {
  queue_created: 'bg-success/10 text-success',
  queue_dispatched: 'bg-primary/10 text-primary',
  queue_skipped: 'bg-warning/10 text-warning',
  queue_canceled: 'bg-muted text-muted-foreground',
  unauthorized_attempt: 'bg-destructive/10 text-destructive',
  report_created: 'bg-destructive/10 text-destructive',
};

const AuditLogs = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logs, loading } = useAuditLogs();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('am-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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

      <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {t('auditLogs')}
            </h1>
            <p className="text-muted-foreground">
              {logs.length} {t('auditLogs')}
            </p>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-card rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('loading')}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noLogs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('timestamp')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      {t('action')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('actor')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      {t('oldValue')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      {t('newValue')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant="secondary"
                          className={actionColors[log.action] || 'bg-secondary'}
                        >
                          {t(actionLabels[log.action] || log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.actor?.name || 'System'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.entity_type}
                        {log.entity_id && (
                          <span className="text-xs ml-1">
                            ({log.entity_id.slice(0, 8)}...)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.old_values ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {JSON.stringify(log.old_values).slice(0, 50)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.new_values ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {JSON.stringify(log.new_values).slice(0, 50)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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

export default AuditLogs;
