import { type FC, useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router"; // ⭐ Import Outlet
import CoreVerticalLayout from "../@core/layouts/VerticalLayout";
import { Sidebar } from "../@core/components/siderbar";
import { Navbar } from "../@core/components/navbar";
// import { Footer } from '../@core/components/footer';
import { ArrowUp } from "lucide-react";

interface VerticalLayoutProps {
  userRole?: "admin" | "user";
  companyName?: string;
}

const VerticalLayout: FC<VerticalLayoutProps> = ({ userRole }) => {
  const navigation = useNavigate();

  // ** Get collapsed state from localStorage
  const getInitialCollapsedState = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("menuCollapsed");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  // ** Save collapsed state to localStorage
  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("menuCollapsed", JSON.stringify(collapsed));
    }
  };

  // ** Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // ** Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ** Handler functions for navbar
  const handleNotificationClick = () => {
    console.log("Notifications clicked");
    // Navigate to notifications or open notifications modal
    navigation("dashboard/notifications");
    // Implement your notification logic here
  };

  const handleSettingsClick = () => {
    console.log("Settings clicked");
    // Navigate to settings or open settings modal
  };

  // const handleUserClick = () => {
  //   console.log("User menu clicked");
  //   // Open user dropdown menu
  // };

  return (
    <>
      <CoreVerticalLayout
        sidebarCollapsed={isCollapsed}
        onCollapse={handleCollapse}
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
      >
        <Outlet />
      </CoreVerticalLayout>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="
    fixed bottom-20 
    left-1/2 -translate-x-1/2   /* mobile: ra giữa */
    md:left-auto md:translate-x-0 md:right-6  /* tablet + pc: về lại bên phải */

    p-2 md:p-2.5
    bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors
    hover:shadow-xl 
     duration-300 hover:scale-110 
    z-50 group
  "
          aria-label="Scroll to top"
        >
          <ArrowUp
            className="
             /* mobile nhỏ */
      md:w-5 md:h-5         /* tablet + pc giữ nguyên */
      group-hover:-translate-y-1 transition-transform
    "
          />
        </button>
      )}
    </>
  );
};

export default VerticalLayout;
