import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../App';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    acceptTerms: false,
  });

  const startResendTimer = () => {
    setResendDisabled(true);
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendEmail = async () => {
    try {
      console.log('Attempting to resend confirmation email to:', formData.email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (error) throw error;
      console.log('Confirmation email resent successfully');
      startResendTimer();
    } catch (error: any) {
      console.error('Resend email error:', error);
      setError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSignupSuccess(false);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }

      if (!isLogin && !formData.acceptTerms) {
        throw new Error('You must accept the Terms and Conditions to create an account');
      }

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          if (signInError.message.includes('Email not confirmed')) {
            setSignupSuccess(true);
            throw new Error('Please verify your email address before signing in');
          }
          throw signInError;
        }

        // Direct redirect to dashboard after successful login
        window.location.href = '/dashboard';
      } else {
        // Sign up new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              business_name: formData.businessName,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('rate_limit')) {
            startResendTimer();
            throw new Error('Please wait a minute before trying to sign up again');
          }
          throw signUpError;
        }

        // Create profile for new user
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              business_name: formData.businessName,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't throw here - we still want to show signup success
          }
        }

        setSignupSuccess(true);
        setError(null);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BarChart3 className="h-12 w-12 text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          invisibl Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {signupSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              <p>Please check your email for a confirmation link to complete your registration.</p>
              {resendDisabled ? (
                <p className="mt-2">You can request another confirmation email in {resendTimer} seconds.</p>
              ) : (
                <button
                  onClick={handleResendEmail}
                  className="mt-2 text-green-700 hover:text-green-800 font-medium"
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                      Terms and Conditions
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSignupSuccess(false);
              }}
              className="w-full text-center text-sm text-primary-500 hover:text-primary-600"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;