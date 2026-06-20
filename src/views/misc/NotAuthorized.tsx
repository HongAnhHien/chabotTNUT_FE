import { type FC } from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

const NotAuthorized: FC = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-light to-secondary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-dark/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon with Glass Effect */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative backdrop-blur-md bg-white/20 border border-white/30 p-6 rounded-full shadow-lg">
                <ShieldAlert className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <h2 className="text-8xl md:text-9xl font-bold text-white/80 drop-shadow-lg tracking-wider">
              403
            </h2>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Access Denied
          </h1>
          
          {/* Description */}
          <p className="text-white/90 text-lg mb-8 max-w-md mx-auto drop-shadow">
            You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake.
          </p>

          {/* Status Badge with Glass Effect */}
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-amber-500/20 border border-amber-400/30 px-6 py-3 rounded-full mb-8 shadow-lg">
            <Lock className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Restricted Area</span>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 my-8"></div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            
            <button
              onClick={handleGoHome}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/40 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Go Home
            </button>
          </div>
        </div>

        {/* Footer with Glass Effect */}
        <div className="mt-6 text-center backdrop-blur-sm bg-white/5 border border-white/10 rounded-full px-6 py-3 inline-block mx-auto w-fit">
          <p className="text-white/80 text-sm">
            Need access? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;