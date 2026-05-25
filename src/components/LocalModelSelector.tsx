/**
 * Composant pour sélectionner et gérer les modèles LLM locaux (Ollama)
 * Affiche les modèles disponibles et l'état d'Ollama
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Download, Server, Cpu } from 'lucide-react';
import { getLocalLLMInfo, RECOMMENDED_MODELS } from '@/services/localLlmService';

interface LocalModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  showRecommendations?: boolean;
}

export function LocalModelSelector({ 
  selectedModel, 
  onModelChange,
  showRecommendations = true 
}: LocalModelSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    setLoading(true);
    try {
      const info = await getLocalLLMInfo();
      setAvailable(info.available);
      setModels(info.models);
      setMessage(info.message);
      
      // Si aucun modèle n'est sélectionné et qu'il y en a de disponibles, sélectionner le premier
      if (!selectedModel && info.models.length > 0) {
        onModelChange(info.models[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'Ollama:', error);
      setAvailable(false);
      setMessage('Impossible de vérifier Ollama');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            LLM Local
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification d'Ollama...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            LLM Local (Ollama)
          </div>
          {available ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Disponible
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Non disponible
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {available && models.length > 0 ? (
          <>
            {/* Sélecteur de modèle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Modèle sélectionné</label>
              <Select value={selectedModel} onValueChange={onModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => {
                    const recommended = RECOMMENDED_MODELS[model as keyof typeof RECOMMENDED_MODELS];
                    return (
                      <SelectItem key={model} value={model}>
                        <div className="flex items-center gap-2">
                          <span>{model}</span>
                          {recommended && (
                            <Badge variant="secondary" className="text-xs">
                              {recommended.size}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {/* Info sur le modèle sélectionné */}
              {selectedModel && RECOMMENDED_MODELS[selectedModel as keyof typeof RECOMMENDED_MODELS] && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <div className="font-medium mb-1">
                    {RECOMMENDED_MODELS[selectedModel as keyof typeof RECOMMENDED_MODELS].name}
                  </div>
                  <div className="text-xs">
                    {RECOMMENDED_MODELS[selectedModel as keyof typeof RECOMMENDED_MODELS].description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Qualité: {'⭐'.repeat(RECOMMENDED_MODELS[selectedModel as keyof typeof RECOMMENDED_MODELS].quality)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Vitesse: {'⚡'.repeat(RECOMMENDED_MODELS[selectedModel as keyof typeof RECOMMENDED_MODELS].speed)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de rafraîchissement */}
            <Button
              variant="outline"
              size="sm"
              onClick={checkOllamaStatus}
              className="w-full"
            >
              <Server className="h-4 w-4 mr-2" />
              Rafraîchir les modèles
            </Button>
          </>
        ) : available && models.length === 0 ? (
          /* Ollama disponible mais aucun modèle */
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              <p className="mb-2">Aucun modèle téléchargé. Pour commencer :</p>
              <code className="block bg-muted p-2 rounded text-xs">
                ollama pull qwen2.5:7b
              </code>
              <p className="mt-2 text-xs text-muted-foreground">
                Ou essayez : llama3.1:8b, mistral:7b, phi3:mini
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          /* Ollama non disponible */
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Ollama n'est pas installé ou ne fonctionne pas</p>
              <div className="space-y-2 text-xs">
                <p>1. Téléchargez Ollama depuis :</p>
                <a 
                  href="https://ollama.com/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  https://ollama.com/download
                </a>
                <p>2. Installez-le et redémarrez votre ordinateur</p>
                <p>3. Téléchargez un modèle :</p>
                <code className="block bg-muted p-2 rounded">
                  ollama pull qwen2.5:7b
                </code>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Modèles recommandés */}
        {showRecommendations && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Modèles recommandés pour QUIZO</div>
            <div className="grid gap-2">
              {Object.entries(RECOMMENDED_MODELS).map(([key, model]) => (
                <div 
                  key={key}
                  className="text-xs p-2 bg-muted/50 rounded border flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-muted-foreground">{model.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {model.size}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
