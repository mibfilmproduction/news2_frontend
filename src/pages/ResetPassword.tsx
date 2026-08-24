import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const { resetToken } = useParams<{ resetToken: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!resetToken) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [resetToken, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please enter both password fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!resetToken) {
        throw new Error("Reset token is missing");
      }
      
      const response = await authApi.resetPassword(resetToken, password);
      
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully",
        });
        
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-6">
      <SEO title="Reset Password" noIndex />
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-6">
          <span className="font-bold text-2xl">Zenith<span className="text-primary">News</span></span>
        </Link>
        <h1 className="text-3xl font-bold mb-1">Reset Password</h1>
        <p className="text-gray-600">Create a new password for your account</p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        {!isSuccess ? (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Please create a strong password you haven't used before
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <p className="text-sm text-center">
                <Link to="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-center text-green-600">Password Reset Successful!</CardTitle>
              <CardDescription className="text-center">
                Your password has been updated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center">
                You can now use your new password to log in to your account.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to login page in a few seconds...
              </p>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Link to="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
