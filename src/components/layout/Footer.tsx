import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return <footer className="relative z-10 mt-16 border-t border-[var(--quizo-border)] bg-[var(--quizo-bg)]">
    <div className="quizo-page-frame grid gap-10 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
      <div><p className="text-2xl font-bold tracking-tight text-[var(--quizo-heading)]">QUIZO<span className="text-orange-500">.</span></p><p className="mt-3 max-w-sm text-sm leading-6 text-[var(--quizo-muted)]">Créez, jouez et analysez des quiz conçus pour apprendre ensemble.</p><a href="https://github.com/OmarElkhali/QUIZO" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm text-[var(--quizo-text)] hover:text-orange-400">Un projet d’Omar Elkhali <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a></div>
      <nav aria-label="Explorer" className="flex flex-col items-start gap-3 text-sm text-[var(--quizo-muted)]"><p className="mb-1 font-semibold text-[var(--quizo-heading)]">Explorer</p><Link to="/create-quiz" className="hover:text-orange-400">Créer avec l’IA</Link><Link to="/create-manual-quiz" className="hover:text-orange-400">Créer manuellement</Link><Link to="/join" className="hover:text-orange-400">Rejoindre une partie</Link><Link to="/history" className="hover:text-orange-400">Mes quiz</Link></nav>
      <nav aria-label="Informations" className="flex flex-col items-start gap-3 text-sm text-[var(--quizo-muted)]"><p className="mb-1 font-semibold text-[var(--quizo-heading)]">Informations</p><Link to="/pricing" className="hover:text-orange-400">Tarifs</Link><Link to="/privacy-policy" className="hover:text-orange-400">Confidentialité</Link><Link to="/terms-of-service" className="hover:text-orange-400">Conditions</Link><Link to="/contact" className="hover:text-orange-400">Contact</Link></nav>
    </div>
    <div className="border-t border-[var(--quizo-border)]"><div className="quizo-page-frame py-4 text-xs text-[var(--quizo-muted)]">© {new Date().getFullYear()} QUIZO</div></div>
  </footer>;
}
