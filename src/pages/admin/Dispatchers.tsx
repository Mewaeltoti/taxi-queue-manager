import { useState } from 'react';
import { UserCog, ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { mockUsers, mockFermatas } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

import { useLanguage } from '@/contexts/LanguageContext';

interface Dispatcher {
  id: string;
  name: string;
  email: string;
  assignedFermatas: string[];
}

const Dispatchers = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>(
    mockUsers
      .filter(u => u.role === 'dispatcher')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        assignedFermatas: u.assignedFermatas || [],
      }))
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState<Dispatcher | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedFermatas, setSelectedFermatas] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdd = () => {
    setEditingDispatcher(null);
    setName('');
    setEmail('');
    setSelectedFermatas([]);
    setIsModalOpen(true);
  };

  const handleEdit = (dispatcher: Dispatcher) => {
    setEditingDispatcher(dispatcher);
    setName(dispatcher.name);
    setEmail(dispatcher.email);
    setSelectedFermatas(dispatcher.assignedFermatas);
    setIsModalOpen(true);
  };

  const handleDelete = (dispatcher: Dispatcher) => {
    setDispatchers(dispatchers.filter(d => d.id !== dispatcher.id));
    toast.success(`t('dispatcherDeleted', { name: dispatcher.name })`);
  };

  const handleFermataToggle = (fermataId: string) => {
    setSelectedFermatas(prev =>
      prev.includes(fermataId)
        ? prev.filter(id => id !== fermataId)
        : [...prev, fermataId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (selectedFermatas.length === 0) {
      toast.error(t('selectAtLeastOneFermata'));
      return;
    }

    if (editingDispatcher) {
      setDispatchers(dispatchers.map(d => 
        d.id === editingDispatcher.id 
          ? { ...d, name, email, assignedFermatas: selectedFermatas } 
          : d
      ));
      toast.success(t('dispatcherUpdated'));
    } else {
      const newDispatcher: Dispatcher = {
        id: Date.now().toString(),
        name,
        email,
        assignedFermatas: selectedFermatas,
      };
      setDispatchers([...dispatchers, newDispatcher]);
      toast.success(t('dispatcherAdded'));
    }

    setIsModalOpen(false);
  };

  const getFermataNames = (fermataIds: string[]) => {
    return fermataIds.map(id => {
      const fermata = mockFermatas.find(f => f.id === id);
      return fermata ? `${fermata.code} - ${fermata.name}` : id;
    });
  };

  if (!user) return null;
 
  return (
    <div className="min-h-screen bg-background">
      <Header 
        associationName={t('appName')}
        dispatcherName={user.name}
        onLogout={handleLogout}
      />

      <main className="p-4 lg:p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
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
          <Button onClick={handleAdd}>
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
                      <p className="text-sm text-muted-foreground">{dispatcher.email}</p>
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
                    <MapPin className="h-4 w-4" />
                    {t('assignedFermatas')}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getFermataNames(dispatcher.assignedFermatas).map((name, idx) => (
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
              <Input
                id="name"
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('fermataSelection')}</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {mockFermatas.map(fermata => (
                  <div key={fermata.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={fermata.id}
                      checked={selectedFermatas.includes(fermata.id)}
                      onCheckedChange={() => handleFermataToggle(fermata.id)}
                    />
                    <label
                      htmlFor={fermata.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {fermata.code} - {fermata.name}
                    </label>
                  </div>
                ))}
              </div>
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
