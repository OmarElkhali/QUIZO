
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center p-8 max-w-md">
        <div className="inline-flex items-center justify-center bg-amber-100 p-3 rounded-full mb-6">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-[#D2691E]">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Oops! La page que vous recherchez semble introuvable.</p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-[#D2691E] hover:bg-[#D2691E]/90"
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
