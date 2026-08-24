
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import { AuthProvider } from "./hooks/useAuth.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-loaded pages (code splitting - each page is a separate chunk)
const Latest = lazy(() => import("./pages/Latest"));
const Breaking = lazy(() => import("./pages/Breaking"));
const National = lazy(() => import("./pages/National"));
const Entertainment = lazy(() => import("./pages/Entertainment"));
const Videos = lazy(() => import("./pages/Videos"));
const LiveTv = lazy(() => import("./pages/LiveTv"));
const Sports = lazy(() => import("./pages/Sports"));
const MatchDetail = lazy(() => import("./pages/MatchDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ShortPostsPage = lazy(() => import("./pages/ShortPostsPage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const ShortPostDetail = lazy(() => import("./pages/ShortPostDetail"));
const ReelDetail = lazy(() => import("./pages/ReelDetail"));
const World = lazy(() => import("./pages/World"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Articles = lazy(() => import("./pages/admin/Articles"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Advertisements = lazy(() => import("./pages/admin/Advertisements"));
const Users = lazy(() => import("./pages/admin/Users"));
const CategoryDetail = lazy(() => import("./pages/admin/CategoryDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Search = lazy(() => import("./pages/Search"));
const Photos = lazy(() => import("./pages/admin/Photos"));
const AdminVideos = lazy(() => import("./pages/admin/Videos"));
const Comments = lazy(() => import("./pages/admin/Comments"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const ShortPosts = lazy(() => import("./pages/admin/ShortPosts"));
const Reels = lazy(() => import("./pages/admin/Reels"));
const AdminLiveTv = lazy(() => import("./pages/admin/LiveTv"));
const AdminSports = lazy(() => import("./pages/admin/Sports"));
const AdminCareers = lazy(() => import("./pages/admin/Careers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Career = lazy(() => import("./pages/Career"));
const CareerDetail = lazy(() => import("./pages/CareerDetail"));

// Guard for admin-only pages (editor role is blocked)
const AdminOnlyPage = ({ children }: { children: React.ReactNode }) => {
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  if (user?.role !== "admin") {
    return <Navigate to={user?.role === "editor" ? "/admin/articles" : "/login"} replace />;
  }
  return <>{children}</>;
};

// Route definitions are now handled by the ProtectedRoute component

// Main application routes
const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="latest" element={<Latest />} />
          <Route path="breaking" element={<Breaking />} />
          <Route path="national" element={<National />} />
          <Route path="entertainment" element={<Entertainment />} />
          <Route path="videos" element={<Videos />} />
          <Route path="live-tv" element={<LiveTv />} />
          {/* Sports routes removed */}
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="article/:slug" element={<ArticleDetail />} />
          <Route path="world" element={<World />} />
          <Route path="search" element={<Search />} />
          <Route path="sports" element={<Sports />} />
          <Route path="sports/:sportSlug" element={<Sports />} />
          <Route path="sports/:sportSlug/match/:matchId" element={<MatchDetail />} />
          <Route path="short-posts" element={<ShortPostsPage />} />
          <Route path="short-posts/:id" element={<ShortPostDetail />} />
          <Route path="reels" element={<ReelsPage />} />
          <Route path="reels/:id" element={<ReelDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="career" element={<Career />} />
          <Route path="career/:slug" element={<CareerDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected user routes */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'editor', 'admin']} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin routes - protected with admin role */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'editor']} />}>
          <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOnlyPage><Dashboard /></AdminOnlyPage>} />
          <Route path="articles" element={<Articles />} />
          <Route path="categories" element={<AdminOnlyPage><Categories /></AdminOnlyPage>} />
          <Route path="categories/:categoryId" element={<AdminOnlyPage><CategoryDetail /></AdminOnlyPage>} />
          <Route path="advertisements" element={<AdminOnlyPage><Advertisements /></AdminOnlyPage>} />
          <Route path="users" element={<AdminOnlyPage><Users /></AdminOnlyPage>} />
          <Route path="photos" element={<AdminOnlyPage><Photos /></AdminOnlyPage>} />
          <Route path="videos" element={<AdminOnlyPage><AdminVideos /></AdminOnlyPage>} />
          <Route path="live-tv" element={<AdminOnlyPage><AdminLiveTv /></AdminOnlyPage>} />
          <Route path="sports" element={<AdminOnlyPage><AdminSports /></AdminOnlyPage>} />
          <Route path="short-posts" element={<ShortPosts />} />
          <Route path="reels" element={<Reels />} />
          <Route path="comments" element={<Comments />} />
          <Route path="contact" element={<AdminOnlyPage><ContactMessages /></AdminOnlyPage>} />
          <Route path="careers" element={<AdminOnlyPage><AdminCareers /></AdminOnlyPage>} />
          <Route path="analytics" element={<AdminOnlyPage><Analytics /></AdminOnlyPage>} />
          <Route path="settings" element={<AdminOnlyPage><Settings /></AdminOnlyPage>} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <ScrollToTop /> {/* This ensures page scrolls to top on route change */}
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
