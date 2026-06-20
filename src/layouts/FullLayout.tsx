import { type FC, useState, useEffect } from 'react';
import CoreFullLayout from '@core/layouts/FullLayout';
import { Sidebar } from '../@core/components/siderbar';
import { Navbar } from '../@core/components/navbar';
import { Footer } from '../@core/components/footer';
import { ArrowUp } from 'lucide-react';
import { Outlet } from 'react-router';

interface FullLayoutProps {
  userRole?: 'admin' | 'user';
  companyName?: string;
}

const FullLayout: FC<FullLayoutProps> = ({
  userRole = 'user',
  companyName = 'Your Company'
}) => {
  // ** Get collapsed state from localStorage
  const getInitialCollapsedState = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menuCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  // ** Save collapsed state to localStorage
  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuCollapsed', JSON.stringify(collapsed));
    }
  };

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

  // ** Handler functions
  const handleNotificationClick = () => {
    console.log('Notifications clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  return (
    <>
      <CoreFullLayout
        sidebarCollapsed={isCollapsed}
        sidebar={
          <Sidebar
            isCollapsed={isCollapsed}
            onCollapse={handleCollapse}
            userRole={userRole}
            currentPath={currentPath}
          />
        }
        navbar={
          <Navbar
            notificationCount={3}
            onNotificationClick={handleNotificationClick}
            onSettingsClick={handleSettingsClick}
          />
        }
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
      </CoreFullLayout>

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

export default FullLayout;