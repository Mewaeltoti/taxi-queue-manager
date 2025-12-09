import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DispatcherDashboard from "./pages/DispatcherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import Fermatas from "./pages/admin/Fermatas";
import Drivers from "./pages/admin/Drivers";
import Taxis from "./pages/admin/Taxis";
import Dispatchers from "./pages/admin/Dispatchers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false, dispatcherOnly = false }: { 
  children: React.ReactNode; 
  adminOnly?: boolean;
  dispatcherOnly?: boolean;
}) {
  const { user, isAdmin, isDispatcher } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (dispatcherOnly && !isDispatcher) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Auth route wrapper (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  
  if (user) {
    // Redirect based on role
    return <Navigate to={isAdmin ? "/admin" : "/dispatcher"} replace />;
  }
  
  return <>{children}</>;
}

// Home route - redirects based on role
function HomeRedirect() {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={isAdmin ? "/admin" : "/dispatcher"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Dispatcher Routes */}
      <Route path="/dispatcher" element={
        <ProtectedRoute dispatcherOnly>
          <DispatcherDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute adminOnly>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/admin/fermatas" element={
        <ProtectedRoute adminOnly>
          <Fermatas />
        </ProtectedRoute>
      } />
      <Route path="/admin/drivers" element={
        <ProtectedRoute adminOnly>
          <Drivers />
        </ProtectedRoute>
      } />
      <Route path="/admin/taxis" element={
        <ProtectedRoute adminOnly>
          <Taxis />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly>
          <Dispatchers />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
