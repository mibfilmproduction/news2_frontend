import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
        // In a real production app, this token would be sent via email
        // For demo purposes, we're storing it to show the reset path
        const token = response.resetToken || response.data?.resetToken || "";
        setResetToken(token);
        
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process your request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-6">
      <SEO title="Forgot Password" noIndex />
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-6">
          <span className="font-bold text-2xl">Zenith<span className="text-primary">News</span></span>
        </Link>
        <h1 className="text-3xl font-bold mb-1">Forgot Password</h1>
        <p className="text-gray-600">Enter your email to receive a password reset link</p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        {!isSuccess ? (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                We'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Please check your inbox and follow the instructions to reset your password.
              </p>
              {/* For demo only - in production this token should not be displayed */}
              <div className="p-4 bg-muted rounded-md">
                <p className="text-xs font-mono">For demo purposes, use this link to reset your password:</p>
                <Link 
                  to={`/reset-password/${resetToken}`}
                  className="text-xs font-mono text-primary break-all"
                >
                  {window.location.origin}/reset-password/{resetToken}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  (In a real application, this would be sent via email)
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
