'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Agency Branding Interface
 * Story 9.1: AC-9.1.6 - Branding data structure
 */
export interface AgencyBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
}

/**
 * Default branding values
 */
const DEFAULT_BRANDING: AgencyBranding = {
  name: '',
  logoUrl: null,
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  phone: null,
  email: null,
  address: null,
  website: null,
};

interface UseAgencyBrandingReturn {
  branding: AgencyBranding | null;
  isLoading: boolean;
  error: Error | null;
  updateBranding: (updates: Partial<AgencyBranding>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
  removeLogo: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * useAgencyBranding Hook
 * Story 9.1: AC-9.1.6 - Fetch and update agency branding data
 *
 * @param agencyId - The agency ID to fetch branding for
 */
export function useAgencyBranding(agencyId: string | null): UseAgencyBrandingReturn {
  const [branding, setBranding] = useState<AgencyBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Memoize the client to prevent infinite re-renders
  const supabase = useMemo(() => createClient(), []);

  const fetchBranding = useCallback(async () => {
    if (!agencyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agencies')
        .select(`
          name,
          logo_url,
          primary_color,
          secondary_color,
          phone,
          branding_email,
          address,
          website
        `)
        .eq('id', agencyId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        setBranding({
          name: data.name,
          logoUrl: data.logo_url,
          primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
          secondaryColor: data.secondary_color || DEFAULT_BRANDING.secondaryColor,
          phone: data.phone,
          email: data.branding_email,
          address: data.address,
          website: data.website,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch branding';
      setError(new Error(errorMessage));
      console.error('Error fetching branding:', err);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, supabase]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  /**
   * Update branding data
   * AC-9.1.3, AC-9.1.4: Save colors and contact info
   */
  const updateBranding = useCallback(async (updates: Partial<AgencyBranding>) => {
    if (!agencyId) {
      throw new Error('No agency ID provided');
    }

    try {
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          ...(updates.primaryColor && { primary_color: updates.primaryColor }),
          ...(updates.secondaryColor && { secondary_color: updates.secondaryColor }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
          ...(updates.email !== undefined && { branding_email: updates.email }),
          ...(updates.address !== undefined && { address: updates.address }),
          ...(updates.website !== undefined && { website: updates.website }),
          ...(updates.logoUrl !== undefined && { logo_url: updates.logoUrl }),
        })
        .eq('id', agencyId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setBranding((prev) => prev ? { ...prev, ...updates } : null);
      toast.success('Branding updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update branding';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [agencyId, supabase]);

  /**
   * Upload logo to storage
   * AC-9.1.2: Upload logo image (PNG/JPG, max 2MB)
   */
  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!agencyId) {
      throw new Error('No agency ID provided');
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG and JPG files are allowed');
      return null;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return null;
    }

    try {
      // Get file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${agencyId}/logo.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;

      // Update database
      await updateBranding({ logoUrl });

      toast.success('Logo uploaded successfully');
      return logoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      toast.error(errorMessage);
      console.error('Error uploading logo:', err);
      return null;
    }
  }, [agencyId, supabase, updateBranding]);

  /**
   * Remove logo from storage and database
   */
  const removeLogo = useCallback(async () => {
    if (!agencyId || !branding?.logoUrl) {
      return;
    }

    try {
      // Extract file path from URL
      const url = new URL(branding.logoUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // agencyId/logo.ext

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('branding')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Error deleting logo file:', deleteError);
        // Continue anyway - file might already be deleted
      }

      // Update database
      await updateBranding({ logoUrl: null });

      toast.success('Logo removed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove logo';
      toast.error(errorMessage);
      console.error('Error removing logo:', err);
    }
  }, [agencyId, branding?.logoUrl, supabase, updateBranding]);

  return {
    branding,
    isLoading,
    error,
    updateBranding,
    uploadLogo,
    removeLogo,
    refetch: fetchBranding,
  };
}
