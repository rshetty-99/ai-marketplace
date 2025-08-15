'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface CustomSignUpFormProps {
  className?: string;
}

export function CustomSignUpForm({ className }: CustomSignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // console.log('Creating signup with:', { emailAddress, username, firstName, lastName });
      const createResult = await signUp.create({
        emailAddress,
        username,
        password,
        firstName,
        lastName,
      });

      // console.log('Signup created:', createResult.status, createResult);

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      setPendingVerification(true);
      
      trackEvent('signup_initiated', {
        email: emailAddress,
        firstName,
        lastName,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      // console.log('Verification result:', completeSignUp.status, completeSignUp);

      if (completeSignUp.status === 'complete') {
        console.log('Complete signup object:', completeSignUp);
        
        // The correct way to handle this is to set the active session if it was created
        if (completeSignUp.createdSessionId) {
          console.log('Setting active session:', completeSignUp.createdSessionId);
          await setActive({ session: completeSignUp.createdSessionId });
          
          trackEvent('signup_completed', {
            email: emailAddress,
            userId: completeSignUp.createdUserId,
            timestamp: new Date().toISOString(),
          });
          
          // Use window.location to force a full page reload which ensures middleware sees the session
          window.location.href = '/onboarding';
        } else {
          console.error('No session was created during signup completion');
          setError('Account created but session failed. Please sign in with your credentials.');
        }
      } else if (completeSignUp.status === 'missing_requirements') {
        console.warn('Sign up has missing requirements:', completeSignUp);
        console.log('Missing requirements:', completeSignUp.missingFields);
        console.log('Required fields:', completeSignUp.requiredFields);
        
        // Check if we can proceed with the session that was created
        if (completeSignUp.createdSessionId) {
          console.log('Setting active session for missing requirements:', completeSignUp.createdSessionId);
          await setActive({ session: completeSignUp.createdSessionId });
          
          trackEvent('signup_partial_completed', {
            email: emailAddress,
            userId: completeSignUp.createdUserId,
            missingFields: completeSignUp.missingFields,
            timestamp: new Date().toISOString(),
          });
          
          // Go to onboarding where user can complete missing requirements
          window.location.href = '/onboarding';
        } else {
          console.error('No session created even with missing requirements');
          // Store the email for auto-fill in sign-in
          sessionStorage.setItem('pendingSignInEmail', emailAddress);
          setError('Account created successfully! Please sign in with your credentials to continue setup.');
        }
      } else {
        console.error('Sign up not complete:', completeSignUp);
        setError(`Verification failed. Status: ${completeSignUp.status}. Please check your code and try again.`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingVerification) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mx-auto mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We sent a verification code to <strong>{emailAddress}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-center block">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })}
              >
                Resend
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Join the AI Marketplace and connect with leading AI service providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="john_doe"
              value={username}
              onChange={(e) => {
                // Only allow alphanumeric characters, underscores, and hyphens
                const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                setUsername(value);
              }}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" type="button">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <a
              href="/sign-in"
              className="text-primary hover:underline underline-offset-4"
            >
              Sign in
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}