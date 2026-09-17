import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { FileUpload } from './FileUpload';
import { toast } from 'sonner';
import { BrainCircuit, Share2, ArrowRight, Loader2, Clock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AIModelType } from '@/types/quiz';
import { BackendCapabilities, getBackendCapabilities } from '@/services/backendCapabilities';

const AI_MODELS: Array<{ value: AIModelType; label: string; description: string; badge?: string }> = [
  { value: 'groq', label: 'Groq', description: '⚡ Ultra-rapide (3-5s), gratuit et illimité.', badge: 'Recommandé' },
  { value: 'gemini', label: 'Gemini', description: '🔥 Modèle puissant de Google pour la génération de quiz.' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Routeur rapide multi-modèles (Llama, etc.).' },
];

export const QuizForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createQuiz } = useQuiz();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [enableTimeLimit, setEnableTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [modelType, setModelType] = useState<AIModelType>('groq'); // Groq par défaut (ultra-rapide)
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCreated, setQuizCreated] = useState(false);
  const [redirectCounter, setRedirectCounter] = useState(5);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  const availableProviders = AI_MODELS.filter((model) => capabilities?.providers[model.value]?.configured);

  const refreshCapabilities = useCallback(async (forceRefresh = false) => {
    setCapabilityError(null);
    try {
      const next = await getBackendCapabilities(forceRefresh);
      setCapabilities(next);
      setModelType((current) => next.providers[current]?.configured
        ? current
        : AI_MODELS.find((model) => next.providers[model.value]?.configured)?.value || current);
    } catch (capabilityRequestError) {
      console.error('Impossible de charger les fournisseurs IA:', capabilityRequestError);
      setCapabilityError('Impossible de vérifier les API. Réessayez dans quelques instants.');
    }
  }, []);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizCreated && createdQuizId && redirectCounter > 0) {
      console.log(`Redirection dans ${redirectCounter} secondes vers /quiz/${createdQuizId}`);
      timer = setTimeout(() => {
        setRedirectCounter(prev => prev - 1);
      }, 1000);
    } else if (quizCreated && createdQuizId && redirectCounter === 0) {
      console.log(`Redirection immédiate vers /quiz/${createdQuizId}`);
      navigate(`/quiz-preview/${createdQuizId}`);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [quizCreated, redirectCounter, createdQuizId, navigate]);
  
  const handleFileSelect = (file: File) => {
    setFile(file);
    setError(null);
    toast.success('Fichier téléchargé avec succès');
  };
  
  const handleCancel = () => {
    setIsSubmitting(false);
    setProgressLogs([]);
    setProgressPercent(0);
    setError(null);
    
    if (quizCreated && createdQuizId) {
      console.log(`Redirection manuelle vers /quiz-preview/${createdQuizId}`);
      navigate(`/quiz-preview/${createdQuizId}`);
    }
  };
  
  const handleRedirectNow = () => {
    if (createdQuizId) {
      console.log(`Redirection manuelle vers /quiz-preview/${createdQuizId}`);
      navigate(`/quiz-preview/${createdQuizId}`);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Veuillez vous connecter pour créer un quiz');
      return;
    }
    
    if (!file) {
      toast.error('Veuillez télécharger un fichier de cours');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    setQuizCreated(false);
    setCreatedQuizId(null);
    setProgressLogs([]);
    setProgressStage('Initialisation');
    setProgressPercent(5);
    
    const addLog = (message: string) => {
      setProgressLogs(prev => [...prev, message]);
      console.log(`[Quiz Generation]: ${message}`);
    };
    
    try {
      addLog(`Démarrage de la création d’un quiz avec ${numQuestions} questions, difficulté: ${difficulty}, modèle: ${modelType}`);
      setProgressStage('Téléchargement du fichier');
      setProgressPercent(15);
      
      const statusCallback = (stage: string, percent: number, message?: string) => {
        console.log(`[Quiz Progress] ${stage}: ${percent}% - ${message || ''}`);
        setProgressStage(stage);
        setProgressPercent(percent);
        if (message) addLog(message);
      };
      
      const quizId = await createQuiz(
        file, 
        numQuestions, 
        difficulty, 
        enableTimeLimit ? timeLimit : undefined, 
        additionalInfo,
        modelType,
        '',
        statusCallback
      );
      
      addLog('Génération terminée avec succès !');
      addLog(`Quiz créé avec l’ID: ${quizId}`);
      setProgressStage('Terminé');
      setProgressPercent(100);
      
      setQuizCreated(true);
      setCreatedQuizId(quizId);
      setRedirectCounter(5);
      
      toast.success(`${numQuestions} questions générées à partir de vos documents !`);
    } catch (error) {
      console.error("Erreur lors de la création du quiz:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue lors de la création du quiz";
      setError(message);
      addLog(`ERREUR: ${message}`);
      toast.error(`Impossible de créer le quiz: ${message}`);
      setIsSubmitting(false);
      setQuizCreated(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl rounded-2xl border border-white/[0.07] bg-[#111111]/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="rounded-xl border border-orange-300/25 bg-orange-500/15 p-3">
          <BrainCircuit className="h-6 w-6 text-[#ffb77d]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Créer votre Quiz</h2>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isSubmitting ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{progressStage}</h3>
              <span className="text-sm font-mono">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          <div className="h-[200px] overflow-y-auto rounded-xl border border-white/[0.07] bg-black/30 p-4 font-mono text-xs text-[#d8d2ce]">
            {progressLogs.length > 0 ? (
              progressLogs.map((log, index) => (
                <div key={index} className="py-1 border-b border-muted last:border-0">
                  {log}
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
          </div>
          
          {quizCreated && createdQuizId ? (
            <div className="space-y-4">
              <Alert variant="default" className="border-emerald-400/25 bg-emerald-500/10 text-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Quiz créé avec succès</AlertTitle>
                <AlertDescription className="text-emerald-100/80">
                  Redirection automatique vers votre quiz dans {redirectCounter} secondes...
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleRedirectNow}
                >
                  Voir le quiz maintenant
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsSubmitting(false);
                    setQuizCreated(false);
                    setFile(null);
                  }}
                >
                  Créer un autre quiz
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('createQuiz.uploadFile')}</Label>
            <FileUpload onFileSelect={handleFileSelect} />
            <p className="text-xs text-muted-foreground">
              Formats acceptés: PDF, DOCX, TXT (max 10MB)
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label>{t('createQuiz.aiModel')}</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  En cas d’échec, le serveur essaie automatiquement les autres API disponibles.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void refreshCapabilities(true)}
                disabled={isSubmitting}
                aria-label="Revérifier les API"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {capabilityError && (
              <Alert className="border-amber-400/30 bg-amber-500/10 text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{capabilityError}</AlertDescription>
              </Alert>
            )}
            <Card className="border-white/[0.07] bg-black/25 p-4">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AI_MODELS.map((model) => (
                    <Button
                      key={model.value}
                      type="button"
                      variant={modelType === model.value ? "default" : "outline"}
                      onClick={() => setModelType(model.value)}
                      disabled={capabilities ? !capabilities.providers[model.value].configured : false}
                      className={modelType === model.value 
                        ? 'min-h-12 quizo-copper-button flex flex-col justify-center items-center py-1' 
                        : 'min-h-12 quizo-outline-button flex flex-col justify-center items-center py-1'
                      }
                    >
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        {model.label}
                        {capabilities?.providers[model.value]?.configured
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                          : capabilities
                            ? <AlertCircle className="h-3.5 w-3.5 text-amber-300" />
                            : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      </span>
                      {model.badge && <span className="text-[10px] opacity-75">{model.badge}</span>}
                    </Button>
                  ))}
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                  <p className="text-xs text-muted-foreground font-medium">
                    {AI_MODELS.find((model) => model.value === modelType)?.description}
                  </p>
                  {modelType === 'groq' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Gratuit • Ultra-rapide • Illimité</span>
                    </div>
                  )}
                  {capabilities?.providers[modelType] && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Modèle serveur : {capabilities.providers[modelType].model}
                    </p>
                  )}
                </div>
                {capabilities && availableProviders.length === 0 && (
                  <p role="alert" className="text-sm text-red-300">Aucun fournisseur IA n’est configuré sur le serveur.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Label>{t('createQuiz.difficulty')}</Label>
            <div className="flex space-x-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={difficulty === level ? "default" : "outline"}
                  onClick={() => setDifficulty(level)}
                  className={difficulty === level ? "flex-1 quizo-copper-button" : "flex-1 quizo-outline-button"}
                >
                  {level === 'easy' ? t('createQuiz.easy') : level === 'medium' ? t('createQuiz.medium') : t('createQuiz.hard')}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="num-questions">{t('createQuiz.numberOfQuestions')}</Label>
              <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {numQuestions}
              </span>
            </div>
            <Slider
              id="num-questions"
              value={[numQuestions]}
              min={5}
              max={20}
              step={5}
              onValueChange={(value) => setNumQuestions(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enable-time-limit" 
                checked={enableTimeLimit}
                onCheckedChange={(checked) => setEnableTimeLimit(checked === true)}
              />
              <Label htmlFor="enable-time-limit">{t('createQuiz.enableTimeLimit')}</Label>
            </div>
            
            {enableTimeLimit && (
              <div className="flex items-center space-x-3 pl-6">
                <div className="grid gap-1.5 flex-1">
                  <Label htmlFor="time-limit">{t('createQuiz.durationMinutes')}</Label>
                  <Select 
                    value={timeLimit.toString()}
                    onValueChange={(value) => setTimeLimit(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('createQuiz.selectDuration')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 {t('createQuiz.hour')}</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 {t('createQuiz.hours')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{timeLimit} min</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additional-info">{t('createQuiz.additionalInfo')}</Label>
            <Textarea
              id="additional-info"
              placeholder={t('createQuiz.additionalInfoPlaceholder')}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[100px] resize-none quizo-input"
            />
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="w-full quizo-copper-button"
              disabled={isSubmitting || !file || !user || (capabilities !== null && availableProviders.length === 0)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('createQuiz.generating')}
                </>
              ) : (
                <>
                  {t('createQuiz.generate')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full quizo-outline-button"
              disabled={!user}
              onClick={() => navigate('/history')}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {t('nav.myQuizzes')}
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
};
