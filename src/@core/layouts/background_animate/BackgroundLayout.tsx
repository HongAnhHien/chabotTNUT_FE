import { type FC, type ReactNode } from "react";

interface BackgroundLayoutProps {
  children: ReactNode;
  className?: string;
}

const BackgroundLayout: FC<BackgroundLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`min-h-screen flex relative bg-background ${className}`}>
      {children}
    </div>
  );
};

export default BackgroundLayout;
