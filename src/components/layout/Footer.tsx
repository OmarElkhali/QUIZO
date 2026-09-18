import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t border-[var(--quizo-border)] bg-[var(--quizo-header)]/80 backdrop-blur-xl">
      <div className="quizo-page-frame grid gap-6 py-7 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-center gap-3">
          <img src="/quizo-logo.png" alt="QUIZO" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <p className="font-black tracking-tight text-[var(--quizo-heading)]">QUIZO</p>
            <p className="text-xs text-[var(--quizo-muted)]">Apprendre, créer et jouer.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-[var(--quizo-muted)] sm:justify-end">
          <Link to="/privacy-policy" className="transition hover:text-orange-400">Confidentialité</Link>
          <Link to="/terms-of-service" className="transition hover:text-orange-400">Conditions</Link>
          <Link to="/contact" className="transition hover:text-orange-400">Contact</Link>
          <span className="inline-flex items-center gap-1.5 text-emerald-500 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />HTTPS sécurisé</span>
        </div>
      </div>
      <div className="border-t border-[var(--quizo-border)]">
        <div className="quizo-page-frame py-3 text-xs text-[var(--quizo-muted)]">© {new Date().getFullYear()} QUIZO. Tous droits réservés.</div>
      </div>
    </footer>
  );
}
