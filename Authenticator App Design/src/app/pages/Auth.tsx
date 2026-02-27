import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Mail, Lock, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleGoogleAuth = () => {
    // Mock Google authentication
    localStorage.setItem("is_authenticated", "true");
    localStorage.setItem("auth_method", "google");
    navigate("/dashboard");
  };

  const handleAppleAuth = () => {
    // Mock Apple authentication
    localStorage.setItem("is_authenticated", "true");
    localStorage.setItem("auth_method", "apple");
    navigate("/dashboard");
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock email authentication
    localStorage.setItem("is_authenticated", "true");
    localStorage.setItem("auth_method", "email");
    navigate("/dashboard");
  };

  return (
    <div className="h-screen max-w-[430px] mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col p-6 pt-16"
      >
        <div className="text-center mb-12">
          <div className="inline-flex h-20 w-20 bg-white/90 backdrop-blur rounded-3xl items-center justify-center mb-6 shadow-lg">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-600 text-lg">
            {isLogin
              ? "Sign in to your account"
              : "Sign up to get started"}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <Button
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full h-14 text-base bg-white rounded-2xl border-2"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            onClick={handleAppleAuth}
            variant="outline"
            className="w-full h-14 text-base bg-white rounded-2xl border-2"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </Button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-r from-blue-50 to-indigo-100 text-gray-600">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-14 rounded-2xl text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-14 rounded-2xl text-base"
              required
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-base">
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </div>

          <div className="text-center text-base text-gray-600 pt-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}