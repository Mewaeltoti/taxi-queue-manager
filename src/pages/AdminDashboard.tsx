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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('adminDashboard') || 'Admin Dashboard'}</h1>
          <p className="text-muted-foreground mt-1">
            Real-time live queue overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm opacity-90">Dispatchers</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <Users className="h-10 w-10 opacity-80" />
              <p className="text-4xl font-bold">{activeDispatchers}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm opacity-90">Destinations</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <MapPin className="h-10 w-10 opacity-80" />
              <p className="text-4xl font-bold">{totalDestinations}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-600 to-amber-700 text-white border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm opacity-90">Waiting</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <Clock className="h-10 w-10 opacity-80" />
              <p className="text-4xl font-bold">{waitingTaxis}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm opacity-90">Not Ready</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <AlertCircle className="h-10 w-10 opacity-80" />
              <p className="text-4xl font-bold">{notReadyTaxis}</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>Quick access to system settings</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/dispatchers" className="block">
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Dispatchers
              </Button>
            </Link>
            <Link to="/admin/fermatas" className="block">
              <Button className="w-full" variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Destinations
              </Button>
            </Link>
            <Link to="/admin/drivers" className="block">
              <Button className="w-full" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Drivers
              </Button>
            </Link>
            <Link to="/admin/taxis" className="block">
              <Button className="w-full" variant="outline">
                <Car className="h-4 w-4 mr-2" />
                Taxis
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Live Queue Status - Full Focus */}
       {/* Live Queue Status - Your Favorite Design, Perfected */}
<Card className="shadow-xl">
  <CardHeader>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Activity className="h-6 w-6" />
          Live Queue Status
        </CardTitle>
        <CardDescription className="text-base">
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
      <div className="text-center py-16">
        <Car className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-xl text-muted-foreground">Queue is empty</p>
        <p className="text-sm text-muted-foreground mt-2">No taxis waiting or not ready</p>
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
              className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-200"
            >
              <div className="flex-1 mb-4 sm:mb-0">
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-3xl font-bold tracking-tight">{entry.plate_number}</p>
                  <Badge 
                    variant={entry.status === 'waiting' ? 'default' : 'destructive'}
                    className="text-base px-4 py-1"
                  >
                    {entry.status === 'waiting' ? 'Waiting' : 'Not Ready'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-base text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {entry.driver_name}
                  </span>
                  {fermata && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {fermata.code} - {fermata.name}
                    </span>
                  )}
                  {dispatcher && (
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {dispatcher.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-4xl font-bold text-primary">
                  {formatElapsedTime(entry.arrival_time)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">elapsed time</p>
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