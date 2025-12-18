import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Loader2 } from 'lucide-react';
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
      // Navigation happens automatically via HomeRedirect
    } else {
      toast.error(t('invalidCredentials') || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switch */}
        <div className="text-right mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLang(lang === 'en' ? 'ti' : 'en')}
          >
            {lang === 'en' ? 'ትግርኛ' : 'English'}
          </Button>
        </div>

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t('appName')}</h1>
          <p className="text-muted-foreground mt-1">{t('queueManagement')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">{t('loginTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                t('login')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}