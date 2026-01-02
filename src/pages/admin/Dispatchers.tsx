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
    <div className="min-h-screen page-container">
      <main className="content-container">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="section-title">{t('manageDispatchers') || 'Manage Dispatchers'}</h1>
              <p className="text-sm text-muted-foreground">{t('dispatcherDescription') || 'Create and manage dispatcher accounts'}</p>
            </div>
          </div>
          <Button onClick={() => openModal()} className="w-full sm:w-auto h-11 rounded-xl gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            {t('addDispatcher') || 'Add Dispatcher'}
          </Button>
        </div>

        {/* Dispatchers Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dispatchers.length === 0 ? (
            <div className="col-span-full py-16 text-center animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <UserCog className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {t('noDispatchers') || 'No dispatchers yet. Click "Add Dispatcher" to create one.'}
              </p>
            </div>
          ) : (
            dispatchers.map((dispatcher, i) => (
              <Card key={dispatcher.id} className="card-hover overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
                        <UserCog className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{dispatcher.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{dispatcher.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(dispatcher.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-muted-foreground">{t('assignedDestination') || 'Destination'}:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dispatcher.assigned_fermata_ids.map(id => (
                        <Badge key={id} variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20">
                          {getFermataName(id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 h-10 rounded-xl hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => openModal(dispatcher)}
                  >
                    {t('edit') || 'Edit'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingDispatcher ? t('editDispatcher') || 'Edit Dispatcher' : t('addNewDispatcher') || 'Add New Dispatcher'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">{t('fullName') || 'Full Name'}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="modern-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!editingDispatcher}
                className="modern-input"
              />
            </div>

            {!editingDispatcher && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t('password') || 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('setPassword') || 'Set a strong password'}
                  className="modern-input"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('assignDestination') || 'Assign Destination'}</Label>
              <RadioGroup value={selectedFermataId} onValueChange={setSelectedFermataId} className="space-y-2">
                {fermatas.map(fermata => (
                  <div key={fermata.id} className="flex items-center space-x-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={fermata.id} id={fermata.id} />
                    <Label htmlFor={fermata.id} className="cursor-pointer font-normal flex-1">
                      {fermata.code} - {fermata.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="flex-1 h-11 rounded-xl">
                {editingDispatcher ? t('saveChanges') || 'Save Changes' : t('createDispatcher') || 'Create Dispatcher'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dispatchers;