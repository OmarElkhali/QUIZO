import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SharedQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      navigate(`/join-quiz/${code.toUpperCase()}`, { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-24 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4 mx-auto">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Lien de quiz partage</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Ce lien utilise un ancien format. Il manque le code de partage pour rejoindre le quiz.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Retour a l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SharedQuiz;
