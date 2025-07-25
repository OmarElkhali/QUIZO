
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AuthDialog } from './AuthDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, User, History, LogOut, Settings, Plus, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      // Error is handled in the auth context
    }
  };
  
  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
        isScrolled ? "glass-panel shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight hover-scale">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">QUIZO</span>
          </Link>
          <ThemeToggle />
        </div>
        
        {!isMobile ? (
          <nav className="flex items-center space-x-8">
            <Link to="/" className="font-medium underline-animation">
              Accueil
            </Link>
            {user && (
              <Link to="/create-quiz" className="font-medium underline-animation">
                Créer un Quiz
              </Link>
            )}
            <Link to="/history" className="font-medium underline-animation">
              Historique
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                      {user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.name || user.email} />
                      ) : (
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">
                        {user.name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/create-quiz')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un quiz
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/history')}>
                    <History className="mr-2 h-4 w-4" />
                    Mes quiz
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setShowAuthDialog(true)} 
                variant="secondary"
                className="hover-scale"
              >
                <User className="mr-2 h-4 w-4" />
                Connexion
              </Button>
            )}
          </nav>
        ) : (
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        )}
      </div>
      
      {/* Mobile menu */}
      {isMobile && isOpen && (
        <div className="container mx-auto mt-4 py-4 glass-panel rounded-xl animate-fade-in">
          <nav className="flex flex-col space-y-4">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium">Mode nuit</span>
              <ThemeToggle />
            </div>
            <Link 
              to="/" 
              className="px-4 py-2 rounded-md hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Accueil
            </Link>
            {user && (
              <Link 
                to="/create-quiz" 
                className="px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Créer un Quiz
              </Link>
            )}
            <Link 
              to="/history" 
              className="px-4 py-2 rounded-md hover:bg-secondary transition-colors flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <History className="mr-2 h-4 w-4" /> 
              Historique
            </Link>
            
            {user ? (
              <>
                <div className="px-4 py-2 flex items-center">
                  <Avatar className="h-8 w-8 mr-3 border-2 border-primary/20">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} alt={user.name || user.email} />
                    ) : (
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  setShowAuthDialog(true);
                  setIsOpen(false);
                }}
                className="w-full justify-start"
              >
                <User className="mr-2 h-4 w-4" />
                Connexion
              </Button>
            )}
          </nav>
        </div>
      )}
      
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </header>
  );
};
