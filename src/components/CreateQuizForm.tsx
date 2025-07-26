
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { initializeBucket } from '@/integrations/supabase/client';

// Remove this line with the hardcoded API key
// const DEFAULT_API_KEY = "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";

export const CreateQuizForm = () => {
  const navigate = useNavigate();
  const { createQuiz, isLoading } = useQuiz();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedAI, setSelectedAI] = useState<'chatgpt' | 'local'>('chatgpt');
  const [apiKey, setApiKey] = useState(''); // Initialize with empty string instead of DEFAULT_API_KEY
  const [isInitializing, setIsInitializing] = useState(false);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(15); // Default time limit in minutes
  const [enableTimeLimit, setEnableTimeLimit] = useState(false);
  
  // Initialize bucket when component loads
  useEffect(() => {
    if (!bucketInitialized && initializationAttempts < 3) {
      ensureBucketExists();
    }
  }, [bucketInitialized, initializationAttempts]);
  
  const ensureBucketExists = async () => {
    if (bucketInitialized) return true;
    if (isInitializing) return false;
    
    setIsInitializing(true);
    try {
      console.log("Attempting bucket initialization...");
      const success = await initializeBucket();
      setBucketInitialized(success);
      
      if (!success) {
        // Only show toast after multiple failures
        if (initializationAttempts >= 2) {
          toast.error("Erreur lors de la configuration du stockage. Réessayez plus tard.");
        }
        
        setInitializationAttempts(prev => prev + 1);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing bucket:", error);
      setInitializationAttempts(prev => prev + 1);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };
  
  const handleFileSelect = (file: File) => {
    setFile(file);
    toast.success(`Fichier sélectionné: ${file.name}`);
    // Ensure bucket is ready when file is selected
    ensureBucketExists();
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
    
    // Final check to ensure bucket exists
    const bucketReady = await ensureBucketExists();
    if (!bucketReady) {
      toast.error("Impossible de configurer le stockage. Veuillez réessayer.");
      return;
    }
    
    try {
      console.log('Starting quiz creation process');
      const apiKeyToUse = selectedAI === 'chatgpt' ? apiKey : undefined;
      const actualTimeLimit = enableTimeLimit ? timeLimit : undefined;
      const modelType = selectedAI === 'chatgpt' ? 'chatgpt' : 'gemini';
      
      // Définir une fonction de callback pour suivre la progression
      const progressCallback = (stage: string, percent: number, message?: string) => {
        console.log(`[CreateQuizForm] Progress: ${stage} - ${percent}% - ${message || ''}`);
      };
      
      const quizId = await createQuiz(
        file, 
        numQuestions,
        difficulty,
        actualTimeLimit,
        additionalInfo,
        apiKeyToUse,
        modelType,
        progressCallback
      );
      
      toast.success(`${numQuestions} questions générées à partir de vos documents!`);
      navigate(`/quiz-preview/${quizId}`);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast.error(`Impossible de créer le quiz: ${error.message || "Erreur inconnue"}`);
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
          <Label>Modèle d'IA pour la génération</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">  {/* Ajout de grid-cols-1 pour mobile */}
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md border ${
                selectedAI === 'local' ? 'border-[#D2691E]' : 'border-input'
              }`}
              onClick={() => setSelectedAI('local')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Gemini</h3>
                  <p className="text-xs text-muted-foreground">Recommandé, fonctionne hors ligne</p>
                </div>
                <div className={`w-4 h-4 rounded-full ${selectedAI === 'local' ? 'bg-[#D2691E]' : 'bg-muted'}`}></div>
              </div>
            </Card>
            
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md border ${
                selectedAI === 'chatgpt' ? 'border-[#D2691E]' : 'border-input'
              }`}
              onClick={() => setSelectedAI('chatgpt')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">ChatGPT</h3>
                  <p className="text-xs text-muted-foreground">Qualité supérieure, requiert une API key</p>
                </div>
                <div className={`w-4 h-4 rounded-full ${selectedAI === 'chatgpt' ? 'bg-[#D2691E]' : 'bg-muted'}`}></div>
              </div>
            </Card>
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
            max={50}
            step={5}
            onValueChange={handleNumQuestionsChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5</span>
            <span>25</span>
            <span>50</span>
          </div>
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
        
        {selectedAI === 'chatgpt' && (
          <div className="space-y-2">
            <Label htmlFor="api-key">ChatGPT API Key (Requis)</Label>
            <Input 
              id="api-key" 
              type="password" 
              placeholder="sk-..." 
              className="font-mono"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Votre clé API est stockée uniquement sur votre appareil et n'est jamais partagée.
            </p>
          </div>
        )}
        
        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            className="w-full btn-shine bg-[#D2691E] hover:bg-[#D2691E]/90"
            disabled={isLoading || isInitializing || !file || !user || (selectedAI === 'chatgpt' && !apiKey)}
          >
            {isLoading || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading ? "Génération en cours..." : "Initialisation..."}
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
