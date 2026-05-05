
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { FileUpload } from '@/components/FileUpload';
import { BrainCircuit, Share2, ArrowRight, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AIModelType } from '@/types/quiz';

const AI_MODELS: Array<{ value: AIModelType; label: string; description: string }> = [
  { value: 'gemini', label: 'Gemini', description: 'Fournisseur principal pour la production.' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Routeur multi-modeles configure cote backend.' },
  { value: 'groq', label: 'Groq', description: 'Generation rapide si la cle serveur est configuree.' },
  { value: 'qwen', label: 'Qwen', description: 'Qwen direct ou via OpenRouter.' },
  { value: 'ollama', label: 'Ollama', description: 'Modele local si Ollama tourne sur cette machine.' },
];

export const CreateQuizForm = () => {
  const navigate = useNavigate();
  const { createQuiz, isLoading } = useQuiz();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedAI, setSelectedAI] = useState<AIModelType>('gemini');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(15); // Default time limit in minutes
  const [enableTimeLimit, setEnableTimeLimit] = useState(false);
  
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
      toast.error("Veuillez vous connecter pour crÃ©er un quiz");
      return;
    }
    
    if (!file) {
      toast.error("Veuillez sÃ©lectionner un fichier");
      return;
    }

    try {
      console.log('Starting quiz creation process');
      const actualTimeLimit = enableTimeLimit ? timeLimit : undefined;
      
      // DÃ©finir une fonction de callback pour suivre la progression
      const progressCallback = (stage: string, percent: number, message?: string) => {
        console.log(`[CreateQuizForm] Progress: ${stage} - ${percent}% - ${message || ''}`);
      };
      
      const quizId = await createQuiz(
        file, 
        numQuestions,
        difficulty,
        actualTimeLimit,
        additionalInfo,
        selectedAI,
        progressCallback
      );
      
      toast.success(`${numQuestions} questions generees a partir de vos documents!`);
      navigate(`/quiz-preview/${quizId}`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Impossible de creer le quiz: ${message}`);
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
        <h2 className="text-2xl font-bold">ParamÃ¨tres du Quiz</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload">TÃ©lÃ©charger votre document</Label>
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
        
        <div className="space-y-4">
          <Label>Niveau de difficultÃ©</Label>
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
          <Label>ModÃ¨le d'IA pour la gÃ©nÃ©ration</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AI_MODELS.map((model) => (
              <Card
                key={model.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border ${
                  selectedAI === model.value ? 'border-[#D2691E]' : 'border-input'
                }`}
                onClick={() => setSelectedAI(model.value)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{model.label}</h3>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                  <div className={`h-4 w-4 shrink-0 rounded-full ${selectedAI === model.value ? 'bg-[#D2691E]' : 'bg-muted'}`} />
                </div>
              </Card>
            ))}
          </div>
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
            className="w-full btn-shine bg-[#D2691E] hover:bg-[#D2691E]/90"
            disabled={isLoading || !file || !user}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generation en cours...
              </>
            ) : (
              <>
                CrÃ©er le Quiz
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
