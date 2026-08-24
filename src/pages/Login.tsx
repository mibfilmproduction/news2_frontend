
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const from = state?.from?.pathname || "/";

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (isAuthenticated) {
      // If they were trying to access admin and they're an admin, send them there
      // Otherwise send them to the home page
      if (from.includes('/admin') && isAdmin) {
        navigate(from);
      } else if (!from.includes('/admin')) {
        navigate(from);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, navigate, from]);

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-6">
      <SEO title="Login" noIndex />
      {/* <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-6">
        </Link>
      </div> */}
      <LoginForm />
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
