
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './AuthDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileText, Share2, History, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-6 hover-scale"
  >
    <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.div>
);

export const Hero = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const handleGetStarted = () => {
    if (user) {
      navigate('/create-quiz');
    } else {
      setShowAuthDialog(true);
    }
  };
  
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Content */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-block bg-primary/10 text-primary font-medium rounded-full px-4 py-1 text-sm mb-4 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                {t('home.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">QUIZO</span> - {t('home.heroTitle').replace('QUIZO - ', '')}
              </h1>
              <p className="text-xl text-muted-foreground mt-6">
                {t('home.heroDescription')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleGetStarted} 
                size="lg"
                className="btn-shine bg-primary hover:bg-primary/90"
              >
                {t('home.getStarted')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="hover-scale border-primary/20 text-primary hover:text-primary/80"
              >
                {t('home.learnMore')}
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 relative aspect-square max-w-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-full blur-3xl opacity-20 animate-pulse-soft" />
            <div className="relative glass-card overflow-hidden aspect-square rounded-3xl border border-primary/20 shadow-xl flex items-center justify-center">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="flex flex-col items-center justify-center p-6 z-10">
                <BookOpen className="h-20 w-20 text-primary mb-4" />
                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">QUIZO</h2>
                <p className="text-muted-foreground text-center mt-2">{t('home.assistantTagline')}</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Features */}
        <div className="mt-32 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('home.featuresTitle')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.featuresDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-primary" />}
              title={t('home.feature1Title')}
              description={t('home.feature1Description')}
              delay={0.1}
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6 text-primary" />}
              title={t('home.feature2Title')}
              description={t('home.feature2Description')}
              delay={0.2}
            />
            <FeatureCard
              icon={<History className="h-6 w-6 text-primary" />}
              title={t('home.feature3Title')}
              description={t('home.feature3Description')}
              delay={0.3}
            />
          </div>
        </div>
      </div>
      
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </section>
  );
};
