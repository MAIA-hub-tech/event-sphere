"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!email) throw new Error('Please enter your email address');
      if (!/\S+@\S+\.\S+/.test(email)) throw new Error('Please enter a valid email address');

      await sendPasswordReset(email.trim());
      setSuccess(true);
      toast.success('Password reset email sent!', {
        description: 'Check your inbox (and spam/junk folder) for the reset link.',
        position: 'top-center',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg animate-fade border-none">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full shadow-md">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Reset Your Password
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter your email address to receive a password reset link.
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Password reset link sent successfully!
              </p>
              <Button asChild className="w-full h-12 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 shadow-md hover:shadow-lg">
                <Link href="/sign-in">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 rounded-full px-4 ${error ? "border-red-500" : "border-gray-300"} focus:ring-cyan-500 focus:border-cyan-500 shadow-sm transition-shadow duration-300 hover:shadow-md`}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                  loading ? "cursor-not-allowed opacity-75" : ""
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-gray-600 mt-4">
            Remember your password?{" "}
            <Link href="/sign-in" className="text-cyan-600 hover:text-cyan-500 hover:underline font-medium transition-colors duration-300">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}