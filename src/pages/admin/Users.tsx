import { useState } from 'react';
import { UserCog, ArrowLeft, Shield, Mail } from 'lucide-react';
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
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'viewer';
}

const mockUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@taxiassoc.com', role: 'admin' },
  { id: '2', name: 'Sarah Wilson', email: 'sarah@taxiassoc.com', role: 'dispatcher' },
  { id: '3', name: 'Mike Brown', email: 'mike@taxiassoc.com', role: 'dispatcher' },
  { id: '4', name: 'Emily Davis', email: 'emily@taxiassoc.com', role: 'viewer' },
];

const roles = [
  { value: 'admin', label: 'Admin', color: 'bg-destructive/10 text-destructive' },
  { value: 'dispatcher', label: 'Dispatcher', color: 'bg-accent/10 text-accent' },
  { value: 'viewer', label: 'Viewer', color: 'bg-muted text-muted-foreground' },
];

const Users = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const getRoleStyle = (role: string) => {
    return roles.find(r => r.value === role)?.color || 'bg-muted text-muted-foreground';
  };

  const columns = [
    { 
      key: 'name' as keyof User, 
      label: 'User',
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {item.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {item.email}
            </p>
          </div>
        </div>
      )
    },
    { 
      key: 'role' as keyof User, 
      label: 'Role',
      render: (item: User) => (
        <Badge className={getRoleStyle(item.role)}>
          <Shield className="h-3 w-3 mr-1" />
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </Badge>
      )
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('');
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      toast.error('Cannot delete the last admin user');
      return;
    }
    setUsers(users.filter(u => u.id !== user.id));
    toast.success(`Deleted user ${user.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id ? { ...u, name, email, role: role as User['role'] } : u
      ));
      toast.success('User updated');
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role: role as User['role'],
      };
      setUsers([...users, newUser]);
      toast.success('User added');
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
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage system access</p>
          </div>
        </div>

        <DataTable
          title="System Users"
          data={users}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          icon={<UserCog className="h-5 w-5 text-accent" />}
        />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add User'}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., john@taxiassoc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
