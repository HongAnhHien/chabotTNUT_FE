import { type FC } from 'react';
import { Clock, ArrowLeft, Rocket, Sparkles } from 'lucide-react';

const ComingSoon: FC = () => {
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
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-light/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-dark/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon with Glass Effect */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
              <div className="relative backdrop-blur-md bg-white/20 border border-white/30 p-6 rounded-full shadow-lg">
                <Rocket className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Coming Soon
          </h1>
          
          {/* Description */}
          <p className="text-white/90 text-lg mb-8 max-w-md mx-auto drop-shadow">
            We're working hard to bring you something amazing. Stay tuned!
          </p>

          {/* Status Badge with Glass Effect */}
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/20 border border-white/30 px-6 py-3 rounded-full mb-8 shadow-lg">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Launching Soon</span>
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
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
              <span>Go Home</span>
              <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer with Glass Effect */}
        <div className="mt-6 text-center backdrop-blur-sm bg-white/5 border border-white/10 rounded-full px-6 py-3 inline-block mx-auto w-fit">
          <p className="text-white/90 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Get notified when we launch
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;