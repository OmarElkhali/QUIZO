
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
  const [modelType, setModelType] = useState<'chatgpt' | 'gemini' | 'groq'>('groq'); // Groq par défaut (ultra-rapide et gratuit)
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
      addLog(`Démarrage de la création d'un quiz avec ${numQuestions} questions, difficulté: ${difficulty}, modèle: ${modelType}`);
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
        undefined, 
        modelType,
        statusCallback
      );
      
      addLog('Génération terminée avec succès!');
      addLog(`Quiz créé avec l'ID: ${quizId}`);
      setProgressStage('Terminé');
      setProgressPercent(100);
      
      setQuizCreated(true);
      setCreatedQuizId(quizId);
      setRedirectCounter(5);
      
      toast.success(`${numQuestions} questions générées à partir de vos documents!`);
    } catch (error: any) {
      console.error("Erreur lors de la création du quiz:", error);
      setError(error.message || "Erreur inconnue lors de la création du quiz");
      addLog(`ERREUR: ${error.message || "Erreur inconnue"}`);
      toast.error(`Impossible de créer le quiz: ${error.message || "Erreur inconnue"}`);
      setIsSubmitting(true);
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
        <h2 className="text-2xl font-bold">Créer votre Quiz</h2>
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
                <AlertTitle className="text-green-800">Quiz créé avec succès</AlertTitle>
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
            <Label>{t('createQuiz.aiModel')}</Label>
            <Card className="border border-muted p-4">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={modelType === 'groq' ? "default" : "outline"}
                    onClick={() => setModelType('groq')}
                    className="flex flex-col items-center py-3 h-auto"
                  >
                    <span className="text-sm font-bold">Groq</span>
                    <span className="text-xs opacity-70">⚡ Ultra-rapide</span>
                  </Button>
                  <Button
                    type="button"
                    variant={modelType === 'gemini' ? "default" : "outline"}
                    onClick={() => setModelType('gemini')}
                    className="flex flex-col items-center py-3 h-auto"
                  >
                    <span className="text-sm font-bold">Gemini</span>
                    <span className="text-xs opacity-70">🔥 Puissant</span>
                  </Button>
                  <Button
                    type="button"
                    variant={modelType === 'chatgpt' ? "default" : "outline"}
                    onClick={() => setModelType('chatgpt')}
                    className="flex flex-col items-center py-3 h-auto"
                  >
                    <span className="text-sm font-bold">ChatGPT</span>
                    <span className="text-xs opacity-70">🎯 Précis</span>
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                  <p className="text-xs text-muted-foreground">
                    {modelType === 'groq' 
                      ? "⚡ Groq - Ultra-rapide (3-5s), gratuit et illimité. Recommandé!"
                      : modelType === 'chatgpt' 
                      ? "🎯 ChatGPT - Optimisé pour générer des quiz en français"
                      : "🔥 Google Gemini - Modèle puissant pour la génération de quiz éducatifs"}
                  </p>
                  {modelType === 'groq' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Gratuit • Rapide • Illimité</span>
                    </div>
                  )}
                </div>
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
              max={50}
              step={5}
              onValueChange={(value) => setNumQuestions(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>25</span>
              <span>50</span>
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
                  <Label htmlFor="time-limit">Durée (minutes)</Label>
                  <Select 
                    value={timeLimit.toString()}
                    onValueChange={(value) => setTimeLimit(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une durée" />
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
            <Label htmlFor="additional-info">Informations supplémentaires (Optionnel)</Label>
            <Textarea
              id="additional-info"
              placeholder="Ajoutez des sujets spécifiques à aborder, des styles de questions préférés, ou d'autres détails..."
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
