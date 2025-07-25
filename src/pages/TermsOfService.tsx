import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
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
          <h1 className="text-2xl font-bold">Conditions d'utilisation</h1>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-4xl prose prose-slate">
          <h2>Conditions d'utilisation de QUIZO</h2>
          <p className="text-muted-foreground">Dernière mise à jour : Juin 2025</p>
          
          <p>
            Bienvenue sur QUIZO. En accédant à notre plateforme, vous acceptez d'être lié par les présentes conditions d'utilisation.
            Veuillez les lire attentivement avant d'utiliser notre service.
          </p>

          <h3>Acceptation des conditions</h3>
          <p>
            En utilisant QUIZO, vous acceptez ces conditions d'utilisation dans leur intégralité. Si vous n'acceptez pas 
            ces conditions, veuillez ne pas utiliser notre plateforme.
          </p>

          <h3>Description du service</h3>
          <p>
            QUIZO est une plateforme éducative qui permet aux utilisateurs de créer, partager et répondre à des quiz 
            générés par intelligence artificielle à partir de documents téléchargés.
          </p>

          <h3>Comptes utilisateurs</h3>
          <p>
            Pour utiliser certaines fonctionnalités de notre plateforme, vous devez créer un compte. Vous êtes responsable 
            de maintenir la confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte.
          </p>

          <h3>Contenu utilisateur</h3>
          <p>
            En téléchargeant du contenu sur QUIZO, vous :
          </p>
          <ul>
            <li>Garantissez que vous possédez tous les droits nécessaires sur ce contenu</li>
            <li>Accordez à QUIZO une licence non exclusive pour utiliser ce contenu afin de fournir le service</li>
            <li>Comprenez que vous êtes seul responsable du contenu que vous téléchargez</li>
          </ul>

          <h3>Propriété intellectuelle</h3>
          <p>
            QUIZO et son contenu original, fonctionnalités et fonctionnalités sont la propriété exclusive de QUIZO 
            et sont protégés par les lois internationales sur le droit d'auteur, les marques déposées et autres lois sur la propriété intellectuelle.
          </p>

          <h3>Utilisation acceptable</h3>
          <p>
            Vous acceptez de ne pas utiliser QUIZO pour :
          </p>
          <ul>
            <li>Violer toute loi applicable</li>
            <li>Enfreindre les droits de propriété intellectuelle d'autrui</li>
            <li>Transmettre du contenu illégal, offensant ou préjudiciable</li>
            <li>Perturber ou interférer avec la sécurité de la plateforme</li>
          </ul>

          <h3>Limitation de responsabilité</h3>
          <p>
            QUIZO fournit la plateforme "telle quelle" et "selon disponibilité", sans garantie d'aucune sorte. 
            Nous ne serons pas responsables des dommages indirects, spéciaux, consécutifs ou punitifs résultant de votre utilisation de la plateforme.
          </p>

          <h3>Modifications des conditions</h3>
          <p>
            Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications entreront 
            en vigueur dès leur publication sur la plateforme. Votre utilisation continue de QUIZO après la publication 
            des modifications constitue votre acceptation des nouvelles conditions.
          </p>

          <h3>Résiliation</h3>
          <p>
            Nous nous réservons le droit de résilier ou de suspendre votre compte et votre accès à QUIZO à notre seule 
            discrétion, sans préavis, pour toute raison, y compris une violation de ces conditions d'utilisation.
          </p>

          <h3>Loi applicable</h3>
          <p>
            Ces conditions d'utilisation sont régies et interprétées conformément aux lois du Maroc, sans égard aux principes de conflits de lois.
          </p>

          <h3>Contact</h3>
          <p>
            Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à 
            terms@quizo.com ou via notre page de contact.
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

export default TermsOfService;