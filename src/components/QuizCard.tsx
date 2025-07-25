
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Users, Share2, ArrowUpRight, Users2, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShareQuizDialog } from './ShareQuizDialog';
import { DeleteQuizDialog } from './DeleteQuizDialog';

interface QuizCardProps {
  id: string;
  title: string;
  description: string;
  questions: number;
  completionRate?: number;
  date: string;
  duration: string;
  participants?: number;
  isHistory?: boolean;
  isShared?: boolean;
  index?: number;
}

export const QuizCard = ({ 
  id, 
  title, 
  description, 
  questions, 
  completionRate = 0,
  date,
  duration,
  participants = 0,
  isHistory = false,
  isShared = false,
  index = 0
}: QuizCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleContinue = () => {
    navigate(isHistory ? `/quiz-preview/${id}` : `/quiz/${id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareDialog(true);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };
  
  const handleRetake = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Naviguer directement vers la page du quiz pour le refaire
    navigate(`/quiz/${id}`);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className={cn(
          "overflow-hidden transition-all duration-300 h-full",
          isHovered ? "shadow-md" : "shadow-sm"
        )}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
                {questions} Questions
              </Badge>
              {isShared && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Users2 className="h-3.5 w-3.5 mr-1" />
                  Partagé
                </Badge>
              )}
              {isHistory && (
                <div className="flex space-x-1">
                  {!isShared && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" 
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {completionRate === 100 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" 
                      onClick={handleRetake}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <CardTitle className="text-xl mt-3 line-clamp-1">{title}</CardTitle>
          </CardHeader>
          
          <CardContent className="pb-4">
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {description}
            </p>
            
            <div className="space-y-4">
              {isHistory && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progrès</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {date}
                </div>
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {duration}
                </div>
                {participants > 0 && (
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {participants} {participants === 1 ? 'participant' : 'participants'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button 
              className={cn(
                "w-full hover-scale transition-all duration-300",
                isHovered ? "bg-primary" : "bg-primary/90"
              )}
              onClick={handleContinue}
            >
              {isHistory ? 'Voir détails' : 'Continuer'}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      
      <ShareQuizDialog 
        quizId={id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
      
      <DeleteQuizDialog
        quizId={id}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};
