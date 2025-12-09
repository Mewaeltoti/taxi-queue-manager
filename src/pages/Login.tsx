import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { t } from '@/lib/translations';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    
    if (success) {
      toast.success('ብዓወት ተመዝጊብካ!');
      navigate('/');
    } else {
      toast.error(t.invalidCredentials);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.appName}</h1>
          <p className="text-muted-foreground mt-1">{t.queueManagement}</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">{t.loginTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t.email}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.password}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.login
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">{t.admin}:</span>
                <code className="text-xs">admin@taxi.com</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">{t.dispatcher}:</span>
                <code className="text-xs">dispatcher@taxi.com</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">{t.password}:</span>
                <code className="text-xs">demo123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
