import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import Fermatas from "./pages/admin/Fermatas";
import Drivers from "./pages/admin/Drivers";
import Taxis from "./pages/admin/Taxis";
import Users from "./pages/admin/Users";
import NotFound from "./pages/NotFound";
import DispatcherPage from "./pages/dispatcher/Dispatcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin/fermatas" element={<Fermatas />} />
          <Route path="/admin/drivers" element={<Drivers />} />
          <Route path="/admin/taxis" element={<Taxis />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/dispatcher" element={<DispatcherPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
