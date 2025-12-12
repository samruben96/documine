/**
 * Property Tab
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-8: Visible for "home" or "bundle" quote types, hidden for "auto"
 * AC-Q3.1-9: "Same as Mailing Address" checkbox populates from Client Info
 * AC-Q3.1-10: Property details fields
 * AC-Q3.1-11: Coverage preference fields
 * AC-Q3.1-12: Currency input formatting with $ and commas
 * AC-Q3.1-13: Risk factor checkboxes
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
import { Home, Loader2 } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useQuoteSessionContext } from '@/contexts/quote-session-context';
import { propertyInfoSchema, type PropertyInfoFormData, type PropertyInfoFormInput } from '@/lib/quoting/validation';
import { formatCurrency, parseCurrency, formatCurrencyInput } from '@/lib/quoting/formatters';
import {
  US_STATES,
  CONSTRUCTION_TYPES,
  ROOF_TYPES,
  LIABILITY_COVERAGE_OPTIONS,
  PROPERTY_DEDUCTIBLE_OPTIONS,
} from '@/lib/quoting/constants';

/**
 * Required Field Label Component
 */
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="text-destructive ml-0.5">*</span>
    </>
  );
}

/**
 * Property Tab Component
 */
export function PropertyTab() {
  const { session, isSaving, updatePropertyInfo } = useQuoteSessionContext();
  const [dwellingDisplay, setDwellingDisplay] = useState('');

  // Initialize form with session data
  const form = useForm<PropertyInfoFormInput>({
    resolver: zodResolver(propertyInfoSchema),
    defaultValues: getDefaultValues(session?.clientData?.property),
    mode: 'onBlur',
  });

  // Reset form when session changes
  useEffect(() => {
    if (session?.clientData?.property) {
      const values = getDefaultValues(session.clientData.property);
      form.reset(values);
      // Set display value for dwelling coverage
      if (session.clientData.property.dwellingCoverage) {
        setDwellingDisplay(formatCurrency(session.clientData.property.dwellingCoverage));
      }
    }
  }, [session?.id]);

  /**
   * Save form data (debounced)
   */
  const saveData = useCallback(
    async (data: Partial<PropertyInfoFormData>) => {
      try {
        await updatePropertyInfo(data);
      } catch {
        // Error handled by context
      }
    },
    [updatePropertyInfo]
  );

  const debouncedSave = useDebouncedCallback(saveData, 500);

  /**
   * Handle "Same as Mailing Address" checkbox
   * AC-Q3.1-9: Populate property address from Client Info
   */
  const handleSameAsMailingChange = useCallback(
    (checked: boolean) => {
      form.setValue('sameAsMailingAddress', checked);

      if (checked && session?.clientData?.personal?.mailingAddress) {
        const mailingAddress = session.clientData.personal.mailingAddress;
        form.setValue('address.street', mailingAddress.street ?? '');
        form.setValue('address.city', mailingAddress.city ?? '');
        form.setValue('address.state', mailingAddress.state ?? '');
        form.setValue('address.zipCode', mailingAddress.zipCode ?? '');

        // Save the updated address
        debouncedSave({
          sameAsMailingAddress: true,
          address: mailingAddress,
        });
      } else {
        debouncedSave({ sameAsMailingAddress: checked });
      }
    },
    [form, session?.clientData?.personal?.mailingAddress, debouncedSave]
  );

  /**
   * Handle currency input
   * AC-Q3.1-12: Format on blur with $ and commas
   */
  const handleDwellingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = formatCurrencyInput(e.target.value);
      setDwellingDisplay(rawValue);
    },
    []
  );

  const handleDwellingBlur = useCallback(() => {
    const numValue = parseCurrency(dwellingDisplay);
    if (numValue !== undefined) {
      form.setValue('dwellingCoverage', numValue);
      setDwellingDisplay(formatCurrency(numValue));
      debouncedSave({ dwellingCoverage: numValue });
    }
  }, [dwellingDisplay, form, debouncedSave]);

  /**
   * Handle number field blur
   */
  const handleNumberFieldBlur = useCallback(
    (fieldName: 'yearBuilt' | 'squareFootage' | 'roofYear') => {
      const value = form.getValues(fieldName);
      const fieldError = form.formState.errors[fieldName];
      if (!fieldError && value !== undefined) {
        debouncedSave({ [fieldName]: value });
      }
    },
    [form, debouncedSave]
  );

  /**
   * Handle select change
   */
  const handleSelectChange = useCallback(
    (
      fieldName: 'constructionType' | 'roofType' | 'liabilityCoverage' | 'deductible',
      value: string
    ) => {
      debouncedSave({ [fieldName]: value });
    },
    [debouncedSave]
  );

  /**
   * Handle checkbox change
   */
  const handleCheckboxChange = useCallback(
    (fieldName: 'hasPool' | 'hasTrampoline', checked: boolean) => {
      form.setValue(fieldName, checked);
      debouncedSave({ [fieldName]: checked });
    },
    [form, debouncedSave]
  );

  /**
   * Handle address field blur
   */
  const handleAddressBlur = useCallback(() => {
    const address = form.getValues('address');
    debouncedSave({ address });
  }, [form, debouncedSave]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Property Information</CardTitle>
          </div>
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>
        <CardDescription>
          Address and details about the insured property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            {/* Property Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Property Address
                </h3>
                {/* AC-Q3.1-9: Same as Mailing Address checkbox */}
                <FormField
                  control={form.control}
                  name="sameAsMailingAddress"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={handleSameAsMailingChange}
                          data-testid="sameAsMailingAddress"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Same as Mailing Address
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Street */}
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Street Address</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleAddressBlur();
                        }}
                        disabled={form.watch('sameAsMailingAddress')}
                        placeholder="123 Main Street"
                        data-testid="address.street"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* City */}
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>City</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleAddressBlur();
                          }}
                          disabled={form.watch('sameAsMailingAddress')}
                          placeholder="Austin"
                          data-testid="address.city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>State</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleAddressBlur();
                        }}
                        disabled={form.watch('sameAsMailingAddress')}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="address.state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ZIP Code */}
                <FormField
                  control={form.control}
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>ZIP Code</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleAddressBlur();
                          }}
                          disabled={form.watch('sameAsMailingAddress')}
                          placeholder="78701"
                          maxLength={10}
                          data-testid="address.zipCode"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Property Details Section - AC-Q3.1-10 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Property Details
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Year Built */}
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Year Built</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          onBlur={() => {
                            field.onBlur();
                            handleNumberFieldBlur('yearBuilt');
                          }}
                          placeholder="1985"
                          data-testid="yearBuilt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Square Footage */}
                <FormField
                  control={form.control}
                  name="squareFootage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Square Footage</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          onBlur={() => {
                            field.onBlur();
                            handleNumberFieldBlur('squareFootage');
                          }}
                          placeholder="2000"
                          data-testid="squareFootage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Construction Type */}
                <FormField
                  control={form.control}
                  name="constructionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Construction Type</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSelectChange('constructionType', value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="constructionType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONSTRUCTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Roof Type */}
                <FormField
                  control={form.control}
                  name="roofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Roof Type</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSelectChange('roofType', value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="roofType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROOF_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Roof Year */}
                <FormField
                  control={form.control}
                  name="roofYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Roof Year</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          onBlur={() => {
                            field.onBlur();
                            handleNumberFieldBlur('roofYear');
                          }}
                          placeholder="2010"
                          data-testid="roofYear"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Coverage Preferences Section - AC-Q3.1-11 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Coverage Preferences
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Dwelling Coverage - AC-Q3.1-12 */}
                <FormField
                  control={form.control}
                  name="dwellingCoverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Dwelling Coverage</RequiredLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={dwellingDisplay}
                          onChange={handleDwellingChange}
                          onBlur={handleDwellingBlur}
                          placeholder="$250,000"
                          data-testid="dwellingCoverage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Liability Coverage */}
                <FormField
                  control={form.control}
                  name="liabilityCoverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Liability Coverage</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSelectChange('liabilityCoverage', value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="liabilityCoverage">
                            <SelectValue placeholder="Select coverage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LIABILITY_COVERAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Deductible */}
                <FormField
                  control={form.control}
                  name="deductible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>Deductible</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSelectChange('deductible', value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="deductible">
                            <SelectValue placeholder="Select deductible" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_DEDUCTIBLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Risk Factors Section - AC-Q3.1-13 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Risk Factors
              </h3>

              <div className="flex flex-wrap gap-6">
                {/* Has Pool */}
                <FormField
                  control={form.control}
                  name="hasPool"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('hasPool', checked as boolean)
                          }
                          data-testid="hasPool"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Has Pool
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Has Trampoline */}
                <FormField
                  control={form.control}
                  name="hasTrampoline"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('hasTrampoline', checked as boolean)
                          }
                          data-testid="hasTrampoline"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Has Trampoline
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * Get default form values from property info
 */
