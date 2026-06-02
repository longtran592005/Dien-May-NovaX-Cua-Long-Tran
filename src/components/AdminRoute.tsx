import { Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminWorkspaceAccess } from '@/lib/adminRoles';

export default function AdminRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">Đang kiểm tra quyền...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasAdminWorkspaceAccess(user.role)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}
