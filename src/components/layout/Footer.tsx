import { Link } from 'react-router-dom';
import { ExternalLink, Github, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 mt-12 overflow-hidden border-t border-orange-400/15 bg-[var(--quizo-header)]/95">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
      <div className="quizo-page-frame grid gap-9 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.85fr]">
        <section>
          <div className="flex items-center gap-3">
            <img src="/quizo-logo.png" alt="QUIZO" className="h-12 w-12 rounded-2xl object-contain ring-1 ring-orange-400/25" />
            <div><p className="quizo-brand-text text-2xl font-black tracking-tighter">QUIZO</p><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Quiz intelligents & live</p></div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--quizo-muted)]">Créez, jouez et analysez des quiz conçus pour apprendre vite, partager simplement et vivre la compétition en direct.</p>
          <a href="https://github.com/OmarElkhali/QUIZO" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--quizo-heading)] transition hover:text-orange-300"><Github className="h-4 w-4" />Projet créé par Omar Elkhali <ExternalLink className="h-3.5 w-3.5" /></a>
        </section>
        <section><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--quizo-heading)]">Explorer</h2><nav className="mt-4 grid gap-3 text-sm text-[var(--quizo-muted)]"><Link to="/create-quiz" className="transition hover:text-orange-300">Créer avec l’IA</Link><Link to="/create-manual-quiz" className="transition hover:text-orange-300">Créer manuellement</Link><Link to="/join" className="transition hover:text-orange-300">Rejoindre une partie</Link><Link to="/history" className="transition hover:text-orange-300">Mes quiz</Link></nav></section>
        <section><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--quizo-heading)]">Confiance</h2><div className="mt-4 space-y-3 text-sm text-[var(--quizo-muted)]"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Connexion HTTPS sécurisée</p><p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-300" />IA à la demande, contrôlée</p><div className="flex flex-wrap gap-x-4 gap-y-2 pt-1"><Link to="/privacy-policy" className="hover:text-orange-300">Confidentialité</Link><Link to="/terms-of-service" className="hover:text-orange-300">Conditions</Link><Link to="/contact" className="hover:text-orange-300">Contact</Link></div></div></section>
      </div>
      <div className="border-t border-[var(--quizo-border)]"><div className="quizo-page-frame flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-[var(--quizo-muted)]"><span>© {new Date().getFullYear()} QUIZO · Tous droits réservés.</span><span className="inline-flex items-center gap-1">Conçu avec <Heart className="h-3.5 w-3.5 fill-orange-400 text-orange-400" /> par <strong className="text-[var(--quizo-heading)]">Omar Elkhali</strong></span></div></div>
    </footer>
  );
}
