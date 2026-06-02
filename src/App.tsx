import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import AnnouncementBar from "@/components/AnnouncementBar";
import ComparisonBar from "@/components/ComparisonBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AdminOnlyRoute from "@/components/AdminOnlyRoute";
import AdminLayout from "@/components/AdminLayout";
import Homepage from "@/pages/Homepage";
import ProductListing from "@/pages/ProductListing";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import CheckoutPage from "@/pages/CheckoutPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ReportingPage from "@/pages/admin/ReportingPage";
import InventoryPage from "@/pages/admin/InventoryPage";
import AdminProductsPage from "@/pages/admin/ProductsPage";
import AdminOrdersPage from "@/pages/admin/OrdersPage";
import AdminOrderDetailPage from "@/pages/admin/OrderDetailPage";
import AdminCustomersPage from "@/pages/admin/CustomersPage";
import AdminStaffPage from "@/pages/admin/StaffPage";
import AdminOrderAuditPage from "@/pages/admin/OrderAuditPage";
import AdminPromotionsPage from "@/pages/admin/PromotionsPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ComparisonPage from "@/pages/ComparisonPage";
import BlogPage from "@/pages/BlogPage";
import StoreLocatorPage from "@/pages/StoreLocatorPage";
import PolicyPage from "@/pages/PolicyPage";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminHomePath, hasAdminWorkspaceAccess, normalizeRole } from "@/lib/adminRoles";

const queryClient = new QueryClient();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PLACEHOLDER.apps.googleusercontent.com";

const AdminIndexRoute = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (user && hasAdminWorkspaceAccess(user.role)) {
    return <Navigate to={getAdminHomePath(user.role).replace('/admin/', '')} replace />;
  }
  return <Navigate to="/profile" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ComparisonProvider>
                <NotificationProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <div className="min-h-screen flex flex-col">
                      <AnnouncementBar />
                      <Header />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Homepage />} />
                          <Route path="/products" element={<ProductListing />} />
                          <Route path="/product/:slug" element={<ProductDetail />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />
                          <Route path="/verify-email" element={<VerifyEmailPage />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route
                            path="/order-tracking"
                            element={
                              <ProtectedRoute>
                                <OrderTrackingPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/comparison" element={<ComparisonPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/stores" element={<StoreLocatorPage />} />
                          <Route path="/policy" element={<PolicyPage />} />
                          <Route
                            path="/admin"
                            element={
                              <AdminRoute>
                                <AdminLayout />
                              </AdminRoute>
                            }
                          >
                            <Route index element={<AdminIndexRoute />} />
                            <Route
                              path="reporting"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager']}>
                                  <ReportingPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="products"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager', 'warehouse']}>
                                  <AdminProductsPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="inventory"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager', 'warehouse']}>
                                  <InventoryPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="orders"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager', 'sales', 'warehouse', 'staff']}>
                                  <AdminOrdersPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="orders-audit"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager']}>
                                  <AdminOrderAuditPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="orders/:id"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager', 'sales', 'warehouse', 'staff']}>
                                  <AdminOrderDetailPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="customers"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin', 'manager', 'sales']}>
                                  <AdminCustomersPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="staff"
                              element={
                                <AdminOnlyRoute allowedRoles={['admin']}>
                                  <AdminStaffPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route
                              path="promotions"
                              element={
                                <AdminOnlyRoute allowedRoles={["admin", "manager"]}>
                                  <AdminPromotionsPage />
                                </AdminOnlyRoute>
                              }
                            />
                            <Route path="users" element={<Navigate to="/admin/customers" replace />} />
                          </Route>
                          <Route path="/promotions" element={<Navigate to="/admin/promotions" replace />} />
                          <Route
                            path="/checkout"
                            element={
                              <ProtectedRoute>
                                <CheckoutPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <ProfilePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                      <ComparisonBar />
                      <ChatWidget />
                    </div>
                  </BrowserRouter>
                </NotificationProvider>
              </ComparisonProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
