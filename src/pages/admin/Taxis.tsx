import { useState, useEffect } from 'react';
import { Car, ArrowLeft, Tag } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Taxi } from '@/types/taxi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

type Driver = {
  id: string;
  name: string;
};

const Taxis = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('');
  const [driverId, setDriverId] = useState('');

  useEffect(() => {
    // Fetch initial data for taxis and drivers
    (async () => {
      const { data: taxisData } = await supabase.from('taxis').select('*');
      setTaxis(taxisData || []);
      const { data: driversData } = await supabase.from('drivers').select('id, name');
      setDrivers(driversData || []);
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDriverName = (id: string) => {
    return drivers.find(d => d.id === id)?.name || t('inactive');
  };

  const columns = [
    {
      key: 'plate_number',
      label: t('plateNumber'),
      render: (item: Taxi) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <code className="font-semibold text-sm">{item.plate_number}</code>
        </div>
      )
    },
    {
      key: 'driver_id',
      label: t('driver'),
      render: (item: Taxi) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-medium text-xs">
              {getDriverName(item.driver_id).split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="text-sm truncate">{getDriverName(item.driver_id)}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: t('type'),
      render: (item: Taxi) => (
        <span className="capitalize">{item.type}</span>
      )
    }
  ];

  const handleAdd = () => {
    setEditingTaxi(null);
    setPlateNumber('');
    setType('');
    setDriverId('');
    setIsModalOpen(true);
  };

  const handleEdit = (taxi: Taxi) => {
    setEditingTaxi(taxi);
    setPlateNumber(taxi.plate_number);
    setType(taxi.type);
    setDriverId(taxi.driver_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (taxi: Taxi) => {
    const { error } = await supabase.from('taxis').delete().eq('id', taxi.id);
    if (!error) {
      setTaxis(taxis.filter(t => t.id !== taxi.id));
      toast.success(`${t('delete')}: ${taxi.plate_number}`);
    } else {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber || !type || !driverId) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (editingTaxi) {
      // Update existing taxi
      const { data, error } = await supabase
        .from('taxis')
        .update({ plate_number: plateNumber, type, driver_id: driverId })
        .eq('id', editingTaxi.id)
        .select();
      if (!error && data && data[0]) {
        setTaxis(taxis.map(t =>
          t.id === editingTaxi.id ? data[0] : t
        ));
        toast.success(t('save'));
      } else {
        toast.error(error?.message || t('errorOccurred'));
      }
    } else {
      // Create new taxi
      const { data, error } = await supabase
        .from('taxis')
        .insert([{ plate_number: plateNumber, type, driver_id: driverId }])
        .select();
      if (!error && data && data[0]) {
        setTaxis([...taxis, data[0]]);
        toast.success(t('add'));
      } else {
        toast.error(error?.message || t('errorOccurred'));
      }
    }

    setIsModalOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName="Metro Taxi Association"
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('taxis')}</h1>
            <p className="text-muted-foreground">{t('manageRegisteredVehicles')}</p>
          </div>
        </div>

        <DataTable
          title={t('registeredTaxis')}
          data={taxis}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          icon={<Car className="h-5 w-5 text-accent" />}
        />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingTaxi ? t('edit') : t('add')} {t('taxi')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plate">{t('plateNumber')}</Label>
              <Input
                id="plate"
                placeholder="TX-XXXX"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('type')}</Label>
              <Input
                id="type"
                placeholder="sedan, suv, van, minibus..."
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">{t('driver')}</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingTaxi ? t('save') : t('add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Taxis;