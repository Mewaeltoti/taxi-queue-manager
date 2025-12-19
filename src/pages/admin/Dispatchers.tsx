import { useState, useEffect } from 'react';
import { UserCog, ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

interface Dispatcher {
  id: string;
  name: string;
  email: string;
  assigned_fermata_ids: string[];
}

interface Fermata {
  id: string;
  code: string;
  name: string;
}

const Dispatchers = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [fermatas, setFermatas] = useState<Fermata[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState<Dispatcher | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFermataId, setSelectedFermataId] = useState<string>('');

  // Load dispatchers and fermatas
  useEffect(() => {
    const fetchData = async () => {
      const { data: dispData } = await supabase
        .from('users')
        .select('id, name, email, assigned_fermata_ids')
        .eq('role', 'dispatcher');

      setDispatchers(dispData || []);

      const { data: fermData } = await supabase
        .from('fermatas')
        .select('id, code, name');

      setFermatas(fermData || []);
    };

    fetchData();
  }, []);

  const openModal = (dispatcher?: Dispatcher) => {
    if (dispatcher) {
      setEditingDispatcher(dispatcher);
      setName(dispatcher.name);
      setEmail(dispatcher.email);
      setPassword('');
      setSelectedFermataId(dispatcher.assigned_fermata_ids[0] || '');
    } else {
      setEditingDispatcher(null);
      setName('');
      setEmail('');
      setPassword('');
      setSelectedFermataId('');
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete') || 'Are you sure? This cannot be undone.')) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      setDispatchers(prev => prev.filter(d => d.id !== id));
      toast.success('Dispatcher deleted successfully');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !selectedFermataId) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!editingDispatcher && !password.trim()) {
      toast.error('Password is required for new dispatchers');
      return;
    }

    try {
      if (editingDispatcher) {
        // Update existing
        const updates: any = {
          name: name.trim(),
          email: email.trim(),
          assigned_fermata_ids: [selectedFermataId],
        };

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', editingDispatcher.id);

        if (error) throw error;

        setDispatchers(prev =>
          prev.map(d =>
            d.id === editingDispatcher.id
              ? { ...d, name: name.trim(), email: email.trim(), assigned_fermata_ids: [selectedFermataId] }
              : d
          )
        );

        toast.success('Dispatcher updated successfully');
      } else {
        // Create new
        const hashedPassword = bcrypt.hashSync(password.trim(), 10);
        const { error } = await supabase
        .from('users')
        .insert({
          email: email.trim(),
          name: name.trim(),
          role: 'dispatcher',
          assigned_fermata_ids: [selectedFermataId],
          password: password.trim(), // ← plain text
        })
          .select()
          .single();

        if (error) throw error;

        setDispatchers(prev => [...prev]);
        toast.success(`Dispatcher "${name}" created! Password has been set.`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Operation failed: ' + (err.message || 'Unknown error'));
      console.error(err);
    }
  };

  const getFermataName = (id: string) => {
    const f = fermatas.find(fm => fm.id === id);
    return f ? `${f.code} - ${f.name}` : 'Unknown';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') {
    return null; // or redirect
  }

  return (
    <div className="min-h-screen bg-background">
     
      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Manage Dispatchers</h1>
              <p className="text-muted-foreground">Create and manage dispatcher accounts</p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dispatcher
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dispatchers.length === 0 ? (
            <p className="col-span-full text-center py-8 text-muted-foreground">
              No dispatchers yet. Click "Add Dispatcher" to create one.
            </p>
          ) : (
            dispatchers.map(dispatcher => (
              <Card key={dispatcher.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{dispatcher.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{dispatcher.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(dispatcher.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      Assigned Destination:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {dispatcher.assigned_fermata_ids.map(id => (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {getFermataName(id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => openModal(dispatcher)}
                  >
                    Edit
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDispatcher ? 'Edit Dispatcher' : 'Add New Dispatcher'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!editingDispatcher}
              />
            </div>

            {!editingDispatcher && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Set a strong password"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Assign Destination</Label>
              <RadioGroup value={selectedFermataId} onValueChange={setSelectedFermataId}>
                {fermatas.map(fermata => (
                  <div key={fermata.id} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={fermata.id} id={fermata.id} />
                    <Label htmlFor={fermata.id} className="cursor-pointer font-normal">
                      {fermata.code} - {fermata.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDispatcher ? 'Save Changes' : 'Create Dispatcher'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dispatchers;