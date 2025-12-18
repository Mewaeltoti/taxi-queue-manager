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

// Types compatible with your DB
interface Dispatcher {
  id: string;
  name: string;
  username: string;
  password?: string;
  assigned_fermata_ids: string[]; // Matches table def
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFermatas, setSelectedFermatas] = useState<string[]>([]);

  // --- Supabase Fetch ---
  useEffect(() => {
    (async () => {
      // Load dispatchers
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'dispatcher');
      if (!error && data) setDispatchers(data.map((u) => ({
        ...u,
        username: u.email.split('@')[0],
        password: '****', // password is never fetched
        assigned_fermata_ids: u.assigned_fermata_ids || [],
      })));

      // Load fermatas
      const { data: fermataData, error: fermataError } = await supabase.from('fermatas').select('*');
      if (!fermataError && fermataData) setFermatas(fermataData);
    })();
  }, []);

  // --- CRUD methods ---
  const handleAdd = () => {
    setEditingDispatcher(null);
    setName('');
    setUsername('');
    setPassword('');
    setSelectedFermatas([]);
    setIsModalOpen(true);
  };

  const handleEdit = (dispatcher: Dispatcher) => {
    setEditingDispatcher(dispatcher);
    setName(dispatcher.name);
    setUsername(dispatcher.username);
    setPassword('');
    setSelectedFermatas(dispatcher.assigned_fermata_ids);
    setIsModalOpen(true);
  };

  const handleDelete = async (dispatcher: Dispatcher) => {
    // Soft delete: set 'deleted' flag or hard delete
    const { error } = await supabase.from('users').delete().eq('id', dispatcher.id);
    if (!error) {
      setDispatchers(dispatchers.filter(d => d.id !== dispatcher.id));
      toast.success(`${t('dispatcherDeleted')}: ${dispatcher.name}`)
    } else {
      toast.error(error.message);
    }
  };

  // Only one fermata per dispatcher
  const handleFermataSelect = (fermataId: string) => {
    setSelectedFermatas([fermataId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !username) {
      toast.error(t('fillAllFields'));
      return;
    }
    if (!editingDispatcher && !password) {
      toast.error(t('fillAllFields'));
      return;
    }
    if (selectedFermatas.length !== 1) {
      toast.error(t('selectOneFermata'));
      return;
    }

    // "users" DB expects: email, name, role, assigned_fermata_ids, password (if new)
    let email = username.includes('@') ? username : username + '@taxi.com';

    if (editingDispatcher) {
      const { error } = await supabase
        .from('users')
        .update({
          name,
          email,
          assigned_fermata_ids: selectedFermatas,
          // password: password ? password : undefined, // implement password update if needed
        })
        .eq('id', editingDispatcher.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setDispatchers(dispatchers.map(d =>
        d.id === editingDispatcher.id
          ? { ...d, name, username, assigned_fermata_ids: selectedFermatas }
          : d
      ));
      toast.success(t('dispatcherUpdated'));
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email,
          name,
          role: 'dispatcher',
          assigned_fermata_ids: selectedFermatas,
          // password, // handle securely in production!
        }])
        .select();
      if (error || !data) {
        toast.error(error?.message || 'Failed to add');
        return;
      }
      setDispatchers([...dispatchers, {
        id: data[0].id,
        name,
        username,
        password,
        assigned_fermata_ids: selectedFermatas,
      }]);
      toast.success(t('dispatcherAdded'));
    }

    setIsModalOpen(false);
  };

  const getFermataNames = (fermataIds: string[]) => {
    return fermataIds.map(id => {
      const fermata = fermatas.find(f => f.id === id);
      return fermata ? `${fermata.code} - ${fermata.name}` : id;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // ----- UI remains (unchanged, except for mock -> fermatas) ------
  return (
    <div className="min-h-screen bg-background">
      <Header
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('manageUsers')}</h1>
              <p className="text-muted-foreground">{t('dispatcherDescription')}</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full sm:w-auto flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-2" />
            {t('addDispatcher')}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dispatchers.map(dispatcher => (
            <Card key={dispatcher.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{dispatcher.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{dispatcher.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(dispatcher)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t('assignedFermata')}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getFermataNames(dispatcher.assigned_fermata_ids || []).map((name, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleEdit(dispatcher)}
                >
                  {t('edit')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDispatcher ? t('editDispatcher') : t('addDispatcher')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input id="name" placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t('username')}</Label>
              <Input id="username" placeholder={t('usernamePlaceholder')} value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editingDispatcher ? t('newPassword') : t('password')}</Label>
              <Input id="password" type="password" placeholder={editingDispatcher ? t('leaveBlankToKeep') : t('passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('fermataSelection')}</Label>
              <p className="text-xs text-muted-foreground">{t('selectOneFermataHint')}</p>
              <RadioGroup value={selectedFermatas[0] || ''} onValueChange={handleFermataSelect} className="grid grid-cols-1 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {fermatas.map(fermata => (
                  <div key={fermata.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={fermata.id} id={fermata.id} />
                    <Label htmlFor={fermata.id} className="text-sm font-medium leading-none cursor-pointer">
                      {fermata.code} - {fermata.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingDispatcher ? t('save') : t('add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dispatchers;