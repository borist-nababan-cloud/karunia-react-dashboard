'use client';

import React from 'react';
import Link from '@/components/NextLinkCompat';
import { useRouter } from '@/hooks/useRouter';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import Image from '@/components/NextImageCompat';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by AuthContext and displayed below
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-astra-silver/50 px-4">
      <Card className="w-full max-w-md shadow-soft border-0 rounded-2xl bg-white/90 backdrop-blur-md">
        <CardHeader className="space-y-1 flex flex-col items-center pt-8">
          <div className="w-full flex justify-center mb-6">
            <h1 className="text-3xl font-extrabold text-astra-charcoal tracking-tight text-center">
              {import.meta.env.VITE_APP_NAME || 'ASTRA DAIHATSU'}
            </h1>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-astra-charcoal">Login</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8">
            {error && (
              <Alert variant="destructive" className="border-astra-red/50 bg-astra-red/10 text-astra-red">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-astra-charcoal font-medium">Email or Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl border-gray-300 focus:border-astra-red focus:ring-astra-red transition-colors p-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-astra-charcoal font-medium">Password</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-12 rounded-xl transition-all duration-200 border-gray-300 group-hover:border-astra-red/50 focus:border-astra-red focus:ring-astra-red p-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-astra-red hover:bg-astra-red/10 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-astra-red focus:ring-offset-0"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-4">
            <Button
              type="submit"
              className="w-full bg-astra-red hover:bg-red-700 text-white font-semibold rounded-xl shadow-soft h-12 text-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 text-center">
        <div className="bg-astra-charcoal text-white py-3 px-8 rounded-xl shadow-soft">
          <span className="font-bold text-sm tracking-wide">
            {import.meta.env.VITE_APP_NAME} {import.meta.env.VITE_APP_TRADE_MARK}
          </span>
          <span className="text-xs text-astra-silver uppercase tracking-widest font-semibold ml-3 pl-3 border-l border-gray-600">
            {import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </span>
        </div>
      </div>
    </div>
  );
}