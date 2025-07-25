import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-4xl prose prose-slate">
          <h2>Politique de confidentialité de QUIZO</h2>
          <p className="text-muted-foreground">Dernière mise à jour : Juin 2025</p>
          
          <p>
            Chez QUIZO, nous accordons une grande importance à la protection de vos données personnelles. 
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations 
            lorsque vous utilisez notre plateforme de quiz.
          </p>

          <h3>Informations que nous collectons</h3>
          <p>
            Nous collectons les informations suivantes lorsque vous utilisez QUIZO :
          </p>
          <ul>
            <li>Informations de compte : nom, adresse e-mail, mot de passe sécurisé</li>
            <li>Données d'utilisation : quiz créés, réponses soumises, scores obtenus</li>
            <li>Informations techniques : adresse IP, type de navigateur, appareil utilisé</li>
          </ul>

          <h3>Utilisation de vos informations</h3>
          <p>
            Nous utilisons vos informations pour :
          </p>
          <ul>
            <li>Fournir et améliorer nos services de quiz</li>
            <li>Personnaliser votre expérience d'apprentissage</li>
            <li>Communiquer avec vous concernant votre compte</li>
            <li>Analyser l'utilisation de notre plateforme</li>
          </ul>

          <h3>Protection de vos données</h3>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données 
            contre tout accès non autorisé, modification, divulgation ou destruction.
          </p>

          <h3>Partage de vos informations</h3>
          <p>
            Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations avec :
          </p>
          <ul>
            <li>Des fournisseurs de services qui nous aident à exploiter notre plateforme</li>
            <li>Des partenaires de confiance pour améliorer nos services</li>
            <li>Des autorités légales lorsque la loi l'exige</li>
          </ul>

          <h3>Vos droits</h3>
          <p>
            Vous avez le droit d'accéder, de corriger, de supprimer ou de limiter l'utilisation de vos données personnelles. 
            Pour exercer ces droits, veuillez nous contacter via notre page de contact.
          </p>

          <h3>Modifications de cette politique</h3>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous informerons de tout 
            changement significatif par e-mail ou par une notification sur notre plateforme.
          </p>

          <h3>Contact</h3>
          <p>
            Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à 
            privacy@quizo.com ou via notre page de contact.
          </p>
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

export default PrivacyPolicy;