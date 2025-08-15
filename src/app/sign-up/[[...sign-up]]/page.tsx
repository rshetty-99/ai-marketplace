import { Metadata } from 'next';
import { CustomSignUpForm } from '@/components/auth/custom-sign-up-form';

export const metadata: Metadata = {
  title: 'Sign Up | AI Marketplace',
  description: 'Create your account to join the AI Marketplace platform',
};

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex size-8 items-center justify-center rounded-md font-bold">
              AI
            </div>
            AI Marketplace
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <CustomSignUpForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20">
          <div className="flex flex-col justify-center items-center h-full p-8 text-center">
            <div className="max-w-md space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Join the Future of AI Services
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect with leading AI service providers and transform your business with cutting-edge artificial intelligence solutions.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm">
                  <div className="font-semibold">500+ AI Providers</div>
                  <div className="text-muted-foreground">Verified experts</div>
                </div>
                <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm">
                  <div className="font-semibold">Enterprise Ready</div>
                  <div className="text-muted-foreground">SOC 2 compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}