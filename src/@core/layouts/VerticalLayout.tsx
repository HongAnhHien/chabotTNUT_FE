import {
  type FC,
  type ReactNode,
  useEffect,
  useState,
  cloneElement,
  isValidElement,
} from "react";
import { motion } from "framer-motion";
import BackgroundLayout from "./background_animate/BackgroundLayout";
import { useLocation } from "react-router";

interface VerticalLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onMenuVisibilityChange?: (visible: boolean) => void;
  sidebarCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const VerticalLayout: FC<VerticalLayoutProps> = ({
  children,
  sidebar,
  navbar,
  footer,
  className = "",
  onMenuVisibilityChange,
  sidebarCollapsed = false,
  onCollapse,
}) => {
  // ** States
  const [menuVisibility, setMenuVisibility] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();

  // console.log("isAITutorPageisAITutorPageisAITutorPage",isAITutorPage);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ** Update Window Width
  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  // ** Handle menu visibility change
  const handleMenuVisibility = (visible: boolean) => {
    setMenuVisibility(visible);
    onMenuVisibilityChange?.(visible);
  };

  // ** Handle window resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleWindowWidth);
      return () => window.removeEventListener("resize", handleWindowWidth);
    }
  }, []);

  // ** Close menu on route change (mobile)
  useEffect(() => {
    if (menuVisibility && windowWidth < 1024) {
      handleMenuVisibility(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


  const isMobile = windowWidth < 1024;
  const showOverlay = menuVisibility && isMobile;

  // Dynamic sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? "w-20" : "w-64";
  const contentMargin = sidebarCollapsed ? "ml-20" : "ml-64";

  // ** Props to inject into navbar
  const navbarProps = {
    setMenuVisibility: handleMenuVisibility,
    isMobile,
    menuVisibility,
    isCollapsed: sidebarCollapsed,
    onCollapse,
  };

  return (
    <BackgroundLayout className={`bg-gray-100 dark:bg-gray-900 ${className}`}>
      {/* Sidebar - Desktop: Fixed, Mobile: Overlay */}
      {sidebar && (
        <>
          {/* Desktop Sidebar */}
          <aside
            className={`
              fixed left-0 top-0 h-screen ${sidebarWidth}
              transition-all duration-300 ease-in-out
              ${isMobile && !menuVisibility ? "-translate-x-full" : "translate-x-0"}
              ${isMobile ? "bg-sidebar border-r border-sidebar-border" : ""}
              z-50
            `}
          >
            <div className="h-full overflow-y-auto hide-scrollbar">
              {isValidElement(sidebar)
                ? cloneElement(sidebar, { onClose: () => handleMenuVisibility(false) } as object)
                : sidebar}
            </div>
          </aside>

          {/* Mobile Overlay */}
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => handleMenuVisibility(false)}
            />
          )}
        </>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col  ${
          sidebar && !isMobile ? contentMargin : ""
        } transition-all duration-300  `}
      >
        {/* Navbar - Pure Tailwind */}
        {navbar && (
          <>
            <header
              className={`
          sticky top-0 mt-2 rounded-t-xl
          z-30 border-border border-b-none border-x backdrop-blur-md
          transition-[background-color,box-shadow] duration-300 ease-in-out mx-1.5
          ${isScrolled ? "bg-background/40 shadow-md" : "bg-background"}
        `}
            >
              {isValidElement(navbar)
                ? cloneElement(navbar, navbarProps as unknown as object)
                : navbar}
            </header>
          </>
        )}

        {/* Content */}
        <main className="p-4 mx-1.5 mb-2 h-full space-y-4 rounded-b-xl border-t-none dark:bg-primary-foreground/90 bg-white/50 border border-border ">
          {children}
        </main>

        {/* Footer - Glass Effect */}
        {footer && (
          <motion.footer
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="backdrop-blur-xl bg-white/10 border-t border-white/20 shadow-lg"
          >
            {footer}
          </motion.footer>
        )}
      </div>
    </BackgroundLayout>
  );
};

export default VerticalLayout;
