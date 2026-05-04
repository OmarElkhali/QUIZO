
import { QUIZ_FILES_BUCKET, getSupabaseStorageErrorMessage, supabase } from '@/integrations/supabase/client';

export const uploadFileToSupabase = async (file: File, userId: string): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    if (!userId) {
      throw new Error('User ID is required for upload');
    }
    
    console.log("Starting file upload process for:", file.name);
    
    // Create a unique path with timestamp
    const timestamp = Date.now();
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9.]/g, '_'); // Replace special chars with underscore
    
    const filePath = `${userId}/${timestamp}_${cleanFileName}`;
    
    console.log("Uploading file to path:", filePath);
    
    // Upload the file
    const { data, error: uploadError } = await supabase
      .storage
      .from(QUIZ_FILES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(getSupabaseStorageErrorMessage(uploadError));
    }
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from(QUIZ_FILES_BUCKET)
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log("File uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'File upload failed');
  }
};
