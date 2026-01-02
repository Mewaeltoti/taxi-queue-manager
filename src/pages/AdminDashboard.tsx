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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('adminDashboard') || 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time live queue overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Dispatchers</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-4xl font-bold">{activeDispatchers}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success to-success/80 text-success-foreground border-0 shadow-lg shadow-success/20 hover:shadow-xl hover:shadow-success/30 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Destinations</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <MapPin className="h-8 w-8" />
              </div>
              <p className="text-4xl font-bold">{totalDestinations}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning to-warning/80 text-warning-foreground border-0 shadow-lg shadow-warning/20 hover:shadow-xl hover:shadow-warning/30 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Waiting</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Clock className="h-8 w-8" />
              </div>
              <p className="text-4xl font-bold">{waitingTaxis}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground border-0 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Not Ready</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="text-4xl font-bold">{notReadyTaxis}</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Buttons */}
        <Card className="mb-8 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Manage system resources</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/dispatchers" className="block">
              <Button className="w-full h-16 flex-col gap-1 hover:scale-105 transition-transform" variant="outline">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs">Dispatchers</span>
              </Button>
            </Link>
            <Link to="/admin/fermatas" className="block">
              <Button className="w-full h-16 flex-col gap-1 hover:scale-105 transition-transform" variant="outline">
                <MapPin className="h-5 w-5 text-success" />
                <span className="text-xs">Destinations</span>
              </Button>
            </Link>
            <Link to="/admin/drivers" className="block">
              <Button className="w-full h-16 flex-col gap-1 hover:scale-105 transition-transform" variant="outline">
                <UserPlus className="h-5 w-5 text-warning" />
                <span className="text-xs">Drivers</span>
              </Button>
            </Link>
            <Link to="/admin/taxis" className="block">
              <Button className="w-full h-16 flex-col gap-1 hover:scale-105 transition-transform" variant="outline">
                <Car className="h-5 w-5 text-destructive" />
                <span className="text-xs">Taxis</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Live Queue Status - Full Focus */}
       {/* Live Queue Status - Your Favorite Design, Perfected */}
<Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
  <CardHeader className="border-b bg-muted/30">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          Live Queue Status
        </CardTitle>
        <CardDescription className="mt-1">
          {queueEntries.length} active taxis across all dispatchers
        </CardDescription>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Select value={destinationFilter} onValueChange={setDestinationFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Destinations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Destinations</SelectItem>
            {fermatas.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.code} - {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dispatcherFilter} onValueChange={setDispatcherFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Dispatchers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dispatchers</SelectItem>
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
  <CardContent>
    {queueEntries.length === 0 ? (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Car className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="text-xl font-medium text-muted-foreground">Queue is empty</p>
        <p className="text-sm text-muted-foreground/70 mt-1">No taxis waiting or not ready</p>
      </div>
    ) : (
      <div className="space-y-4">
        {filteredQueue.map(entry => {
          const mins = Math.round((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
          const fermata = fermatas.find(f => f.id === entry.fermata_id);
          const dispatcher = dispatchers.find(d => d.id === entry.dispatcher_id);

          return (
            <div 
              key={entry.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
            >
              <div className="flex-1 mb-4 sm:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-2xl font-bold tracking-tight font-mono group-hover:text-primary transition-colors">{entry.plate_number}</p>
                  <Badge 
                    variant={entry.status === 'waiting' ? 'default' : 'destructive'}
                    className="text-xs px-3 py-0.5"
                  >
                    {entry.status === 'waiting' ? 'Waiting' : 'Not Ready'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {entry.driver_name}
                  </span>
                  {fermata && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {fermata.code} - {fermata.name}
                    </span>
                  )}
                  {dispatcher && (
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4" />
                      {dispatcher.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-primary tabular-nums">
                  {formatElapsedTime(entry.arrival_time)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">elapsed</p>
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