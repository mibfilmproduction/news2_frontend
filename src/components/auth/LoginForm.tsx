
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import logo from '@/assets/logo.png';

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Check if server is available on component mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const checkServerStatus = async () => {
      try {
        const response = await authApi.testConnection();
        if (isMounted) {
          setIsServerAvailable(response.success);
          if (!response.success) {
            console.error("Server unavailable:", response.message);
          }
        }
      } catch (error) {
        console.error("Server connection error:", error);
        if (isMounted) {
          setIsServerAvailable(false);
        }
      }
    };
    
    checkServerStatus();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Do nothing - will be handled after login
    }
  }, [isAuthenticated]);

  // Basic email validation using regex
  const isValidEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset any debug info and previous errors
    setDebugInfo(null);
    setEmailError(null);
    setPasswordError(null);
    
    // Check server availability first
    if (!isServerAvailable) {
      toast({
        variant: "destructive",
        title: "Server unavailable",
        description: "The server is currently unavailable. Please try again later.",
      });
      return;
    }
    
    // Form validation
    const trimmedEmail = email.trim();
    let hasErrors = false;
    
    if (!trimmedEmail) {
      setEmailError("Email is required");
      hasErrors = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      hasErrors = true;
    }
    
    if (!password) {
      setPasswordError("Password is required");
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasErrors = true;
    }
    
    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please correct the errors in the form.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Make a direct API call first to capture detailed debug info
      if (showDebug) {
        try {
          const directResponse = await authApi.login({ email: trimmedEmail, password });
          setDebugInfo(directResponse);
        } catch (err) {
          console.error("Direct API error:", err);
          setDebugInfo({ error: err instanceof Error ? err.message : String(err) });
        }
      }

      // Proceed with normal login through auth context
      const result = await login(trimmedEmail, password);
      
      if (result.success) {
        // Get the latest user info from localStorage (updated by the login function)
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          // Show success message
          toast({
            title: "Login successful",
            description: `Welcome back, ${userData.name || 'User'}!`,
          });
          
          // Redirect based on user role
          if (userData && (userData.role === 'admin' || userData.role === 'editor')) {
            navigate(userData.role === 'admin' ? '/admin' : '/admin/articles');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error("Error handling successful login:", error);
          // Fallback to home page if there's an error
          navigate('/');
        }
      } else {
        // Show error message from the login function
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message || "Invalid credentials. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // State for email and password field errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Clear field errors when input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(null);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      {!isServerAvailable && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700 text-sm">
            <strong>Backend server unavailable</strong>
          </p>
          <p className="text-red-700 text-xs mt-1">
            Unable to connect to the backend API server. This may be due to:
          </p>
          <ul className="text-red-700 text-xs list-disc list-inside mt-1">
            <li>The backend server is not running</li>
            <li>There is a network connectivity issue</li>
            <li>The API URL is misconfigured</li>
          </ul>
          <p className="text-red-700 text-xs mt-2">
            Please make sure the server is running at {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
          </p>
        </div>
      )}
      <CardHeader>
        <CardTitle><img src={logo} width={149} height={150} alt="logo" /></CardTitle>
        {/* <CardDescription>
          Enter your credentials to access your account
        </CardDescription> */}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={handleEmailChange}
              aria-invalid={emailError ? 'true' : 'false'}
              required
              className={emailError ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              aria-invalid={passwordError ? 'true' : 'false'}
              required
              className={passwordError ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {passwordError && (
              <p className="text-xs text-red-500 mt-1">{passwordError}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : "Login"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          {/* Debug section - only visible in development */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="debug" 
                checked={showDebug} 
                onCheckedChange={(checked) => setShowDebug(checked as boolean)} 
              />
              <Label htmlFor="debug" className="text-xs text-gray-500 cursor-pointer">
                Debug mode (development only)
              </Label>
            </div>
            
            {showDebug && debugInfo && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">
                <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
