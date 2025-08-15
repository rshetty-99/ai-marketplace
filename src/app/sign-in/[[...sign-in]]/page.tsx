import { Metadata } from 'next';
import { CustomSignInForm } from '@/components/auth/custom-sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In | AI Marketplace',
  description: 'Sign in to your AI Marketplace account',
};

export default function SignInPage() {
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
            <CustomSignInForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block overflow-hidden">
        {/* Background Image - Replace src with your chosen image */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500">
          {/* AI Marketplace Hero Image */}
          <img 
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="AI Neural Network Visualization" 
            className="w-full h-full object-cover opacity-25"
          />
          
          {/* Geometric overlay pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-20 w-3 h-3 bg-cyan-300/40 rounded-full animate-bounce"></div>
            <div className="absolute bottom-40 left-20 w-2 h-2 bg-purple-300/30 rounded-full animate-ping"></div>
            <div className="absolute bottom-20 right-10 w-4 h-4 bg-blue-300/20 rounded-full animate-pulse"></div>
          </div>
          
          {/* Content overlay */}
          <div className="relative flex flex-col justify-center items-center h-full p-8 text-center text-white">
            <div className="max-w-md space-y-6">
              <div className="w-16 h-16 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold">
                Welcome Back to the Future
              </h2>
              <p className="text-lg text-white/90">
                Connect with cutting-edge AI services and transform your projects with intelligent solutions.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="font-semibold text-lg">10,000+</div>
                  <div className="text-white/80">Projects Delivered</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <div className="font-semibold text-lg">99.9%</div>
                  <div className="text-white/80">Platform Uptime</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 pt-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}