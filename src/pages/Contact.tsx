import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simuler l'envoi du message
    setTimeout(() => {
      toast.success("Votre message a été envoyé avec succès!");
      setName("");
      setEmail("");
      setMessage("");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-muted/30 py-4 px-6 border-b">
        <div className="container mx-auto max-w-4xl flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Contact</h1>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contactez-nous</h2>
              <p className="text-muted-foreground mb-6">
                Vous avez des questions, des suggestions ou besoin d'assistance ? 
                N'hésitez pas à nous contacter. Notre équipe vous répondra dans les plus brefs délais.
              </p>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span>omarelkali@gmail.com</span>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Heures d'ouverture</h3>
                <p className="text-muted-foreground">
                  Lundi - Vendredi: 9h00 - 18h00<br />
                  Samedi: 10h00 - 15h00<br />
                  Dimanche: Fermé
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-6">Envoyez-nous un message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Votre nom" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="votre@email.com" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Votre message" 
                    rows={5} 
                    required 
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer le message
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted/30 py-8 px-6 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">QUIZO</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Apprentissage optimisé par l'IA
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Politique de confidentialité
              </a>
              <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Conditions d'utilisation
              </a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Contact
              </a>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <p className="text-xs text-muted-foreground text-center">
            © 2025 QUIZO. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;