import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, Plus, Save, Trash2, Share2, Play, Clock, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getManualQuiz, updateManualQuiz, addQuestionToManualQuiz, updateQuestionInManualQuiz, deleteQuestionFromManualQuiz, createCompetition, generateAndAssignShareCode } from '@/services/manualQuizService';
import { ManualQuiz, ManualQuestion } from '@/types/quiz';
import { Badge } from '@/components/ui/badge';

const ManualQuizBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // États pour l'ajout/modification de question
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([
    { id: `opt_${Date.now()}_1`, text: '', isCorrect: true },
    { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
    { id: `opt_${Date.now()}_3`, text: '', isCorrect: false },
    { id: `opt_${Date.now()}_4`, text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // États pour les paramètres du quiz
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);
  const [quizMode, setQuizMode] = useState<'realtime' | 'async'>('async');
  const [quizStatus, setQuizStatus] = useState<'draft' | 'active' | 'completed'>('draft');
  
  // États pour la création de compétition
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [competitionDescription, setCompetitionDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  useEffect(() => {
    const fetchQuiz = async () => {
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
        
        if (quizData.creatorId !== user?.id) {
          toast.error('Vous n\'avez pas accès à ce quiz');
          navigate('/history');
          return;
        }
        
        setQuiz(quizData);
        setTimeLimit(quizData.timeLimit);
        setIsPublic(quizData.isPublic || false);
        setQuizMode(quizData.mode || 'async');
        setQuizStatus(quizData.status || 'draft');
      } catch (error: any) {
        console.error('Erreur lors de la récupération du quiz:', error);
        toast.error(error.message || 'Erreur lors de la récupération du quiz');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id, user, navigate]);
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  const handleAddOption = () => {
    setOptions([...options, { id: `opt_${Date.now()}`, text: '', isCorrect: false }]);
  };
  
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Un minimum de 2 options est requis');
      return;
    }
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    
    // Si l'option correcte est supprimée, définir la première option comme correcte
    if (options[index].isCorrect && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }
    
    setOptions(newOptions);
  };
  
  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };
  
  const handleCorrectOptionChange = (index: number) => {
    const newOptions = [...options].map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    setOptions(newOptions);
  };
  
  const resetQuestionForm = () => {
    setQuestionText('');
    setOptions([
      { id: `opt_${Date.now()}_1`, text: '', isCorrect: true },
      { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
      { id: `opt_${Date.now()}_3`, text: '', isCorrect: false },
      { id: `opt_${Date.now()}_4`, text: '', isCorrect: false },
    ]);
    setExplanation('');
    setPoints(1);
    setEditingQuestionId(null);
  };
  
  const handleSaveQuestion = async () => {
    if (!id || !quiz) return;
    
    if (!questionText.trim()) {
      toast.error('Veuillez saisir le texte de la question');
      return;
    }
    
    const filledOptions = options.filter(opt => opt.text.trim() !== '');
    
    if (filledOptions.length < 2) {
      toast.error('Veuillez saisir au moins 2 options');
      return;
    }
    
    const correctOptions = options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length !== 1) {
      toast.error('Veuillez sélectionner une option correcte');
      return;
    }
    
    try {
      if (editingQuestionId) {
        const question: ManualQuestion = {
          id: editingQuestionId,
          text: questionText,
          options: filledOptions,
          explanation: explanation || undefined,
          points: points || 1
        };
        await updateQuestionInManualQuiz(id, editingQuestionId, question);
        toast.success('Question mise à jour avec succès');
      } else {
        const question: Omit<ManualQuestion, 'id'> = {
          text: questionText,
          options: filledOptions,
          explanation: explanation || undefined,
          points: points || 1
        };
        await addQuestionToManualQuiz(id, question as ManualQuestion);
        toast.success('Question ajoutée avec succès');
      }
      
      // Rafraîchir le quiz
      const updatedQuiz = await getManualQuiz(id);
      setQuiz(updatedQuiz);
      
      // Réinitialiser le formulaire
      resetQuestionForm();
      setShowAddQuestion(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de la question:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement de la question');
    }
};
  
  const handleEditQuestion = (question: ManualQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.text);
    setOptions(question.options.length > 0 ? question.options : [
      { id: `opt_${Date.now()}_1`, text: '', isCorrect: true },
      { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
    ]);
    setExplanation(question.explanation || '');
    setPoints(question.points || 1);
    setShowAddQuestion(true);
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!id || !quiz) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return;
    }
    
    try {
      await deleteQuestionFromManualQuiz(id, questionId);
      toast.success('Question supprimée avec succès');
      
      // Rafraîchir le quiz
      const updatedQuiz = await getManualQuiz(id);
      setQuiz(updatedQuiz);
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la question:', error);
      toast.error(error.message || 'Erreur lors de la suppression de la question');
    }
  };
  
  const handleGenerateShareCode = async () => {
    if (!id) return;
    
    try {
      const newShareCode = await generateAndAssignShareCode(id);
      toast.success(`Code de partage généré : ${newShareCode}`);
      
      // Rafraîchir le quiz
      const updatedQuiz = await getManualQuiz(id);
      setQuiz(updatedQuiz);
    } catch (error: any) {
      console.error('Erreur lors de la génération du code:', error);
      toast.error(error.message || 'Erreur lors de la génération du code');
    }
  };
  
  const handleViewDashboard = () => {
    if (!id) return;
    navigate(`/quiz-dashboard/${id}`);
  };
  
  const handleSaveSettings = async () => {
    if (!id) return;
    
    try {
      await updateManualQuiz(id, {
        timeLimit,
        isPublic,
        mode: quizMode,
        status: quizStatus
      });
      
      toast.success('Paramètres enregistrés avec succès');
      setShowSettingsDialog(false);
      
      // Rafraîchir le quiz
      const updatedQuiz = await getManualQuiz(id);
      setQuiz(updatedQuiz);
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement des paramètres');
    }
  };
  
  const handleCreateCompetition = async () => {
    if (!id || !quiz) return;
    
    if (!competitionTitle.trim()) {
      toast.error('Veuillez saisir un titre pour la compétition');
      return;
    }
    
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }
    
    try {
      const competitionId = await createCompetition(
        id,
        user.id,
        competitionTitle,
        competitionDescription,
        start,
        end
      );
      
      toast.success('Compétition créée avec succès');
      setShowShareDialog(false);
      
      // Rediriger vers le tableau de bord de la compétition
      navigate(`/creator-dashboard/${competitionId}`);
    } catch (error: any) {
      console.error('Erreur lors de la création de la compétition:', error);
      toast.error(error.message || 'Erreur lors de la création de la compétition');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">{quiz?.title || 'Quiz sans titre'}</h1>
              <p className="text-muted-foreground">{quiz?.description || 'Aucune description'}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {quiz?.shareCode && (
                <Badge variant="outline" className="px-3 py-1 text-lg font-mono">
                  {quiz.shareCode}
                </Badge>
              )}
              
              <Button variant="outline" size="sm" onClick={handleGenerateShareCode}>
                <Share2 className="h-4 w-4 mr-2" />
                {quiz?.shareCode ? 'Nouveau Code' : 'Générer Code'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleViewDashboard}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Compétition
              </Button>
              
              <Button size="sm" onClick={() => navigate(`/quiz-preview/${id}`)}>
                <Play className="h-4 w-4 mr-2" />
                Tester
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="space-y-6">
              {showAddQuestion ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingQuestionId ? 'Modifier la question' : 'Ajouter une question'}</CardTitle>
                    <CardDescription>
                      Créez une question à choix multiples avec une seule réponse correcte.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-text">Question</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Saisissez votre question ici..."
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                          <Plus className="h-4 w-4 mr-1" /> Ajouter une option
                        </Button>
                      </div>
                      
                      <RadioGroup value={options.findIndex(opt => opt.isCorrect).toString()}>
                        {options.map((option, index) => (
                          <div key={option.id} className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem
                              value={index.toString()}
                              id={`option-${index}`}
                              checked={option.isCorrect}
                              onClick={() => handleCorrectOptionChange(index)}
                            />
                            <div className="flex-1">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="explanation">Explication (Optionnel)</Label>
                      <Textarea
                        id="explanation"
                        placeholder="Expliquez pourquoi la réponse est correcte..."
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="points">Points</Label>
                      <Select
                        value={points.toString()}
                        onValueChange={(value) => setPoints(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez les points" />
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
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => {
                      resetQuestionForm();
                      setShowAddQuestion(false);
                    }}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveQuestion}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingQuestionId ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {quiz?.questions?.length || 0} question{(quiz?.questions?.length || 0) !== 1 ? 's' : ''}
                  </h2>
                  <Button onClick={() => setShowAddQuestion(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une question
                  </Button>
                </div>
              )}
              
              {!showAddQuestion && quiz?.questions?.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <PenLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucune question</h3>
                  <p className="text-muted-foreground mb-6">
                    Commencez par ajouter des questions à votre quiz.
                  </p>
                  <Button onClick={() => setShowAddQuestion(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une question
                  </Button>
                </div>
              )}
              
              {!showAddQuestion && quiz?.questions?.map((question, index) => (
                <Card key={question.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Question {index + 1} <span className="text-sm font-normal text-muted-foreground">({question.points} point{question.points > 1 ? 's' : ''})</span>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question)}>
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{question.text}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div 
                          key={option.id} 
                          className={`p-3 rounded-md ${option.isCorrect ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted/50'}`}
                        >
                          {option.text}
                          {option.isCorrect && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 ml-2">
                              (Correcte)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Explication:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">{question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu du Quiz</CardTitle>
                  <CardDescription>
                    Voici à quoi ressemblera votre quiz pour les participants.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">{quiz?.title}</h2>
                      <p className="text-muted-foreground">{quiz?.description}</p>
                    </div>
                    
                    {quiz?.timeLimit && (
                      <div className="flex items-center text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Limite de temps: {quiz.timeLimit} minutes</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">{quiz?.questions?.length || 0} question{(quiz?.questions?.length || 0) !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-muted-foreground">
                        Total des points: {quiz?.questions?.reduce((total, q) => total + (q.points || 1), 0) || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('questions')}>
                    Retour aux questions
                  </Button>
                  <Button onClick={() => navigate(`/quiz-preview/${id}`)}>
                    <Play className="h-4 w-4 mr-2" />
                    Tester le quiz
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Dialogue des paramètres */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paramètres du Quiz</DialogTitle>
            <DialogDescription>
              Configurez les options de votre quiz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-quiz">Quiz public</Label>
                <p className="text-sm text-muted-foreground">
                  Rendre ce quiz visible pour tous les utilisateurs
                </p>
              </div>
              <Switch
                id="public-quiz"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-limit">Limite de temps (minutes)</Label>
              <Select
                value={timeLimit?.toString() || ''}
                onValueChange={(value) => setTimeLimit(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune limite</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quiz-mode">Mode de passage</Label>
              <Select
                value={quizMode}
                onValueChange={(value: 'realtime' | 'async') => setQuizMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="async">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Asynchrone</span>
                      <span className="text-xs text-muted-foreground">Les participants passent le quiz quand ils veulent</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="realtime">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Temps Réel</span>
                      <span className="text-xs text-muted-foreground">Suivi en direct avec dashboard des participants</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quiz-status">Statut du quiz</Label>
              <Select
                value={quizStatus}
                onValueChange={(value: 'draft' | 'active' | 'completed') => setQuizStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon - Non accessible aux participants</SelectItem>
                  <SelectItem value="active">Actif - Les participants peuvent le passer</SelectItem>
                  <SelectItem value="completed">Terminé - Plus de nouvelles participations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSettings}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de partage */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le Quiz</DialogTitle>
            <DialogDescription>
              Créez une compétition pour partager votre quiz avec d'autres personnes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="competition-title">Titre de la compétition</Label>
              <Input
                id="competition-title"
                placeholder="Entrez le titre de la compétition"
                value={competitionTitle}
                onChange={(e) => setCompetitionTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="competition-description">Description (Optionnel)</Label>
              <Textarea
                id="competition-description"
                placeholder="Décrivez la compétition..."
                value={competitionDescription}
                onChange={(e) => setCompetitionDescription(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Date de début</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">Date de fin</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCompetition}>
              Créer la compétition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualQuizBuilder;