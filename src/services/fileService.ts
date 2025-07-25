import { supabase } from '@/integrations/supabase/client';

export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    console.log(`Extraction du texte du fichier: ${file.name}`);
    
    // Vérifier le type de fichier
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return await extractTextFromWord(file);
    } else if (fileType.includes('text') || fileName.endsWith('.txt')) {
      return await extractTextFromTxt(file);
    } else {
      throw new Error('Format de fichier non supporté');
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Impossible d'extraire le texte: ${error.message}`);
  }
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // 1. Télécharger le fichier vers Supabase Storage
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `temp/${timestamp}_${cleanFileName}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('quiz-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
    }
    
    // 2. Obtenir l'URL publique du fichier
    const { data: urlData } = supabase
      .storage
      .from('quiz-files')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL publique du fichier');
    }
    
    // 3. Envoyer le fichier à l'API Python pour l'extraction
    const response = await fetch('http://localhost:5000/api/extract-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl: urlData.publicUrl }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData.text;
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error(`Échec de l'extraction PDF: ${error.message}`);
  }
};

const extractTextFromWord = async (file: File): Promise<string> => {
  try {
    // 1. Télécharger le fichier vers Supabase Storage
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `temp/${timestamp}_${cleanFileName}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('quiz-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
    }
    
    // 2. Obtenir l'URL publique du fichier
    const { data: urlData } = supabase
      .storage
      .from('quiz-files')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible d\'obtenir l\'URL publique du fichier');
    }
    
    // 3. Envoyer le fichier à l'API Python pour l'extraction
    const response = await fetch('http://localhost:5000/api/extract-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl: urlData.publicUrl }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData.text;
  } catch (error) {
    console.error('Erreur extraction Word:', error);
    throw new Error(`Échec de l'extraction Word: ${error.message}`);
  }
};

const extractTextFromTxt = async (file: File): Promise<string> => {
  try {
    return await file.text();
  } catch (error) {
    console.error('Erreur extraction TXT:', error);
    throw new Error(`Échec de l'extraction TXT: ${error.message}`);
  }
}; 