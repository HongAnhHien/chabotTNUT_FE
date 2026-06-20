import { type FC, type ReactNode } from 'react';

interface BlankLayoutProps {
  children: ReactNode;
}

const BlankLayout: FC<BlankLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
};

export default BlankLayout;