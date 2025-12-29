import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UserPortal from "./pages/UserPortal";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSecurity from "./pages/admin/AdminSecurity";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import { SupportWidget } from "@/components/common/SupportWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user-portal" element={<UserPortal />} />

          {/* Legacy Admin routes (keeping for reference or if used) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="waitlist" element={<AdminWaitlist />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="emails" element={<AdminEmails />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="security" element={<AdminSecurity />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;