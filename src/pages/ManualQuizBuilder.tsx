import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  PenLine,
  Play,
  Plus,
  Save,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { PremiumPanel } from '@/components/ui/premium';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import {
  addQuestionToManualQuiz,
  createCompetition,
  deleteQuestionFromManualQuiz,
  generateAndAssignShareCode,
  getManualQuiz,
  updateManualQuiz,
  updateQuestionInManualQuiz,
} from '@/services/manualQuizService';
import {
  extractCourseTextFromFile,
  ManualAssistantAction,
  ManualAssistantSuggestion,
  runManualAssistant,
} from '@/services/manualAssistantService';
import { ManualQuestion, ManualQuiz } from '@/types/quiz';

type OptionDraft = ManualQuestion['options'][number];

const createDefaultOptions = (): OptionDraft[] => [
  { id: `opt_${Date.now()}_1`, text: '', isCorrect: true },
  { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
  { id: `opt_${Date.now()}_3`, text: '', isCorrect: false },
  { id: `opt_${Date.now()}_4`, text: '', isCorrect: false },
];

const toLocalDateTimeValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const assistantActions: Array<{ value: ManualAssistantAction; label: string; description: string }> = [
  { value: 'generate_from_course', label: 'Créer depuis le cours', description: 'Propose des QCM complets à valider.' },
  { value: 'improve_question', label: 'Améliorer la question', description: 'Clarifie la formulation actuelle.' },
  { value: 'generate_options', label: 'Générer options', description: 'Crée des distracteurs plausibles.' },
  { value: 'generate_explanation', label: 'Générer explication', description: 'Ajoute une justification courte.' },
  { value: 'adjust_difficulty', label: 'Ajuster difficulté', description: 'Adapte le niveau sans changer le sujet.' },
  { value: 'detect_issues', label: 'Détecter problèmes', description: 'Repère les ambiguïtés et réponses multiples.' },
  { value: 'generate_similar', label: 'Questions similaires', description: 'Décline le même concept autrement.' },
];

const ManualQuizBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showCompetitionDialog, setShowCompetitionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<OptionDraft[]>(createDefaultOptions);
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);
  const [quizMode, setQuizMode] = useState<'realtime' | 'async'>('async');
  const [quizStatus, setQuizStatus] = useState<'draft' | 'active' | 'completed'>('draft');

  const [competitionTitle, setCompetitionTitle] = useState('');
  const [competitionDescription, setCompetitionDescription] = useState('');
  const [competitionMode, setCompetitionMode] = useState<'classic' | 'teacher_led' | 'team'>('classic');
  const [startDate, setStartDate] = useState(() => toLocalDateTimeValue(new Date()));
  const [endDate, setEndDate] = useState(() => toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);

  const [assistantText, setAssistantText] = useState('');
  const [assistantFileName, setAssistantFileName] = useState('');
  const [assistantAction, setAssistantAction] = useState<ManualAssistantAction>('generate_from_course');
  const [assistantDifficulty, setAssistantDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [assistantCount, setAssistantCount] = useState(3);
  const [assistantSuggestions, setAssistantSuggestions] = useState<ManualAssistantSuggestion[]>([]);
  const [assistantIssues, setAssistantIssues] = useState<string[]>([]);
  const [assistantSummary, setAssistantSummary] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (authLoading) return;

      if (!id || !user) {
        toast.error('Utilisateur non connecté ou ID de quiz manquant');
        navigate('/');
        return;
      }

      try {
        const quizData = await getManualQuiz(id);

        if (!quizData) {
          toast.error('Quiz non trouvé');
          navigate('/create-manual-quiz');
          return;
        }

        if (quizData.creatorId !== user.id) {
          toast.error("Vous n'avez pas accès à ce quiz");
          navigate('/history');
          return;
        }

        setQuiz(quizData);
        setTimeLimit(quizData.timeLimit);
        setIsPublic(quizData.isPublic || false);
        setQuizMode(quizData.mode || 'async');
        setQuizStatus(quizData.status || 'draft');
        setCompetitionTitle(quizData.title);
        setCompetitionDescription(quizData.description || '');
      } catch (error) {
        console.error('Erreur lors de la récupération du quiz:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors de la récupération du quiz');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchQuiz();
  }, [authLoading, id, navigate, user]);

  const totalPoints = useMemo(
    () => quiz?.questions?.reduce((total, question) => total + (question.points || 1), 0) || 0,
    [quiz?.questions]
  );

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du builder" description="Vérification de votre session." />
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const refreshQuiz = async () => {
    if (!id) return;
    const updatedQuiz = await getManualQuiz(id);
    setQuiz(updatedQuiz);
  };

  const handleAddOption = () => {
    setOptions((current) => [...current, { id: `opt_${Date.now()}`, text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Un minimum de 2 options est requis');
      return;
    }

    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
    if (options[index].isCorrect && nextOptions.length > 0) {
      nextOptions[0].isCorrect = true;
    }
    setOptions(nextOptions);
  };

  const handleOptionChange = (index: number, text: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, text } : option)));
  };

  const handleCorrectOptionChange = (index: number) => {
    setOptions((current) => current.map((option, optionIndex) => ({ ...option, isCorrect: optionIndex === index })));
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setOptions(createDefaultOptions());
    setExplanation('');
    setPoints(1);
    setEditingQuestionId(null);
  };

  const populateQuestionForm = (question: Partial<ManualQuestion>) => {
    setQuestionText(question.text || '');
    setOptions(question.options?.length ? question.options : createDefaultOptions());
    setExplanation(question.explanation || '');
    setPoints(question.points || 1);
    setEditingQuestionId(question.id || null);
    setShowAddQuestion(true);
    setActiveTab('questions');
  };

  const handleSaveQuestion = async () => {
    if (!id || !quiz) return;

    if (!questionText.trim()) {
      toast.error('Veuillez saisir le texte de la question');
      return;
    }

    const filledOptions = options.filter((option) => option.text.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Veuillez saisir au moins 2 options');
      return;
    }

    if (filledOptions.filter((option) => option.isCorrect).length !== 1) {
      toast.error('Veuillez sélectionner une seule option correcte');
      return;
    }

    try {
      if (editingQuestionId) {
        await updateQuestionInManualQuiz(id, editingQuestionId, {
          id: editingQuestionId,
          text: questionText,
          options: filledOptions,
          explanation: explanation || undefined,
          points: points || 1,
        });
        toast.success('Question mise à jour');
      } else {
        await addQuestionToManualQuiz(id, {
          id: `draft_${Date.now()}`,
          text: questionText,
          options: filledOptions,
          explanation: explanation || undefined,
          points: points || 1,
        });
        toast.success('Question ajoutée');
      }

      await refreshQuiz();
      resetQuestionForm();
      setShowAddQuestion(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la question:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleEditQuestion = (question: ManualQuestion) => {
    populateQuestionForm(question);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id || !quiz) return;
    if (!confirm('Supprimer cette question ?')) return;

    try {
      await deleteQuestionFromManualQuiz(id, questionId);
      await refreshQuiz();
      toast.success('Question supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la question:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const handleGenerateShareCode = async () => {
    if (!id) return;

    try {
      const newShareCode = await generateAndAssignShareCode(id);
      await refreshQuiz();
      toast.success(`Code de partage généré : ${newShareCode}`);
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération du code');
    }
  };

  const handleSaveSettings = async () => {
    if (!id) return;

    try {
      await updateManualQuiz(id, {
        timeLimit,
        isPublic,
        mode: quizMode,
        status: quizStatus,
      });
      await refreshQuiz();
      toast.success('Paramètres enregistrés');
      setShowSettingsDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des paramètres:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleCreateCompetition = async () => {
    if (!id || !quiz) return;

    if (!competitionTitle.trim()) {
      toast.error('Veuillez saisir un titre pour la compétition');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      toast.error('Les dates de compétition sont invalides');
      return;
    }

    setIsCreatingCompetition(true);
    try {
      const competitionId = await createCompetition(id, user.id, competitionTitle, competitionDescription, start, end);
      toast.success(`Compétition créée en mode ${competitionMode === 'classic' ? 'classique' : competitionMode === 'teacher_led' ? 'teacher-led' : 'équipe'}`);
      setShowCompetitionDialog(false);
      navigate(`/creator-dashboard/${competitionId}`);
    } catch (error) {
      console.error('Erreur lors de la création de la compétition:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la compétition');
    } finally {
      setIsCreatingCompetition(false);
    }
  };

  const handleAssistantFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAssistantLoading(true);
    try {
      const text = await extractCourseTextFromFile(file);
      setAssistantText((current) => [current, text].filter(Boolean).join('\n\n'));
      setAssistantFileName(file.name);
      toast.success('Cours extrait du fichier');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'extraire le fichier");
    } finally {
      setIsAssistantLoading(false);
      event.target.value = '';
    }
  };

  const runAssistant = async (actionOverride?: ManualAssistantAction) => {
    const action = actionOverride || assistantAction;
    const needsCurrentQuestion = action !== 'generate_from_course';

    if (!assistantText.trim() && !questionText.trim()) {
      toast.error('Ajoutez un cours ou une question avant de lancer l’assistant');
      return;
    }

    setIsAssistantLoading(true);
    try {
      const response = await runManualAssistant({
        action,
        courseText: assistantText,
        question: needsCurrentQuestion
          ? {
            text: questionText,
            options,
            explanation,
            points,
          }
          : undefined,
        difficulty: assistantDifficulty,
        numQuestions: action === 'generate_from_course' || action === 'generate_similar' ? assistantCount : 1,
        language: 'fr',
      });

      setAssistantSuggestions(response.suggestions);
      setAssistantIssues(response.issues);
      setAssistantSummary(response.summary);
      toast.success(response.fallback ? 'Propositions de secours générées' : 'Assistant OpenRouter terminé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Assistant indisponible');
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const addSuggestionToQuiz = async (suggestion: ManualAssistantSuggestion) => {
    if (!id) return;

    try {
      await addQuestionToManualQuiz(id, {
        id: suggestion.id,
        text: suggestion.text,
        options: suggestion.options,
        explanation: suggestion.explanation,
        points: suggestion.points || 1,
      });
      await refreshQuiz();
      setAssistantSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
      toast.success('Question ajoutée depuis l’assistant');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la question");
    }
  };

  const addAllSuggestions = async () => {
    if (!id || assistantSuggestions.length === 0) return;

    try {
      for (const suggestion of assistantSuggestions) {
        await addQuestionToManualQuiz(id, {
          id: suggestion.id,
          text: suggestion.text,
          options: suggestion.options,
          explanation: suggestion.explanation,
          points: suggestion.points || 1,
        });
      }
      await refreshQuiz();
      setAssistantSuggestions([]);
      toast.success('Toutes les propositions ont été ajoutées');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter toutes les propositions");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du quiz" description="Préparation du builder manuel." />
      </AppShell>
    );
  }

  if (!quiz) {
    return (
      <AppShell>
        <StateCard state="empty" title="Quiz introuvable" description="Ce quiz n'existe plus ou vous n'y avez pas accès." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Builder manuel"
        title={quiz.title || 'Quiz sans titre'}
        description={quiz.description || 'Ajoutez, améliorez et organisez vos questions avant le partage.'}
        actions={
          <>
            {quiz.shareCode && <Badge className="border-orange-400/25 bg-orange-500/10 px-3 py-2 font-mono text-[#d97706]">{quiz.shareCode}</Badge>}
            <Button variant="outline" className="quizo-outline-button" onClick={handleGenerateShareCode}>
              <Share2 className="mr-2 h-4 w-4" />
              {quiz.shareCode ? 'Nouveau code' : 'Générer code'}
            </Button>
            <Button variant="outline" className="quizo-outline-button" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
            <Button variant="outline" className="quizo-outline-button" onClick={() => setShowCompetitionDialog(true)}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Compétition
            </Button>
            <Button className="quizo-copper-button" onClick={() => navigate(`/quiz-preview/${id}`)}>
              <Play className="mr-2 h-4 w-4" />
              Tester
            </Button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <PremiumPanel className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                <p className="quizo-label">Questions</p>
                <p className="mt-2 text-3xl font-black text-[var(--quizo-heading)]">{quiz.questions.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                <p className="quizo-label">Points</p>
                <p className="mt-2 text-3xl font-black text-[var(--quizo-heading)]">{totalPoints}</p>
              </div>
              <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                <p className="quizo-label">Mode</p>
                <p className="mt-2 text-2xl font-black text-[var(--quizo-heading)]">{quizMode === 'realtime' ? 'Live' : 'Libre'}</p>
              </div>
            </div>
          </PremiumPanel>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-1">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="mt-5 space-y-5">
              {showAddQuestion ? (
                <PremiumPanel className="p-5">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--quizo-heading)]">
                        {editingQuestionId ? 'Modifier la question' : 'Ajouter une question'}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--quizo-muted)]">Une seule réponse correcte est attendue.</p>
                    </div>
                    <Button variant="outline" className="quizo-outline-button" onClick={() => runAssistant('detect_issues')}>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Analyser
                    </Button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="question-text">Question</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Saisissez votre question ici..."
                        value={questionText}
                        onChange={(event) => setQuestionText(event.target.value)}
                        className="quizo-input min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" className="quizo-outline-button" onClick={handleAddOption}>
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter une option
                        </Button>
                      </div>
                      <RadioGroup value={options.findIndex((option) => option.isCorrect).toString()} className="space-y-2">
                        {options.map((option, index) => (
                          <div key={option.id} className="flex items-center gap-3 rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-3">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} checked={option.isCorrect} onClick={() => handleCorrectOptionChange(index)} />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.text}
                              onChange={(event) => handleOptionChange(index, event.target.value)}
                              className="quizo-input"
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-[var(--quizo-muted)] hover:text-red-400" onClick={() => handleRemoveOption(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_160px]">
                      <div className="space-y-2">
                        <Label htmlFor="explanation">Explication</Label>
                        <Textarea
                          id="explanation"
                          placeholder="Expliquez pourquoi la réponse est correcte..."
                          value={explanation}
                          onChange={(event) => setExplanation(event.target.value)}
                          className="quizo-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="points">Points</Label>
                        <Select value={points.toString()} onValueChange={(value) => setPoints(Number(value))}>
                          <SelectTrigger className="quizo-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5, 10].map((value) => (
                              <SelectItem key={value} value={value.toString()}>
                                {value} point{value > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[var(--quizo-border)] pt-5">
                    <Button
                      variant="outline"
                      className="quizo-outline-button"
                      onClick={() => {
                        resetQuestionForm();
                        setShowAddQuestion(false);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button className="quizo-copper-button" onClick={handleSaveQuestion}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingQuestionId ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                  </div>
                </PremiumPanel>
              ) : (
                <PremiumPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--quizo-heading)]">
                      {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-[var(--quizo-muted)]">Ajoutez manuellement ou utilisez l’assistant OpenRouter.</p>
                  </div>
                  <Button className="quizo-copper-button" onClick={() => setShowAddQuestion(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une question
                  </Button>
                </PremiumPanel>
              )}

              {!showAddQuestion && quiz.questions.length === 0 && (
                <StateCard
                  state="empty"
                  title="Aucune question"
                  description="Collez un cours dans l'assistant ou ajoutez votre première question."
                  action={<Button className="quizo-copper-button" onClick={() => setShowAddQuestion(true)}>Ajouter une question</Button>}
                />
              )}

              {!showAddQuestion && quiz.questions.map((question, index) => (
                <PremiumPanel key={question.id} className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="quizo-label">Question {index + 1}</p>
                      <h3 className="mt-2 text-lg font-bold text-[var(--quizo-heading)]">{question.text}</h3>
                      <p className="mt-1 text-sm text-[var(--quizo-muted)]">{question.points || 1} point{(question.points || 1) > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-[var(--quizo-muted)] hover:text-[#d97706]" onClick={() => handleEditQuestion(question)}>
                        <PenLine className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-[var(--quizo-muted)] hover:text-red-400" onClick={() => handleDeleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`rounded-xl border p-3 text-sm ${
                          option.isCorrect
                            ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-text)]'
                        }`}
                      >
                        {option.text}
                        {option.isCorrect && <span className="ml-2 font-semibold">(Correcte)</span>}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
                      <p className="text-sm font-semibold text-sky-500 dark:text-sky-300">Explication</p>
                      <p className="mt-1 text-sm text-[var(--quizo-text)]">{question.explanation}</p>
                    </div>
                  )}
                </PremiumPanel>
              ))}
            </TabsContent>

            <TabsContent value="preview" className="mt-5">
              <PremiumPanel className="p-6">
                <h2 className="text-2xl font-black text-[var(--quizo-heading)]">{quiz.title}</h2>
                <p className="mt-2 text-[var(--quizo-muted)]">{quiz.description || 'Aucune description.'}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                    <p className="quizo-label">Questions</p>
                    <p className="mt-2 text-2xl font-black text-[var(--quizo-heading)]">{quiz.questions.length}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                    <p className="quizo-label">Total points</p>
                    <p className="mt-2 text-2xl font-black text-[var(--quizo-heading)]">{totalPoints}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                    <p className="quizo-label">Temps</p>
                    <p className="mt-2 text-2xl font-black text-[var(--quizo-heading)]">{quiz.timeLimit ? `${quiz.timeLimit} min` : 'Libre'}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  <Button variant="outline" className="quizo-outline-button" onClick={() => setActiveTab('questions')}>
                    Retour aux questions
                  </Button>
                  <Button className="quizo-copper-button" onClick={() => navigate(`/quiz-preview/${id}`)}>
                    <Play className="mr-2 h-4 w-4" />
                    Tester le quiz
                  </Button>
                </div>
              </PremiumPanel>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <PremiumPanel className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/12 text-[#d97706]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--quizo-heading)]">Assistant QCM OpenRouter</h2>
                <p className="text-sm text-[var(--quizo-muted)]">Propose, vous décidez.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistant-action">Action</Label>
                <Select value={assistantAction} onValueChange={(value: ManualAssistantAction) => setAssistantAction(value)}>
                  <SelectTrigger className="quizo-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assistantActions.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--quizo-muted)]">
                  {assistantActions.find((action) => action.value === assistantAction)?.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Difficulté</Label>
                  <Select value={assistantDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setAssistantDifficulty(value)}>
                    <SelectTrigger className="quizo-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Select value={assistantCount.toString()} onValueChange={(value) => setAssistantCount(Number(value))}>
                    <SelectTrigger className="quizo-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 8, 10].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistant-course">Cours / consignes</Label>
                <Textarea
                  id="assistant-course"
                  placeholder="Collez ici votre cours, chapitre ou consignes pédagogiques..."
                  value={assistantText}
                  onChange={(event) => setAssistantText(event.target.value)}
                  className="quizo-input min-h-[160px]"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-[#d97706] transition hover:bg-orange-500/15">
                <Upload className="h-4 w-4" />
                {assistantFileName ? assistantFileName : 'Importer PDF, DOCX ou TXT'}
                <input className="hidden" type="file" accept=".pdf,.docx,.txt" onChange={handleAssistantFile} />
              </label>

              <Button className="quizo-copper-button w-full" onClick={() => runAssistant()} disabled={isAssistantLoading}>
                {isAssistantLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Lancer l’assistant
              </Button>
            </div>
          </PremiumPanel>

          {(assistantSummary || assistantIssues.length > 0 || assistantSuggestions.length > 0) && (
            <PremiumPanel className="p-5">
              {assistantSummary && (
                <div className="mb-4 rounded-xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-[var(--quizo-text)]">
                  {assistantSummary}
                </div>
              )}
              {assistantIssues.length > 0 && (
                <div className="mb-4 space-y-2">
                  {assistantIssues.map((issue) => (
                    <div key={issue} className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
              {assistantSuggestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-[var(--quizo-heading)]">Propositions</h3>
                    <Button size="sm" variant="outline" className="quizo-outline-button" onClick={addAllSuggestions}>
                      Tout ajouter
                    </Button>
                  </div>
                  {assistantSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
                      <h4 className="font-semibold text-[var(--quizo-heading)]">{suggestion.text}</h4>
                      <div className="mt-3 space-y-2">
                        {suggestion.options.map((option) => (
                          <div key={option.id} className={`rounded-lg px-3 py-2 text-sm ${option.isCorrect ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-[var(--quizo-surface)] text-[var(--quizo-text)]'}`}>
                            {option.isCorrect && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
                            {option.text}
                          </div>
                        ))}
                      </div>
                      {suggestion.explanation && <p className="mt-3 text-sm text-[var(--quizo-muted)]">{suggestion.explanation}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" className="quizo-copper-button" onClick={() => addSuggestionToQuiz(suggestion)}>
                          Ajouter
                        </Button>
                        <Button size="sm" variant="outline" className="quizo-outline-button" onClick={() => populateQuestionForm(suggestion)}>
                          Modifier avant ajout
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAssistantSuggestions((current) => current.filter((item) => item.id !== suggestion.id))}>
                          Ignorer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PremiumPanel>
          )}
        </aside>
      </section>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="quizo-panel max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paramètres du quiz</DialogTitle>
            <DialogDescription>Configurez l’accès, le temps et le statut.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-4">
              <div>
                <Label htmlFor="public-quiz">Quiz public</Label>
                <p className="text-sm text-[var(--quizo-muted)]">Active l’accès via code ou lien.</p>
              </div>
              <Switch id="public-quiz" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Limite de temps</Label>
                <Select value={timeLimit?.toString() || 'none'} onValueChange={(value) => setTimeLimit(value === 'none' ? undefined : Number(value))}>
                  <SelectTrigger className="quizo-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune limite</SelectItem>
                    {[5, 10, 15, 20, 30, 45, 60].map((value) => (
                      <SelectItem key={value} value={value.toString()}>{value} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={quizMode} onValueChange={(value: 'realtime' | 'async') => setQuizMode(value)}>
                  <SelectTrigger className="quizo-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="async">Asynchrone</SelectItem>
                    <SelectItem value="realtime">Temps réel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={quizStatus} onValueChange={(value: 'draft' | 'active' | 'completed') => setQuizStatus(value)}>
                <SelectTrigger className="quizo-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="quizo-outline-button" onClick={() => setShowSettingsDialog(false)}>Annuler</Button>
            <Button className="quizo-copper-button" onClick={handleSaveSettings}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompetitionDialog} onOpenChange={setShowCompetitionDialog}>
        <DialogContent className="quizo-panel max-w-3xl">
          <DialogHeader>
            <DialogTitle>Créer une compétition</DialogTitle>
            <DialogDescription>Préparez le lobby, le code et le dashboard live.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competition-title">Titre</Label>
                <Input id="competition-title" value={competitionTitle} onChange={(event) => setCompetitionTitle(event.target.value)} className="quizo-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition-description">Description</Label>
                <Textarea id="competition-description" value={competitionDescription} onChange={(event) => setCompetitionDescription(event.target.value)} className="quizo-input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Début</Label>
                  <Input id="start-date" type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="quizo-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fin</Label>
                  <Input id="end-date" type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="quizo-input" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { id: 'classic', title: 'Classic student-paced', text: 'Chaque participant avance à son rythme.' },
                { id: 'teacher_led', title: 'Teacher-led', text: 'Structure prête pour pilotage enseignant.' },
                { id: 'team', title: 'Team mode', text: 'Prépare une compétition par équipes.' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCompetitionMode(mode.id as typeof competitionMode)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    competitionMode === mode.id
                      ? 'border-orange-400/45 bg-orange-500/12 text-[var(--quizo-heading)]'
                      : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-text)] hover:border-orange-400/30'
                  }`}
                >
                  <p className="font-semibold">{mode.title}</p>
                  <p className="mt-1 text-xs text-[var(--quizo-muted)]">{mode.text}</p>
                </button>
              ))}
              <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-4">
                <FileText className="mb-2 h-5 w-5 text-[#d97706]" />
                <p className="text-sm font-semibold text-[var(--quizo-heading)]">Code généré automatiquement</p>
                <p className="mt-1 text-xs text-[var(--quizo-muted)]">Après création, le dashboard live s’ouvrira directement.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="quizo-outline-button" onClick={() => setShowCompetitionDialog(false)}>Annuler</Button>
            <Button className="quizo-copper-button" onClick={handleCreateCompetition} disabled={isCreatingCompetition}>
              {isCreatingCompetition ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              Créer la compétition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default ManualQuizBuilder;
