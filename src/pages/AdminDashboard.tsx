import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Activity,
  UserPlus,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [dispatcherFilter, setDispatcherFilter] = useState<string>('all');

  const [fermatas, setFermatas] = useState<any[]>([]);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [queueEntries, setQueueEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fermRes, dispRes, queueRes] = await Promise.all([
          supabase.from('fermatas').select('id, code, name'),
          supabase.from('users').select('id, name').eq('role', 'dispatcher'),
          supabase
            .from('queue_entries')
            .select('id, status, plate_number, driver_name, arrival_time, fermata_id, dispatcher_id')
            .in('status', ['waiting', 'not_ready'])
            .order('arrival_time', { ascending: true })
        ]);

        setFermatas(fermRes.data ?? []);
        setDispatchers(dispRes.data ?? []);
        setQueueEntries(queueRes.data ?? []);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // KPIs
  const activeDispatchers = dispatchers.length;
  const totalDestinations = fermatas.length;
  const waitingTaxis = queueEntries.filter(q => q.status === 'waiting').length;
  const notReadyTaxis = queueEntries.filter(q => q.status === 'not_ready').length;

  // Active queue
  const activeQueue = queueEntries;

  // Filtered active queue
  const filteredQueue = activeQueue.filter(entry => {
    const matchesFermata = destinationFilter === 'all' || entry.fermata_id === destinationFilter;
    const matchesDispatcher = dispatcherFilter === 'all' || entry.dispatcher_id === dispatcherFilter;
    return matchesFermata && matchesDispatcher;
  });

  const formatElapsedTime = (arrivalTime: string) => {
    const mins = Math.round((Date.now() - new Date(arrivalTime).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen page-container">
      <main className="content-container">
        {/* Title */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
            {t('adminDashboard') || 'Admin Dashboard'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Real-time live queue overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg shadow-primary/20 card-hover group animate-slide-up">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium opacity-90">{t('dispatchers') || 'Dispatchers'}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between p-4 sm:p-6 pt-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{activeDispatchers}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success to-success/80 text-success-foreground border-0 shadow-lg shadow-success/20 card-hover group animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium opacity-90">{t('destinations') || 'Destinations'}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between p-4 sm:p-6 pt-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{totalDestinations}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning to-warning/80 text-warning-foreground border-0 shadow-lg shadow-warning/20 card-hover group animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium opacity-90">{t('waiting') || 'Waiting'}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between p-4 sm:p-6 pt-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{waitingTaxis}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground border-0 shadow-lg shadow-destructive/20 card-hover group animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium opacity-90">{t('notReady') || 'Not Ready'}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between p-4 sm:p-6 pt-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold">{notReadyTaxis}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6 sm:mb-8 glass-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              {t('quickActions') || 'Quick Actions'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('manageResources') || 'Manage system resources'}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 pt-0">
            <Link to="/admin/dispatchers" className="block">
              <Button className="w-full h-14 sm:h-16 flex-col gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-card hover:bg-primary/5 hover:border-primary/30" variant="outline">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{t('dispatchers') || 'Dispatchers'}</span>
              </Button>
            </Link>
            <Link to="/admin/fermatas" className="block">
              <Button className="w-full h-14 sm:h-16 flex-col gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-card hover:bg-success/5 hover:border-success/30" variant="outline">
                <MapPin className="h-5 w-5 text-success" />
                <span className="text-xs font-medium">{t('destinations') || 'Destinations'}</span>
              </Button>
            </Link>
            <Link to="/admin/drivers" className="block">
              <Button className="w-full h-14 sm:h-16 flex-col gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-card hover:bg-warning/5 hover:border-warning/30" variant="outline">
                <UserPlus className="h-5 w-5 text-warning" />
                <span className="text-xs font-medium">{t('drivers') || 'Drivers'}</span>
              </Button>
            </Link>
            <Link to="/admin/taxis" className="block">
              <Button className="w-full h-14 sm:h-16 flex-col gap-1.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-card hover:bg-destructive/5 hover:border-destructive/30" variant="outline">
                <Car className="h-5 w-5 text-destructive" />
                <span className="text-xs font-medium">{t('taxis') || 'Taxis'}</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Live Queue Status */}
        <Card className="premium-card animate-slide-up" style={{ animationDelay: '250ms' }}>
          <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  {t('liveQueueStatus') || 'Live Queue Status'}
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  {queueEntries.length} {t('activeTaxis') || 'active taxis across all dispatchers'}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-11 rounded-xl">
                    <SelectValue placeholder={t('allDestinations') || 'All Destinations'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{t('allDestinations') || 'All Destinations'}</SelectItem>
                    {fermatas.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dispatcherFilter} onValueChange={setDispatcherFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-11 rounded-xl">
                    <SelectValue placeholder={t('allDispatchers') || 'All Dispatchers'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">{t('allDispatchers') || 'All Dispatchers'}</SelectItem>
                    {dispatchers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {queueEntries.length === 0 ? (
              <div className="text-center py-16 sm:py-20 animate-fade-in">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Car className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg sm:text-xl font-medium text-muted-foreground">{t('queueEmpty') || 'Queue is empty'}</p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">{t('noTaxisWaiting') || 'No taxis waiting or not ready'}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredQueue.map((entry, i) => {
                  const fermata = fermatas.find(f => f.id === entry.fermata_id);
                  const dispatcher = dispatchers.find(d => d.id === entry.dispatcher_id);

                  return (
                    <div 
                      key={entry.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-200 group animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <p className="text-xl sm:text-2xl font-bold tracking-tight font-mono group-hover:text-primary transition-colors">{entry.plate_number}</p>
                          <Badge 
                            variant={entry.status === 'waiting' ? 'default' : 'destructive'}
                            className="text-xs px-2 sm:px-3 py-0.5"
                          >
                            {entry.status === 'waiting' ? t('waiting') || 'Waiting' : t('notReady') || 'Not Ready'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {entry.driver_name}
                          </span>
                          {fermata && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {fermata.code}
                            </span>
                          )}
                          {dispatcher && (
                            <span className="flex items-center gap-1.5 hidden sm:flex">
                              <Activity className="h-3.5 w-3.5" />
                              {dispatcher.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                          {formatElapsedTime(entry.arrival_time)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t('elapsed') || 'elapsed'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;