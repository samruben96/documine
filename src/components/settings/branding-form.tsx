'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUpload } from './logo-upload';
import { ColorPicker } from './color-picker';
import { useAgencyBranding, type AgencyBranding } from '@/hooks/use-agency-branding';

/**
 * Branding Form Component
 * Story 9.1: AC-9.1.1 - Form to configure agency branding
 * AC-9.1.3 - Color configuration
 * AC-9.1.4 - Contact information
 */

const brandingFormSchema = z.object({
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

interface BrandingFormProps {
  agencyId: string;
}

export function BrandingForm({ agencyId }: BrandingFormProps) {
  const {
    branding,
    isLoading,
    error,
    updateBranding,
    uploadLogo,
    removeLogo,
  } = useAgencyBranding(agencyId);

  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      phone: '',
      email: '',
      address: '',
      website: '',
    },
  });

  // Update form when branding loads
  useEffect(() => {
    if (branding) {
      form.reset({
        phone: branding.phone || '',
        email: branding.email || '',
        address: branding.address || '',
        website: branding.website || '',
      });
      setPrimaryColor(branding.primaryColor);
      setSecondaryColor(branding.secondaryColor);
    }
  }, [branding, form]);

  const onSubmit = useCallback(async (values: BrandingFormValues) => {
    try {
      setIsSaving(true);
      await updateBranding({
        primaryColor,
        secondaryColor,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        website: values.website || null,
      });
    } finally {
      setIsSaving(false);
    }
  }, [updateBranding, primaryColor, secondaryColor]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">Failed to load branding settings</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Branding</CardTitle>
        <CardDescription>
          Configure your agency's branding for one-pagers and client documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Logo Upload Section */}
            <LogoUpload
              currentLogoUrl={branding?.logoUrl || null}
              onUpload={uploadLogo}
              onRemove={removeLogo}
              disabled={isSaving}
            />

            {/* Colors Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Brand Colors</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <ColorPicker
                  label="Primary Color"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  disabled={isSaving}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  disabled={isSaving}
                />
              </div>

              {/* Color Preview */}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 rounded px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="h-10 rounded px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Button
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                This information appears on generated one-pagers
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 123-4567"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@agency.com"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormDescription>
                        Email shown on one-pagers (can differ from login email)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, Suite 100&#10;City, State 12345"
                        rows={2}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://www.agency.com"
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Branding'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
