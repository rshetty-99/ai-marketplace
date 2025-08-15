'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import CustomFormField, { FormFieldType } from '@/components/CustomFormFields';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FreelancerOnboarding, VerificationStatus } from '@/lib/firebase/onboarding-schema';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  country: z.string().min(2, 'Please select your country'),
  timezone: z.string().min(3, 'Please select your timezone'),
  documentType: z.enum(['passport', 'drivers_license', 'national_id']),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  data: Partial<FreelancerOnboarding>;
  onUpdate: (data: Partial<FreelancerOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  // Add more countries as needed
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  // Add more timezones as needed
];

export function PersonalInfoStep({ data, onUpdate, onNext, isSubmitting }: PersonalInfoStepProps) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    data.personalInfo?.profilePhoto || null
  );
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    data.personalInfo?.identityVerification?.status || VerificationStatus.NOT_STARTED
  );
  const [isVerifying, setIsVerifying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: data.personalInfo?.firstName || '',
      lastName: data.personalInfo?.lastName || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      country: data.personalInfo?.country || '',
      timezone: data.personalInfo?.timezone || '',
      documentType: data.personalInfo?.identityVerification?.documentType || 'passport',
    },
  });

  // Auto-save form data when it changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      // Only update if form has been touched and values are valid
      if (form.formState.isDirty) {
        onUpdate({
          personalInfo: {
            ...data.personalInfo,
            ...values,
            profilePhoto,
            identityVerification: {
              status: verificationStatus,
              documentType: values.documentType || 'passport',
              documentUrl: identityDocument ? `documents/${identityDocument.name}` : undefined,
              verifiedAt: verificationStatus === VerificationStatus.VERIFIED ? new Date() : undefined,
            },
          },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate, data.personalInfo, profilePhoto, verificationStatus, identityDocument]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        // Update the onboarding data
        onUpdate({
          personalInfo: {
            ...data.personalInfo,
            profilePhoto: result,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIdentityDocument(file);
      setVerificationStatus(VerificationStatus.IN_PROGRESS);
      
      // Simulate document verification process
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setVerificationStatus(VerificationStatus.VERIFIED);
        
        // Update the onboarding data
        onUpdate({
          personalInfo: {
            ...data.personalInfo,
            identityVerification: {
              status: VerificationStatus.VERIFIED,
              documentType: form.getValues('documentType'),
              documentUrl: `documents/${file.name}`, // In real app, upload to cloud storage
              verifiedAt: new Date(),
            },
          },
        });
      }, 3000);
    }
  };

  const onSubmit = (formData: PersonalInfoForm) => {
    onUpdate({
      personalInfo: {
        ...formData,
        profilePhoto,
        identityVerification: {
          status: verificationStatus,
          documentType: formData.documentType,
          documentUrl: identityDocument ? `documents/${identityDocument.name}` : undefined,
          verifiedAt: verificationStatus === VerificationStatus.VERIFIED ? new Date() : undefined,
        },
      },
    });
    onNext();
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case VerificationStatus.VERIFIED:
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case VerificationStatus.IN_PROGRESS:
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying...</Badge>;
      case VerificationStatus.FAILED:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Photo</CardTitle>
          <CardDescription>
            Add a professional profile photo to build trust with potential clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePhoto || undefined} />
              <AvatarFallback className="text-lg">
                {form.watch('firstName')?.[0]}{form.watch('lastName')?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
                className="w-fit"
              >
                <Camera className="w-4 h-4 mr-2" />
                {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max file size 5MB.
              </p>
            </div>
          </div>
          
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Personal Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>
            Provide your basic information for your freelancer profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <CustomFormField<PersonalInfoForm>
              control={form.control}
              name="firstName"
              fieldType={FormFieldType.INPUT}
              label="First Name *"
              placeholder="John"
            />
            
            <CustomFormField<PersonalInfoForm>
              control={form.control}
              name="lastName"
              fieldType={FormFieldType.INPUT}
              label="Last Name *"
              placeholder="Doe"
            />
          </div>

          <CustomFormField<PersonalInfoForm>
            control={form.control}
            name="email"
            fieldType={FormFieldType.INPUT}
            label="Email Address *"
            placeholder="john.doe@example.com"
          />

          <CustomFormField<PersonalInfoForm>
            control={form.control}
            name="phone"
            fieldType={FormFieldType.PHONE_INPUT}
            label="Phone Number *"
            placeholder="+1 (555) 123-4567"
          />

          <div className="grid grid-cols-2 gap-4">
            <CustomFormField<PersonalInfoForm>
              control={form.control}
              name="country"
              fieldType={FormFieldType.SELECT}
              label="Country *"
              placeholder="Select your country"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </CustomFormField>
            
            <CustomFormField<PersonalInfoForm>
              control={form.control}
              name="timezone"
              fieldType={FormFieldType.SELECT}
              label="Timezone *"
              placeholder="Select your timezone"
            >
              {TIMEZONES.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </CustomFormField>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Identity Verification</CardTitle>
            <CardDescription>
              Upload a government-issued ID to verify your identity
            </CardDescription>
          </div>
          {getVerificationBadge()}
        </CardHeader>
        <CardContent className="space-y-6">
          <CustomFormField<PersonalInfoForm>
            control={form.control}
            name="documentType"
            fieldType={FormFieldType.SELECT}
            label="Document Type *"
            placeholder="Select document type"
          >
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver's License</option>
            <option value="national_id">National ID</option>
          </CustomFormField>

          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                PNG, JPG or PDF. Max file size 10MB.
              </p>
              {identityDocument && (
                <p className="text-sm text-green-600">
                  Document uploaded: {identityDocument.name}
                </p>
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleDocumentUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || verificationStatus === VerificationStatus.IN_PROGRESS}
          className="min-w-32"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
      </form>
    </Form>
  );
}