import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(email.trim(), password);

    if (success) {
      toast.success(t('loginSuccess') || 'Welcome back!');
    } else {
      toast.error(t('invalidCredentials') || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen page-container flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Language Switch */}
        <div className="flex justify-end mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLang(lang === 'en' ? 'ti' : 'en')}
            className="gap-2 rounded-full px-4 h-10 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all"
          >
            <Globe className="h-4 w-4" />
            {lang === 'en' ? 'ትግርኛ' : 'English'}
          </Button>
        </div>

        {/* Branding */}
        <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-5 shadow-xl shadow-primary/30 animate-bounce-subtle">
            <Car className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-muted-foreground mt-2 text-base">{t('queueManagement')}</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-6 sm:p-8 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold">{t('loginTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary" />
                {t('email')}
              </Label>
             <Input
  id="email"
  type="email"
  placeholder="name@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}  // ← Fixed
  required
  className="modern-input"
/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-primary" />
                {t('password')}
              </Label>
              <Input
  id="password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}  // ← Fixed
  required
  className="modern-input"
/>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          © 2024 Taxi Queue Management System
        </p>
      </div>
    </div>
  );
}
