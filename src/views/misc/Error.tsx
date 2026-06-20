import { type FC } from 'react';
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  errorCode?: string;
  title?: string;
  message?: string;
}

const ErrorPage: FC<ErrorPageProps> = ({
  errorCode = '404',
  title = 'Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved."
}) => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-light to-secondary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-dark/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Error Icon with Glass Effect */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative backdrop-blur-md bg-white/20 border border-white/30 p-6 rounded-full shadow-lg">
                <AlertTriangle className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <h2 className="text-8xl md:text-9xl font-bold text-white/80 drop-shadow-lg tracking-wider">
              {errorCode}
            </h2>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h1>
          
          {/* Description */}
          <p className="text-white/90 text-lg mb-8 max-w-md mx-auto drop-shadow">
            {message}
          </p>

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
              onClick={handleRefresh}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 backdrop-blur-md bg-white/15 hover:bg-white/25 border border-white/25 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
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
            Need help? Contact support
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;