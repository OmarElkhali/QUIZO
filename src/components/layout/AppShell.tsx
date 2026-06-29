import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BadgeEuro,
  BookOpen,
  History,
  Home,
  LogOut,
  Menu,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AuthDialog } from '@/components/AuthDialog';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppShellProps {
  children: ReactNode;
  actions?: ReactNode;
}

const navigation = [
  { key: 'nav.home', label: 'Accueil', href: '/', icon: Home },
  { key: 'nav.createQuizAI', label: 'Créer un Quiz IA', href: '/create-quiz', icon: Sparkles },
  { key: 'nav.createQuizManual', label: 'Créer un Quiz Manuel', href: '/create-manual-quiz', icon: PenLine },
  { key: 'nav.joinByCode', label: 'Rejoindre par Code', href: '/join', icon: Users },
  { key: 'nav.history', label: 'Historique', href: '/history', icon: History },
  { key: 'nav.pricing', label: 'Tarifs', href: '/pricing', icon: BadgeEuro },
];

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name || email || 'Utilisateur';
  return source
    .split(/[ .@_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

export const AppShell = ({ children, actions }: AppShellProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = (mobile = false) => (
    <nav className={cn(mobile ? 'space-y-1 p-4' : 'hidden items-center gap-1 lg:flex')}>
      {navigation.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide text-[var(--quizo-muted)] transition',
              'hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60',
              isActive && 'border border-orange-400/20 bg-orange-500/10 text-[#d97706]',
              mobile && 'w-full px-3 py-3'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span>{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="quizo-app-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <div className="pointer-events-none fixed inset-0 quizo-grid-overlay opacity-60" />

      <div className="relative min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[var(--quizo-border)] bg-[var(--quizo-header)] backdrop-blur-2xl">
          <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button type="button" className="flex items-center gap-3" onClick={() => navigate('/')}>
              <BookOpen className="h-6 w-6 text-orange-500" />
              <span className="quizo-brand-text text-2xl font-black tracking-tighter">QUIZO</span>
            </button>

            {navLinks()}

            <div className="flex items-center gap-2">
              {actions}
              <LanguageSelector />
              <ThemeToggle />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)] sm:inline-flex"
              >
                <Search className="h-4 w-4" />
              </Button>
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden text-right xl:block">
                    <p className="text-sm font-semibold text-[var(--quizo-heading)]">{user.name || t('nav.user')}</p>
                    <p className="max-w-44 truncate text-xs text-[var(--quizo-muted)]">{user.email}</p>
                  </div>
                  <Avatar className="h-9 w-9 border border-orange-400/35">
                    {user.photoURL ? <AvatarImage src={user.photoURL} alt={user.name || user.email} /> : null}
                    <AvatarFallback className="bg-orange-500/15 text-[#d97706]">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)] sm:inline-flex"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" className="quizo-copper-button hidden sm:inline-flex" onClick={() => setAuthOpen(true)}>
                  {t('nav.login')}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[var(--quizo-text)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)] lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label={t('common.close')}
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="quizo-app-bg relative flex h-full w-80 max-w-[86vw] flex-col border-r border-[var(--quizo-border)]">
              <div className="flex h-20 items-center justify-between border-b border-[var(--quizo-border)] px-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-orange-500" />
                  <span className="quizo-brand-text text-2xl font-black tracking-tighter">QUIZO</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-[var(--quizo-text)]" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {navLinks(true)}
              <div className="m-4 mt-auto rounded-xl border border-orange-400/20 bg-orange-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#d97706] dark:text-[#ffb77d]">
                  <ShieldCheck className="h-4 w-4" />
                  Bêta gratuite
                </div>
                <p className="text-xs leading-5 text-[var(--quizo-muted)]">
                  Quotas protégés, compétitions live et génération IA fiable pour vos cours.
                </p>
              </div>
            </aside>
          </div>
        )}

        <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};
