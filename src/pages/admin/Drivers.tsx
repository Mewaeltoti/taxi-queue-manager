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
import { mockDrivers } from '@/data/mockData';
import { Driver } from '@/types/taxi';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseId, setLicenseId] = useState('');

  const columns = [
    { 
      key: 'name' as keyof Driver, 
      label: 'Driver Name',
      render: (item: Driver) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {item.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
    { 
      key: 'phone' as keyof Driver, 
      label: 'Phone',
      render: (item: Driver) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          {item.phone}
        </div>
      )
    },
    { 
      key: 'licenseId' as keyof Driver, 
      label: 'License ID',
      render: (item: Driver) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <code className="text-sm bg-muted px-2 py-0.5 rounded">{item.licenseId}</code>
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
    toast.success(`Deleted driver ${driver.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !licenseId) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingDriver) {
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id ? { ...d, name, phone, licenseId } : d
      ));
      toast.success('Driver updated');
    } else {
      const newDriver: Driver = {
        id: Date.now().toString(),
        name,
        phone,
        licenseId,
      };
      setDrivers([...drivers, newDriver]);
      toast.success('Driver added');
    }

    setIsModalOpen(false);
  };

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver' : 'Add Driver'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g., +1 555-0101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License ID</Label>
              <Input
                id="license"
                placeholder="e.g., DL-2024-001"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingDriver ? 'Save Changes' : 'Add Driver'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