function getDefaultValues(property?: {
  sameAsMailingAddress?: boolean;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  yearBuilt?: number;
  squareFootage?: number;
  constructionType?: string;
  roofType?: string;
  roofYear?: number;
  dwellingCoverage?: number;
  liabilityCoverage?: string;
  deductible?: string;
  hasPool?: boolean;
  hasTrampoline?: boolean;
}): Partial<PropertyInfoFormInput> {
  return {
    sameAsMailingAddress: property?.sameAsMailingAddress ?? false,
    address: {
      street: property?.address?.street ?? '',
      city: property?.address?.city ?? '',
      state: property?.address?.state ?? '',
      zipCode: property?.address?.zipCode ?? '',
    },
    yearBuilt: property?.yearBuilt,
    squareFootage: property?.squareFootage,
    constructionType: property?.constructionType as PropertyInfoFormData['constructionType'],
    roofType: property?.roofType as PropertyInfoFormData['roofType'],
    roofYear: property?.roofYear,
    dwellingCoverage: property?.dwellingCoverage,
    liabilityCoverage: property?.liabilityCoverage as PropertyInfoFormData['liabilityCoverage'],
    deductible: property?.deductible as PropertyInfoFormData['deductible'],
    hasPool: property?.hasPool ?? false,
    hasTrampoline: property?.hasTrampoline ?? false,
  };
}
