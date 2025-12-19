import { useState, useEffect } from 'react';
import { Users, ArrowLeft, Phone, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

type Driver = {
  id: string;
  name: string;
  phone: string;
  license_id : string;
};

const Drivers = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseId, setLicenseId] = useState('');

  // Fetch drivers from Supabase
  useEffect(() => {
    supabase.from('drivers').select('*').then(({ data, error }) => {
      console.log('Supabase drivers data:', data, error);
      setDrivers(data || []);
    });
  }, []);

  const columns = [
    { 
      key: 'name' as keyof Driver, 
      label: t('driverName'),
      render: (item: Driver) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-medium text-xs sm:text-sm">
              {item.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="font-medium text-sm sm:text-base truncate">{item.name}</span>
        </div>
      )
    },
    { 
      key: 'phone' as keyof Driver, 
      label: t('phone'),
      render: (item: Driver) => (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Phone className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{item.phone}</span>
        </div>
      )
    },
    { 
      key: 'license_id' as keyof Driver, 
      label: t('licenseId'),
      render: (item: Driver) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <code className="text-xs sm:text-sm bg-muted px-1.5 sm:px-2 py-0.5 rounded truncate">{item.license_id}</code>
        </div>
      )
    },
  ];

  const handleAdd = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setLicenseId('');
    setIsModalOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setLicenseId(driver.license_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (driver: Driver) => {
    // Delete from Supabase
    const { error } = await supabase.from('drivers').delete().eq('id', driver.id);
    if (!error) {
      setDrivers(drivers.filter(d => d.id !== driver.id));
      toast.success(`${t('delete')}: ${driver.name}`);
    } else {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !licenseId) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (editingDriver) {
      // Update driver in Supabase
      const { error } = await supabase
        .from('drivers')
        .update({ name, phone, license_id: licenseId })
        .eq('id', editingDriver.id);
      if (!error) {
        setDrivers(drivers.map(d => 
          d.id === editingDriver.id ? { ...d, name, phone, license_id: licenseId } : d
        ));
        toast.success(t('save'));
      } else {
        toast.error(error.message);
      }
    } else {
      // Insert new driver in Supabase
      const { data, error } = await supabase
        .from('drivers')
        .insert([{ name, phone, license_id: licenseId }])
        .select();
      if (!error && data && data[0]) {
        setDrivers([...drivers, data[0]]);
        toast.success(t('add'));
      } else {
        toast.error(error?.message || 'Failed to add');
      }
    }

    setIsModalOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
    

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('drivers')}</h1>
            <p className="text-muted-foreground">{t('manageRegisteredDrivers')}</p>
          </div>
        </div>

        <DataTable
          title={t('registeredDrivers')}
          data={drivers}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          icon={<Users className="h-5 w-5 text-accent" />}
        />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? t('edit') : t('add')} {t('driver')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input
                id="name"
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                placeholder="+251 9XX-XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">{t('licenseId')}</Label>
              <Input
                id="license"
                placeholder="DL-2024-XXX"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingDriver ? t('save') : t('add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;