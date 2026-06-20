import { type FC, useState, useEffect } from 'react';
import CoreHorizontalLayout from '@core/layouts/HorizontalLayout';
import { Footer } from '@core/components/footer';
import { ArrowUp} from 'lucide-react';
import { Outlet } from 'react-router';

interface HorizontalLayoutProps {
  companyName?: string;
}


const HorizontalLayout: FC<HorizontalLayoutProps> = ({ 
  companyName = 'Your Company'
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ** Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // ** Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

 


  return (
    <>
      <CoreHorizontalLayout
        // navbar={<Navbar />}
        footer={
          <Footer
            companyName={companyName}
            year={2025}
            links={[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Contact Us', href: '/contact' },
            ]}
            showMadeWith={true}
            madeByName="Cương"
          />
        }
      >
        {/* ⭐ Use Outlet instead of children prop */}
        <Outlet />
      </CoreHorizontalLayout>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </>
  );
};

export default HorizontalLayout;