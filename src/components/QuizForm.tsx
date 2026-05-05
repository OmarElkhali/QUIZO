
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { FileUpload } from './FileUpload';
import { toast } from 'sonner';
import { BrainCircuit, Share2, ArrowRight, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
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

const AI_MODELS: Array<{ value: AIModelType; label: string; description: string }> = [
  { value: 'gemini', label: 'Gemini', description: 'Google Gemini via le backend Flask.' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Routeur multi-modeles configure côté backend.' },
  { value: 'qwen', label: 'Qwen', description: 'Qwen direct ou via OpenRouter.' },
  { value: 'groq', label: 'Groq', description: 'Groq si une clé API est fournie.' },
  { value: 'ollama', label: 'Ollama', description: 'Modele local si Ollama tourne sur cette machine.' },
];

export const QuizForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createQuiz, isLoading } = useQuiz();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [enableTimeLimit, setEnableTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [modelType, setModelType] = useState<AIModelType>('gemini');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCreated, setQuizCreated] = useState(false);
  const [redirectCounter, setRedirectCounter] = useState(5);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizCreated && createdQuizId && redirectCounter > 0) {
      console.log(`Redirection dans ${redirectCounter} secondes vers /quiz/${createdQuizId}`);
      timer = setTimeout(() => {
        setRedirectCounter(prev => prev - 1);
      }, 1000);
    } else if (quizCreated && createdQuizId && redirectCounter === 0) {
      console.log(`Redirection immÃ©diate vers /quiz/${createdQuizId}`);
      navigate(`/quiz-preview/${createdQuizId}`);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [quizCreated, redirectCounter, createdQuizId, navigate]);
  
  const handleFileSelect = (file: File) => {
    setFile(file);
    setError(null);
    toast.success('Fichier tÃ©lÃ©chargÃ© avec succÃ¨s');
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
      toast.error('Veuillez vous connecter pour crÃ©er un quiz');
      return;
    }
    
    if (!file) {
      toast.error('Veuillez tÃ©lÃ©charger un fichier de cours');
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
      addLog(`DÃ©marrage de la crÃ©ation d'un quiz avec ${numQuestions} questions, difficultÃ©: ${difficulty}, modÃ¨le: ${modelType}`);
      setProgressStage('TÃ©lÃ©chargement du fichier');
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
        statusCallback
      );
      
      addLog('GÃ©nÃ©ration terminÃ©e avec succÃ¨s!');
      addLog(`Quiz crÃ©Ã© avec l'ID: ${quizId}`);
      setProgressStage('TerminÃ©');
      setProgressPercent(100);
      
      setQuizCreated(true);
      setCreatedQuizId(quizId);
      setRedirectCounter(5);
      
      toast.success(`${numQuestions} questions generees a partir de vos documents!`);
    } catch (error) {
      console.error("Erreur lors de la creation du quiz:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue lors de la creation du quiz";
      setError(message);
      addLog(`ERREUR: ${message}`);
      toast.error(`Impossible de creer le quiz: ${message}`);
      setIsSubmitting(false);
      setQuizCreated(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 md:p-8 max-w-xl mx-auto"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-2 rounded-full bg-primary/10">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">CrÃ©er votre Quiz</h2>
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
          
          <div className="border rounded-md p-4 bg-muted/30 h-[200px] overflow-y-auto font-mono text-xs">
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
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Quiz crÃ©Ã© avec succÃ¨s</AlertTitle>
                <AlertDescription className="text-green-700">
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
                  CrÃ©er un autre quiz
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
              Formats acceptÃ©s: PDF, DOCX, TXT (max 10MB)
            </p>
          </div>
          
          <div className="space-y-4">
            <Label>{t('createQuiz.aiModel')}</Label>
            <Card className="border border-muted p-4">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AI_MODELS.map((model) => (
                    <Button
                      key={model.value}
                      type="button"
                      variant={modelType === model.value ? "default" : "outline"}
                      onClick={() => setModelType(model.value)}
                      className="min-h-10"
                    >
                      {model.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {AI_MODELS.find((model) => model.value === modelType)?.description}
                </p>
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
                  className={difficulty === level ? "flex-1" : "flex-1"}
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
              <Label htmlFor="enable-time-limit">Activer une limite de temps</Label>
            </div>
            
            {enableTimeLimit && (
              <div className="flex items-center space-x-3 pl-6">
                <div className="grid gap-1.5 flex-1">
                  <Label htmlFor="time-limit">DurÃ©e (minutes)</Label>
                  <Select 
                    value={timeLimit.toString()}
                    onValueChange={(value) => setTimeLimit(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="SÃ©lectionner une durÃ©e" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
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
            <Label htmlFor="additional-info">Informations supplÃ©mentaires (Optionnel)</Label>
            <Textarea
              id="additional-info"
              placeholder="Ajoutez des sujets spÃ©cifiques Ã  aborder, des styles de questions prÃ©fÃ©rÃ©s, ou d'autres dÃ©tails..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="w-full btn-shine"
              disabled={isSubmitting || !file || !user}
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
              className="w-full hover-scale"
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
