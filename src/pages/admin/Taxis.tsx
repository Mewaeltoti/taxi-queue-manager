import { useState } from 'react';
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
import { mockDrivers } from '@/data/mockData';
import { Taxi } from '@/types/taxi';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const mockTaxis: Taxi[] = [
  { id: '1', plateNumber: 'TX-1234', type: 'sedan', driverId: '1' },
  { id: '2', plateNumber: 'TX-5678', type: 'suv', driverId: '2' },
  { id: '3', plateNumber: 'TX-9012', type: 'van', driverId: '3' },
  { id: '4', plateNumber: 'TX-3456', type: 'minibus', driverId: '4' },
];

const taxiTypes = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'minibus', label: 'Minibus' },
];

const Taxis = () => {
  const [taxis, setTaxis] = useState<Taxi[]>(mockTaxis);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('');
  const [driverId, setDriverId] = useState('');

  const getDriverName = (id: string) => {
    return mockDrivers.find(d => d.id === id)?.name || 'Unassigned';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sedan': return 'bg-blue-100 text-blue-700';
      case 'suv': return 'bg-green-100 text-green-700';
      case 'van': return 'bg-purple-100 text-purple-700';
      case 'minibus': return 'bg-orange-100 text-orange-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const columns = [
    { 
      key: 'plateNumber' as keyof Taxi, 
      label: 'Plate Number',
      render: (item: Taxi) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <code className="font-semibold">{item.plateNumber}</code>
        </div>
      )
    },
    { 
      key: 'type' as keyof Taxi, 
      label: 'Type',
      render: (item: Taxi) => (
        <Badge className={getTypeColor(item.type)}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Badge>
      )
    },
    { 
      key: 'driverId' as keyof Taxi, 
      label: 'Assigned Driver',
      render: (item: Taxi) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-xs">
              {getDriverName(item.driverId).split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span>{getDriverName(item.driverId)}</span>
        </div>
      )
    },
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
    setPlateNumber(taxi.plateNumber);
    setType(taxi.type);
    setDriverId(taxi.driverId);
    setIsModalOpen(true);
  };

  const handleDelete = (taxi: Taxi) => {
    setTaxis(taxis.filter(t => t.id !== taxi.id));
    toast.success(`Deleted taxi ${taxi.plateNumber}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plateNumber || !type || !driverId) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingTaxi) {
      setTaxis(taxis.map(t => 
        t.id === editingTaxi.id ? { ...t, plateNumber, type: type as Taxi['type'], driverId } : t
      ));
      toast.success('Taxi updated');
    } else {
      const newTaxi: Taxi = {
        id: Date.now().toString(),
        plateNumber,
        type: type as Taxi['type'],
        driverId,
      };
      setTaxis([...taxis, newTaxi]);
      toast.success('Taxi added');
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
            <h1 className="text-2xl font-bold">Taxis</h1>
            <p className="text-muted-foreground">Manage registered vehicles</p>
          </div>
        </div>

        <DataTable
          title="Registered Taxis"
          data={taxis}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          icon={<Car className="h-5 w-5 text-accent" />}
        />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTaxi ? 'Edit Taxi' : 'Add Taxi'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plate">Plate Number</Label>
              <Input
                id="plate"
                placeholder="e.g., TX-1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Taxi Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {taxiTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver">Assign Driver</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {mockDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingTaxi ? 'Save Changes' : 'Add Taxi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Taxis;
