/**
 * Client Info Tab
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-1: Display all required personal info fields
 * AC-Q3.1-2: Required fields marked with red asterisk
 * AC-Q3.1-3: Phone auto-formats as (XXX) XXX-XXXX
 * AC-Q3.1-4: Address autocomplete after 3+ characters
 * AC-Q3.1-5: Selected address populates all fields
 * AC-Q3.1-6: State dropdown with 50 states + DC
 * AC-Q3.1-7: Date picker for DOB with MM/DD/YYYY format
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedCallback } from 'use-debounce';
import { CalendarIcon, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { AddressAutocomplete } from '@/components/quoting/address-autocomplete';
import { useQuoteSessionContext } from '@/contexts/quote-session-context';
import { personalInfoSchema, type PersonalInfoFormData } from '@/lib/quoting/validation';
import { formatPhoneNumber, formatDate, toISODateString, parseDate } from '@/lib/quoting/formatters';
import { US_STATES } from '@/lib/quoting/constants';
import type { Address } from '@/types/quoting';

/**
 * Required Field Label Component
 * AC-Q3.1-2: Red asterisk for required fields
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
 * Client Info Tab Component
 */
export function ClientInfoTab() {
  const { session, isSaving, updatePersonalInfo } = useQuoteSessionContext();

  // Initialize form with session data
  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: session?.clientData?.personal?.firstName ?? '',
      lastName: session?.clientData?.personal?.lastName ?? '',
      dateOfBirth: session?.clientData?.personal?.dateOfBirth ?? '',
      email: session?.clientData?.personal?.email ?? '',
      phone: session?.clientData?.personal?.phone
        ? formatPhoneNumber(session.clientData.personal.phone)
        : '',
      mailingAddress: {
        street: session?.clientData?.personal?.mailingAddress?.street ?? '',
        city: session?.clientData?.personal?.mailingAddress?.city ?? '',
        state: session?.clientData?.personal?.mailingAddress?.state ?? '',
        zipCode: session?.clientData?.personal?.mailingAddress?.zipCode ?? '',
      },
    },
    mode: 'onBlur',
  });

  // Reset form when session changes
  useEffect(() => {
    if (session?.clientData?.personal) {
      const personal = session.clientData.personal;
      form.reset({
        firstName: personal.firstName ?? '',
        lastName: personal.lastName ?? '',
        dateOfBirth: personal.dateOfBirth ?? '',
        email: personal.email ?? '',
        phone: personal.phone ? formatPhoneNumber(personal.phone) : '',
        mailingAddress: {
          street: personal.mailingAddress?.street ?? '',
          city: personal.mailingAddress?.city ?? '',
          state: personal.mailingAddress?.state ?? '',
          zipCode: personal.mailingAddress?.zipCode ?? '',
        },
      });
    }
  }, [session?.id]); // Only reset when session ID changes, not on every update

  /**
   * Save form data (debounced)
   */
  const saveData = useCallback(
    async (data: Partial<PersonalInfoFormData>) => {
      try {
        // Convert phone back to raw digits for storage
        if (data.phone) {
          data.phone = data.phone.replace(/\D/g, '');
        }
        await updatePersonalInfo(data);
      } catch {
        // Error handled by context
      }
    },
    [updatePersonalInfo]
  );

  const debouncedSave = useDebouncedCallback(saveData, 500);

  /**
   * Handle field blur - save individual field
   */
  const handleFieldBlur = useCallback(
    (fieldName: keyof PersonalInfoFormData) => {
      const value = form.getValues(fieldName);
      const fieldError = form.formState.errors[fieldName];

      // Only save if field is valid
      if (!fieldError && value !== undefined) {
        debouncedSave({ [fieldName]: value });
      }
    },
    [form, debouncedSave]
  );

  /**
   * Handle address selection from autocomplete
   * AC-Q3.1-5: Populate all address fields
   */
  const handleAddressSelect = useCallback(
    (address: Address) => {
      form.setValue('mailingAddress.street', address.street);
      form.setValue('mailingAddress.city', address.city);
      form.setValue('mailingAddress.state', address.state);
      form.setValue('mailingAddress.zipCode', address.zipCode);

      // Save full address
      debouncedSave({ mailingAddress: address });
    },
    [form, debouncedSave]
  );

  /**
   * Handle phone input with auto-formatting
   * AC-Q3.1-3: Auto-format as (XXX) XXX-XXXX
   */
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      form.setValue('phone', formatted);
    },
    [form]
  );

  /**
   * Handle DOB selection from calendar
   * AC-Q3.1-7: Date picker with MM/DD/YYYY format
   */
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const isoDate = toISODateString(date);
        form.setValue('dateOfBirth', isoDate);
        debouncedSave({ dateOfBirth: isoDate });
      }
    },
    [form, debouncedSave]
  );

  // Parse DOB for calendar display
  const dobValue = form.watch('dateOfBirth');
  const dobDate = dobValue ? parseDate(dobValue) : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Client Information</CardTitle>
          </div>
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>
        <CardDescription>
          Personal and contact information for the prospect
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Personal Info Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>First Name</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleFieldBlur('firstName');
                        }}
                        placeholder="John"
                        data-testid="firstName"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Last Name</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleFieldBlur('lastName');
                        }}
                        placeholder="Doe"
                        data-testid="lastName"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth - AC-Q3.1-7 */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Date of Birth</RequiredLabel>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            data-testid="dateOfBirth"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dobDate ? formatDate(dobDate) : 'MM/DD/YYYY'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dobDate}
                          onSelect={handleDateSelect}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          defaultMonth={dobDate ?? new Date(1990, 0, 1)}
                          captionLayout="dropdown"
                          fromYear={1920}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Email</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        onBlur={() => {
                          field.onBlur();
                          handleFieldBlur('email');
                        }}
                        placeholder="john.doe@example.com"
                        data-testid="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone - AC-Q3.1-3 */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Phone</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        onChange={handlePhoneChange}
                        onBlur={() => {
                          field.onBlur();
                          handleFieldBlur('phone');
                        }}
                        placeholder="(555) 123-4567"
                        data-testid="phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mailing Address Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Mailing Address
              </h3>

              {/* Street - AC-Q3.1-4, AC-Q3.1-5 */}
              <FormField
                control={form.control}
                name="mailingAddress.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Street Address</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        id="mailingAddress.street"
                        value={field.value}
                        onChange={field.onChange}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Start typing an address..."
                        hasError={!!form.formState.errors.mailingAddress?.street}
                        data-testid="mailingAddress.street"
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
                  name="mailingAddress.city"
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
                            const address = form.getValues('mailingAddress');
                            debouncedSave({ mailingAddress: address });
                          }}
                          placeholder="Austin"
                          data-testid="mailingAddress.city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State - AC-Q3.1-6 */}
                <FormField
                  control={form.control}
                  name="mailingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <RequiredLabel>State</RequiredLabel>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const address = form.getValues('mailingAddress');
                          debouncedSave({
                            mailingAddress: { ...address, state: value },
                          });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="mailingAddress.state">
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
                  name="mailingAddress.zipCode"
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
                            const address = form.getValues('mailingAddress');
                            debouncedSave({ mailingAddress: address });
                          }}
                          placeholder="78701"
                          maxLength={10}
                          data-testid="mailingAddress.zipCode"
                        />
                      </FormControl>
                      <FormMessage />
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
