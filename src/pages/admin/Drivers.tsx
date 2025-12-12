import { useState } from 'react';
import { Users, ArrowLeft, Phone, CreditCard } from 'lucide-react';
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
import { mockDrivers as initialMockDrivers } from '@/data/mockData';
import { Driver } from '@/types/taxi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Drivers = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [drivers, setDrivers] = useState<Driver[]>(initialMockDrivers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseId, setLicenseId] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      key: 'licenseId' as keyof Driver, 
      label: t('licenseId'),
      render: (item: Driver) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <code className="text-xs sm:text-sm bg-muted px-1.5 sm:px-2 py-0.5 rounded truncate">{item.licenseId}</code>
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
    setLicenseId(driver.licenseId);
    setIsModalOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    setDrivers(drivers.filter(d => d.id !== driver.id));
    toast.success(`${t('delete')}: ${driver.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !licenseId) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (editingDriver) {
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id ? { ...d, name, phone, licenseId } : d
      ));
      toast.success(t('save'));
    } else {
      const newDriver: Driver = {
        id: Date.now().toString(),
        name,
        phone,
        licenseId,
      };
      setDrivers([...drivers, newDriver]);
      toast.success(t('add'));
    }

    setIsModalOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        associationName="Metro Taxi Association" 
        dispatcherName="Alex Johnson"
      />

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Drivers</h1>
            <p className="text-muted-foreground">Manage registered drivers</p>
          </div>
        </div>

        <DataTable
          title="Registered Drivers"
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
