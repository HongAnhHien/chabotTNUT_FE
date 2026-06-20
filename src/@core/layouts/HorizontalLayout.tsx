import { type FC, type ReactNode, useEffect, useState, cloneElement, isValidElement } from 'react';

interface HorizontalLayoutProps {
  children: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const HorizontalLayout: FC<HorizontalLayoutProps> = ({ 
  children, 
  navbar,

  className = ''
}) => {
  // ** States
  const [isMounted, setIsMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // ** Update Window Width
  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  // ** Handle window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleWindowWidth);
      return () => window.removeEventListener('resize', handleWindowWidth);
    }
  }, []);

  // ** ComponentDidMount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // ** Don't render until mounted (prevent hydration issues)
  if (!isMounted) {
    return null;
  }

  const isMobile = windowWidth < 1024;

  // ** Props to inject into navbar
  const navbarProps = {
    isMobile
  };

  return (
    <div className={`min-h-screen flex flex-col  ${className}`}>
      {/* Navbar - Glass Effect */}
      {navbar && (
        <header className="sticky top-0  z-40">
          {/* Clone navbar element and inject props if it's a valid React element */}
          {isValidElement(navbar) ? cloneElement(navbar, navbarProps as any) : navbar}
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>

      {/* Footer - Glass Effect */}
      {/* {footer && (
        <footer className="backdrop-blur-xl bg-white/10 border-t border-white/20 shadow-lg">
          {footer}
        </footer>
      )} */}
    </div>
  );
};

export default HorizontalLayout;