import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  History,
  Home,
  LogOut,
  Menu,
  Moon,
  PenLine,
  Plus,
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

interface AppShellProps {
  children: ReactNode;
  actions?: ReactNode;
}

const navigation = [
  { label: 'Tableau de bord', href: '/', icon: Home },
  { label: 'Quiz IA', href: '/create-quiz', icon: Sparkles },
  { label: 'Quiz manuel', href: '/create-manual-quiz', icon: PenLine },
  { label: 'Rejoindre', href: '/join', icon: Users },
  { label: 'Historique', href: '/history', icon: History },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#080b10]/95">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c46a2d] text-white shadow-[0_0_24px_rgba(196,106,45,0.35)]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-[#f7c693]">QUIZO</p>
          <p className="text-xs text-slate-500">Studio de quiz</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition',
                'hover:bg-white/[0.06] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d77a36]/60',
                isActive && 'bg-[#d77a36]/15 text-[#f7c693] ring-1 ring-[#d77a36]/30'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-lg border border-[#d77a36]/20 bg-[#d77a36]/10 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#f7c693]">
          <ShieldCheck className="h-4 w-4" />
          Bêta gratuite
        </div>
        <p className="text-xs leading-5 text-slate-400">
          Quotas protégés, compétitions live et génération IA fiable pour vos cours.
        </p>
      </div>
    </aside>
  );

  return (
    <div className="dark min-h-screen bg-[#0b0f14] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,106,45,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_220px)]" />

      <div className="relative flex min-h-screen">
        <div className="hidden w-72 shrink-0 lg:block">{sidebar}</div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-72 max-w-[82vw]">{sidebar}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f14]/88 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                  <BarChart3 className="h-4 w-4 text-[#d77a36]" />
                  <span>Plateforme SaaS de quiz live</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {actions}
                <LanguageSelector />
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 sm:flex">
                  <Moon className="h-3.5 w-3.5 text-[#f7c693]" />
                  Dark SaaS
                </div>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium text-slate-100">{user.name || 'Utilisateur'}</p>
                      <p className="max-w-44 truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Avatar className="h-9 w-9 border border-[#d77a36]/40">
                      {user.photoURL ? <AvatarImage src={user.photoURL} alt={user.name || user.email} /> : null}
                      <AvatarFallback className="bg-[#d77a36]/20 text-[#f7c693]">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:bg-white/10 hover:text-white"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="bg-[#d77a36] text-white hover:bg-[#b85f26]"
                    onClick={() => setAuthOpen(true)}
                  >
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};
