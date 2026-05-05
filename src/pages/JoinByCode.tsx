import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clock, Loader2, Ticket, Users, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCompetitionByShareCode, addParticipantToCompetition, ensureParticipantSession } from '@/services/manualQuizService';
import { Competition } from '@/types/quiz';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/context/AuthContext';

const REGEXP_ONLY_ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

interface RecentCompetition {
  code: string;
  title: string;
  joinedAt: string;
}

const JoinByCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { shareCode: urlShareCode } = useParams<{ shareCode?: string }>();

  const [shareCode, setShareCode] = useState(urlShareCode?.toUpperCase() || '');
  const [participantName, setParticipantName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [recentCompetitions, setRecentCompetitions] = useState<RecentCompetition[]>([]);

  useEffect(() => {
    if (shareCode.length === 6) {
      const timer = setTimeout(() => {
        void checkCompetition();
      }, 500);

      return () => clearTimeout(timer);
    }

    setCompetition(null);
    return undefined;
    // checkCompetition is declared below but only called after render by this timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode]);

  const checkCompetition = async () => {
    const formattedCode = shareCode;

    if (!formattedCode || formattedCode.length !== 6) {
      return;
    }

    setIsCheckingCode(true);

    try {
      await ensureParticipantSession();
      const competitionData = await getCompetitionByShareCode(formattedCode);
      setCompetition(competitionData);
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      setCompetition(null);
    } finally {
      setIsCheckingCode(false);
    }
  };

  useEffect(() => {
    const storedCompetitions = localStorage.getItem('recentCompetitions');
    if (storedCompetitions) {
      try {
        setRecentCompetitions(JSON.parse(storedCompetitions) as RecentCompetition[]);
      } catch (error) {
        console.error('Erreur lors du chargement des compétitions récentes:', error);
        localStorage.removeItem('recentCompetitions');
      }
    }
  }, []);

  const addToRecentCompetitions = (code: string, title: string) => {
    const newCompetition: RecentCompetition = {
      code,
      title,
      joinedAt: new Date().toISOString(),
    };

    const updatedCompetitions = [
      newCompetition,
      ...recentCompetitions.filter((recent) => recent.code !== code).slice(0, 4),
    ];

    setRecentCompetitions(updatedCompetitions);
    localStorage.setItem('recentCompetitions', JSON.stringify(updatedCompetitions));
  };

  const removeFromRecentCompetitions = (code: string) => {
    const updatedCompetitions = recentCompetitions.filter((recent) => recent.code !== code);
    setRecentCompetitions(updatedCompetitions);
    localStorage.setItem('recentCompetitions', JSON.stringify(updatedCompetitions));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formattedCode = shareCode;

    if (!formattedCode) {
      toast.error('Veuillez saisir un code de partage');
      return;
    }

    if (formattedCode.length !== 6) {
      toast.error('Le code de partage doit contenir 6 caractères');
      return;
    }

    if (!participantName.trim()) {
      toast.error('Veuillez saisir votre nom');
      return;
    }

    setIsLoading(true);

    try {
      await ensureParticipantSession();
      const competitionData = await getCompetitionByShareCode(formattedCode);

      if (!competitionData) {
        toast.error('Code de partage invalide ou compétition expirée');
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(competitionData.startDate);
      const endDate = new Date(competitionData.endDate);

      if (now < startDate) {
        toast.error(`Cette compétition n'a pas encore commencé. Elle débutera le ${startDate.toLocaleDateString()} à ${startDate.toLocaleTimeString()}.`);
        setIsLoading(false);
        return;
      }

      if (now > endDate) {
        toast.error('Cette compétition est terminée.');
        setIsLoading(false);
        return;
      }

      const participantId = await addParticipantToCompetition(
        competitionData.id,
        user?.id || 'anonymous',
        participantName
      );

      toast.success('Vous avez rejoint la compétition avec succès');
      addToRecentCompetitions(formattedCode, competitionData.title);
      navigate(`/competition/${competitionData.id}?participant=${participantId}`);
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la compétition:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Code de participation"
        title="Rejoindre une compétition"
        description="Saisissez le code fourni par l’organisateur, confirmez votre nom et entrez dans la session."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,560px)_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d77a36]/15 text-[#f7c693]">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Entrée participant</h2>
              <p className="text-sm text-slate-500">Code à 6 caractères alphanumériques.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="share-code" className="text-slate-200">Code de partage</Label>
              <div className="flex justify-center rounded-lg border border-white/10 bg-[#0b0f14] p-4">
                <InputOTP
                  maxLength={6}
                  value={shareCode}
                  onChange={(value) => setShareCode(value.toUpperCase())}
                  pattern={REGEXP_ONLY_ALPHANUMERIC.source}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="border-white/10 bg-white/[0.04] text-white" />
                    <InputOTPSlot index={1} className="border-white/10 bg-white/[0.04] text-white" />
                    <InputOTPSlot index={2} className="border-white/10 bg-white/[0.04] text-white" />
                    <InputOTPSlot index={3} className="border-white/10 bg-white/[0.04] text-white" />
                    <InputOTPSlot index={4} className="border-white/10 bg-white/[0.04] text-white" />
                    <InputOTPSlot index={5} className="border-white/10 bg-white/[0.04] text-white" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {isCheckingCode && (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-[#f7c693]" />
                Vérification du code...
              </div>
            )}

            {competition && (
              <div className="rounded-lg border border-[#d77a36]/30 bg-[#d77a36]/10 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{competition.title}</h3>
                    {competition.description && <p className="mt-1 text-sm text-slate-400">{competition.description}</p>}
                  </div>
                  <Users className="h-5 w-5 text-[#f7c693]" />
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-slate-500">Début</p>
                    <p className="text-slate-200">{new Date(competition.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fin</p>
                    <p className="text-slate-200">{new Date(competition.endDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Participants</p>
                    <p className="text-slate-200">{competition.participantsCount}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="participant-name" className="text-slate-200">Votre nom</Label>
              <Input
                id="participant-name"
                placeholder="Comment souhaitez-vous être identifié ?"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="border-white/10 bg-[#0b0f14] text-white placeholder:text-slate-600 focus-visible:ring-[#d77a36]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#d77a36] text-white hover:bg-[#b85f26]"
              disabled={isLoading || !shareCode || shareCode.length !== 6}
            >
              {isLoading ? 'Chargement...' : 'Rejoindre la compétition'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>

        <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-[#f7c693]" />
            <div>
              <h2 className="font-semibold text-white">Compétitions récentes</h2>
              <p className="text-sm text-slate-500">Réutilisez rapidement un code déjà saisi.</p>
            </div>
          </div>

          {recentCompetitions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-slate-500">
              Aucun code récent sur cet appareil.
            </div>
          ) : (
            <div className="space-y-2">
              {recentCompetitions.map((competitionItem) => (
                <div
                  key={competitionItem.code}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0f141c] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{competitionItem.title}</p>
                      <p className="text-xs text-slate-500">
                        {competitionItem.code} · {new Date(competitionItem.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" className="text-[#f7c693] hover:bg-[#d77a36]/10" onClick={() => setShareCode(competitionItem.code)}>
                      Utiliser
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => removeFromRecentCompetitions(competitionItem.code)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </AppShell>
  );
};

export default JoinByCode;
