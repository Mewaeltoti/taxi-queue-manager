import { useEffect, useState } from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';
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
import { Fermata } from '@/types/taxi';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Fermatas = () => {
  const [fermatas, setFermatas] = useState<Fermata[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFermata, setEditingFermata] = useState<Fermata | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  // LOAD
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('fermatas').select('*').order('code');
      if (error) toast.error('Failed to fetch destinations: ' + error.message);
      if (data) setFermatas(data);
    })();
  }, []);

  // DataTable columns
  const columns = [
    { 
      key: 'code' as keyof Fermata, 
      label: 'Code',
      render: (item: Fermata) => (
        <span className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center font-bold text-accent">
          {item.code}
        </span>
      )
    },
    { key: 'name' as keyof Fermata, label: 'Destination Name' },
  ];

  // -- CRUD Handlers --
  const handleAdd = () => {
    setEditingFermata(null);
    setCode('');
    setName('');
    setIsModalOpen(true);
  };

  const handleEdit = (fermata: Fermata) => {
    setEditingFermata(fermata);
    setCode(fermata.code);
    setName(fermata.name);
    setIsModalOpen(true);
  };

  const handleDelete = async (fermata: Fermata) => {
    // Supabase delete
    const { error } = await supabase.from('fermatas').delete().eq('id', fermata.id);
    if (!error) {
      setFermatas(fermatas.filter(f => f.id !== fermata.id));
      toast.success(`Deleted destination ${fermata.code}`);
    } else {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingFermata) {
      // Update
      const { error, data } = await supabase
        .from('fermatas')
        .update({ code, name })
        .eq('id', editingFermata.id)
        .select();
      if (!error) {
        setFermatas(fermatas.map(f =>
          f.id === editingFermata.id ? { ...f, code, name } : f
        ));
        toast.success('Destination updated');
      } else {
        toast.error('Failed to update: ' + error.message);
      }
    } else {
      // Add
      const { data, error } = await supabase
        .from('fermatas')
        .insert([{ code, name }])
        .select();
      if (!error && data && data[0]) {
        setFermatas([...fermatas, data[0]]);
        toast.success('Destination added');
      } else {
        toast.error('Failed to add: ' + error?.message);
      }
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
            <h1 className="text-2xl font-bold">Fermatas</h1>
            <p className="text-muted-foreground">Manage taxi destinations</p>
          </div>
        </div>

        <DataTable
          title="Destinations"
          data={fermatas}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          icon={<MapPin className="h-5 w-5 text-accent" />}
        />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFermata ? 'Edit Destination' : 'Add Destination'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g., A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={2}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Destination Name</Label>
              <Input
                id="name"
                placeholder="e.g., Central Station"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingFermata ? 'Save Changes' : 'Add Destination'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fermatas;