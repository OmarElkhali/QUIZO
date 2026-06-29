import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clock, Loader2, Ticket, Trophy, Users, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCompetitionByShareCode, addParticipantToCompetition, ensureParticipantSession } from '@/services/manualQuizService';
import { Competition } from '@/types/quiz';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/context/AuthContext';
import { PremiumPanel } from '@/components/ui/premium';

const REGEXP_ONLY_ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

interface RecentCompetition {
  code: string;
  title: string;
  joinedAt: string;
}

const JoinByCode = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { shareCode: urlShareCode } = useParams<{ shareCode?: string }>();

  const [shareCode, setShareCode] = useState(urlShareCode?.toUpperCase() || '');
  const [participantName, setParticipantName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [recentCompetitions, setRecentCompetitions] = useState<RecentCompetition[]>([]);

  useEffect(() => {
    if (user?.name && !participantName) {
      setParticipantName(user.name);
    }
  }, [user, participantName]);

  useEffect(() => {
    if (shareCode.length === 6) {
      const timer = setTimeout(() => {
        void checkCompetition();
      }, 500);

      return () => clearTimeout(timer);
    }

    setCompetition(null);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode]);

  const checkCompetition = async () => {
    if (!shareCode || shareCode.length !== 6) return;

    setIsCheckingCode(true);

    try {
      await ensureParticipantSession();
      const competitionData = await getCompetitionByShareCode(shareCode);
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

    if (!shareCode) {
      toast.error('Veuillez saisir un code de partage');
      return;
    }

    if (shareCode.length !== 6) {
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
      const competitionData = await getCompetitionByShareCode(shareCode);

      if (!competitionData) {
        toast.error('Code de partage invalide ou compétition expirée');
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(competitionData.startDate);
      const endDate = new Date(competitionData.endDate);

      if (now < startDate) {
        toast.error(`Cette compétition n’a pas encore commencé. Elle débutera le ${startDate.toLocaleDateString()} à ${startDate.toLocaleTimeString()}.`);
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
      addToRecentCompetitions(shareCode, competitionData.title);
      navigate(`/competition/${competitionData.id}?participant=${participantId}`);
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la compétition:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-5xl flex-col items-center justify-center py-8 text-center">
        <button type="button" onClick={() => navigate('/')} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#dbc2b0] hover:text-white">
          Retour
        </button>

        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-300/30 bg-orange-500/15 text-[#ffb77d] shadow-[0_0_36px_rgba(217,119,6,0.16)]">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-white">QUIZO</h1>

        <PremiumPanel className="mt-10 w-full max-w-2xl p-6 text-left sm:p-8">
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-black text-white">Prêt pour le défi ?</h2>
            <p className="mt-2 text-[#dbc2b0]">Entrez votre code et votre nom pour rejoindre la session.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="share-code" className="sr-only">Code de partage</Label>
              <div className="flex justify-center rounded-2xl border border-white/[0.07] bg-black/35 p-4">
                <InputOTP
                  maxLength={6}
                  value={shareCode}
                  onChange={(value) => setShareCode(value.toUpperCase())}
                  pattern={REGEXP_ONLY_ALPHANUMERIC.source}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} className="border-white/10 bg-white/[0.04] text-lg font-bold text-white focus-visible:ring-orange-400" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {(isCheckingCode || authLoading) && (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.045] p-3 text-sm text-[#a79d96]">
                <Loader2 className="h-4 w-4 animate-spin text-[#ffb77d]" />
                {authLoading ? 'Initialisation de la session...' : 'Vérification du code...'}
              </div>
            )}

            {competition && (
              <div className="rounded-2xl border border-orange-300/25 bg-orange-500/10 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{competition.title}</h3>
                    {competition.description && <p className="mt-1 text-sm text-[#a79d96]">{competition.description}</p>}
                  </div>
                  <Users className="h-5 w-5 text-[#ffb77d]" />
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[#8f8580]">Début</p>
                    <p className="text-[#e5e2e1]">{new Date(competition.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#8f8580]">Fin</p>
                    <p className="text-[#e5e2e1]">{new Date(competition.endDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#8f8580]">Participants</p>
                    <p className="text-[#e5e2e1]">{competition.participantsCount}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="participant-name" className="text-[#e5e2e1]">Votre nom</Label>
              <Input
                id="participant-name"
                placeholder="Comment souhaitez-vous être identifié ?"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="quizo-input h-12"
                required
              />
            </div>

            <Button type="submit" className="h-12 w-full quizo-copper-button" disabled={isLoading || authLoading || !shareCode || shareCode.length !== 6}>
              {isLoading || authLoading ? 'Chargement...' : 'Rejoindre la session'}
              {!(isLoading || authLoading) && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </PremiumPanel>

        <div className="mt-8 w-full max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-[#8f8580]">
            <span className="h-px flex-1 bg-white/[0.07]" />
            Ou découvrir
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PremiumPanel className="p-4 text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#ffb77d]">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Quiz publics</p>
                  <p className="text-sm text-[#a79d96]">Explorer la librairie</p>
                </div>
              </div>
            </PremiumPanel>
            <PremiumPanel className="p-4 text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#ffb77d]">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Compétitions récentes</p>
                  <p className="text-sm text-[#a79d96]">{recentCompetitions.length} code{recentCompetitions.length !== 1 ? 's' : ''} sur cet appareil</p>
                </div>
              </div>
            </PremiumPanel>
          </div>

          {recentCompetitions.length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              {recentCompetitions.map((competitionItem) => (
                <div key={competitionItem.code} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.045] p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-[#8f8580]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{competitionItem.title}</p>
                      <p className="text-xs text-[#8f8580]">
                        {competitionItem.code} · {new Date(competitionItem.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" className="text-[#ffb77d] hover:bg-orange-500/10" onClick={() => setShareCode(competitionItem.code)}>
                      Utiliser
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#8f8580] hover:bg-red-500/10 hover:text-red-300" onClick={() => removeFromRecentCompetitions(competitionItem.code)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default JoinByCode;
