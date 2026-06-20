import { type FC, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { storage } from '@/helper/storage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

interface UserInfo {
  role: string;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token    = storage.getToken();
  const user     = storage.getUser<UserInfo>();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
