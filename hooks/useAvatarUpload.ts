/**
 * useAvatarUpload Hook
 * Reusable avatar upload to Supabase Storage with profile update
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseAvatarUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  onSuccess?: (publicUrl: string) => void;
  onError?: (error: Error) => void;
}

interface UseAvatarUploadReturn {
  uploadAvatar: (file: File, userId: string) => Promise<string | null>;
  isUploading: boolean;
  error: string | null;
  progress: number;
}

export function useAvatarUpload(options: UseAvatarUploadOptions = {}): UseAvatarUploadReturn {
  const { 
    bucket = 'avatars', 
    maxSizeMB = 2,
    onSuccess,
    onError 
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadAvatar = useCallback(async (file: File, userId: string): Promise<string | null> => {
    if (!file || !userId) {
      setError('Arquivo ou usuário não informado');
      return null;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `O arquivo deve ter no máximo ${maxSizeMB}MB`;
      setError(msg);
      onError?.(new Error(msg));
      return null;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const msg = 'Formato de imagem inválido. Use JPG, PNG, GIF ou WebP.';
      setError(msg);
      onError?.(new Error(msg));
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress(10);

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      setProgress(30);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(80);

      // Only update profile in database if userId is a valid UUID
      // This allows the hook to work with both Supabase profiles and local state members
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      if (isValidUUID) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: publicUrl, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        // Log but don't throw - the upload was successful, profile update is secondary
        if (updateError) {
          console.warn('Profile update failed (non-critical):', updateError.message);
        }
      }

      setProgress(100);
      
      console.log('Avatar uploaded successfully:', publicUrl);
      onSuccess?.(publicUrl);
      
      return publicUrl;

    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      const msg = err.message || 'Erro ao fazer upload da imagem';
      setError(msg);
      onError?.(err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [bucket, maxSizeMB, onSuccess, onError]);

  return {
    uploadAvatar,
    isUploading,
    error,
    progress,
  };
}
