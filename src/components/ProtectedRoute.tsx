import { Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">Dang xac thuc...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
