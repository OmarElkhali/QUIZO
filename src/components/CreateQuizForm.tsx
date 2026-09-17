
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { FileUpload } from '@/components/FileUpload';
import { BrainCircuit, Share2, ArrowRight, Loader2, Clock, CircleCheck, CircleAlert, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AIModelType } from '@/types/quiz';
import { getBackendCapabilities, type BackendCapabilities } from '@/services/backendCapabilities';

const AI_MODELS: Array<{ value: AIModelType; label: string; description: string }> = [
  { value: 'openrouter', label: 'OpenRouter', description: 'Qwen via le routeur multi-modèles.' },
  { value: 'gemini', label: 'Gemini', description: 'Bon équilibre qualité et compréhension.' },
  { value: 'groq', label: 'Groq', description: 'Llama, optimisé pour la vitesse.' },
];

export const CreateQuizForm = () => {
  const navigate = useNavigate();
  const { createQuiz, isLoading } = useQuiz();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedAI, setSelectedAI] = useState<AIModelType>('openrouter');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(15); // Default time limit in minutes
  const [enableTimeLimit, setEnableTimeLimit] = useState(false);
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState('');
  const [progress, setProgress] = useState({ stage: '', percent: 0, message: '' });
  const availableProviders = AI_MODELS.filter(model => capabilities?.providers[model.value]?.configured);

  const refreshCapabilities = useCallback(async (force = false) => {
    setCapabilityError('');
    try {
      const next = await getBackendCapabilities(force);
      setCapabilities(next);
      setSelectedAI(current => next.providers[current]?.configured
        ? current
        : AI_MODELS.find(model => next.providers[model.value]?.configured)?.value || current);
    } catch (error) {
      setCapabilityError(error instanceof Error ? error.message : 'Vérification des API impossible.');
    }
  }, []);

  useEffect(() => { void refreshCapabilities(); }, [refreshCapabilities]);
  
  const handleFileSelect = (file: File) => {
    setFile(file);
    toast.success(`Fichier selectionne: ${file.name}`);
  };

  const handleNumQuestionsChange = (value: number[]) => {
    setNumQuestions(value[0]);
  };
  
  const handleTimeLimitChange = (value: number[]) => {
    setTimeLimit(value[0]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Veuillez vous connecter pour créer un quiz");
      return;
    }
    
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      console.log('Starting quiz creation process');
      const actualTimeLimit = enableTimeLimit ? timeLimit : undefined;
      
      // Définir une fonction de callback pour suivre la progression
      const progressCallback = (stage: string, percent: number, message?: string) => setProgress({ stage, percent, message: message || '' });
      
      const quizId = await createQuiz(
        file, 
        numQuestions,
        difficulty,
        actualTimeLimit,
        additionalInfo,
        selectedAI,
        undefined,
        progressCallback
      );
      
      toast.success(`${numQuestions} questions générées à partir de vos documents !`);
      navigate(`/quiz-preview/${quizId}`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Impossible de créer le quiz: ${message}`);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 md:p-8 border border-[#D2691E]/20 max-w-xl mx-auto"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-2 rounded-full bg-[#D2691E]/10">
          <BrainCircuit className="h-6 w-6 text-[#D2691E]" />
        </div>
        <h2 className="text-2xl font-bold">Paramètres du Quiz</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Télécharger votre document</Label>
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
        
        <div className="space-y-4">
          <Label>Niveau de difficulté</Label>
          <ToggleGroup 
            type="single" 
            value={difficulty}
            onValueChange={(value) => value && setDifficulty(value as 'easy' | 'medium' | 'hard')}
            className="flex justify-between w-full"
          >
            <ToggleGroupItem 
              value="easy" 
              className={`w-1/3 ${difficulty === 'easy' ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
            >
              Facile
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="medium" 
              className={`w-1/3 ${difficulty === 'medium' ? 'bg-[#D2691E] text-white hover:bg-[#D2691E]/90' : ''}`}
            >
              Moyen
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="hard" 
              className={`w-1/3 ${difficulty === 'hard' ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
            >
              Difficile
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Limite de temps</Label>
            <input 
              type="checkbox" 
              id="enable-time-limit"
              checked={enableTimeLimit}
              onChange={(e) => setEnableTimeLimit(e.target.checked)}
              className="ml-2 h-4 w-4"
            />
            <Label htmlFor="enable-time-limit" className="ml-1 text-sm">Activer</Label>
          </div>
          
          {enableTimeLimit && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-[#D2691E]" />
                  <span>Temps limite</span>
                </div>
                <span className="text-sm font-medium bg-[#D2691E]/10 text-[#D2691E] px-2 py-0.5 rounded-full">
                  {timeLimit} minutes
                </span>
              </div>
              <Slider
                value={[timeLimit]}
                min={5}
                max={60}
                step={5}
                onValueChange={handleTimeLimitChange}
                className="py-4"
                disabled={!enableTimeLimit}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><Label>API de génération</Label><p className="mt-1 text-xs text-muted-foreground">Si l’API choisie échoue, le serveur essaie automatiquement les autres services disponibles.</p></div>
            <Button type="button" size="sm" variant="ghost" onClick={() => void refreshCapabilities(true)} disabled={isLoading} aria-label="Revérifier les API"><RefreshCw className="h-4 w-4" /></Button>
          </div>
          {capabilityError && <p role="alert" className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200"><CircleAlert className="h-4 w-4 shrink-0" />{capabilityError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AI_MODELS.map((model) => (
              <button
                type="button"
                key={model.value}
                className={`rounded-xl border p-4 text-left transition-all ${selectedAI === model.value ? 'border-orange-400 bg-orange-500/10 shadow-[0_0_24px_rgba(217,119,6,.12)]' : 'border-input hover:border-orange-300/35'} disabled:cursor-not-allowed disabled:opacity-45`}
                onClick={() => setSelectedAI(model.value)}
                disabled={capabilities ? !capabilities.providers[model.value].configured : false}
                aria-pressed={selectedAI === model.value}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{model.label}</h3>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                    {capabilities?.providers[model.value] && <p className="mt-2 truncate text-[11px] text-muted-foreground">{capabilities.providers[model.value].model}</p>}
                  </div>
                  {capabilities?.providers[model.value]?.configured ? <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" /> : capabilities ? <CircleAlert className="h-4 w-4 shrink-0 text-amber-400" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                </div>
              </button>
            ))}
          </div>
          {capabilities && availableProviders.length === 0 && <p role="alert" className="text-sm text-red-300">Aucun fournisseur IA n’est configuré sur le serveur.</p>}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="num-questions">Nombre de questions</Label>
            <span className="text-sm font-medium bg-[#D2691E]/10 text-[#D2691E] px-2 py-0.5 rounded-full">
              {numQuestions}
            </span>
          </div>
          <Slider
            id="num-questions"
            value={[numQuestions]}
            min={5}
                max={20}
            step={5}
            onValueChange={handleNumQuestionsChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
                <span>10</span>
                <span>20</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="additional-info">Informations supplémentaires (optionnel)</Label>
          <Textarea
            id="additional-info"
            placeholder="Ajoutez des sujets spécifiques à aborder, des styles de questions préférés ou d’autres détails..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>
        
        {isLoading && progress.stage && <div role="status" aria-live="polite" className="space-y-2 rounded-xl border border-orange-400/20 bg-orange-500/10 p-4"><div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold">{progress.stage}</span><span>{Math.min(100, progress.percent)} %</span></div><div className="h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full bg-orange-400 transition-[width] duration-300" style={{ width: `${Math.min(100, progress.percent)}%` }} /></div><p className="text-xs text-muted-foreground">{progress.message}</p></div>}

        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            className="w-full btn-shine bg-[#D2691E] hover:bg-[#D2691E]/90"
            disabled={isLoading || !file || !user || (capabilities !== null && availableProviders.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                Créer le Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full hover-scale border-[#D2691E]/20 text-[#D2691E] hover:text-[#D2691E]/80"
            disabled={!user}
            onClick={() => navigate('/history')}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Mes Quiz
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
