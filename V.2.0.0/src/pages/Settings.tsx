import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../App';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { useStripePortal } from '../hooks/useStripePortal';

interface UserProfile {
  business_name: string | null;
  email: string | null;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

function Settings() {
  const navigate = useNavigate();
  const { redirectToPortal, loading: portalLoading, error: portalError } = useStripePortal();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    business_name: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    validatePassword(passwordForm.newPassword);
  }, [passwordForm.newPassword]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // First get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile exists, create one
      if (!profileData) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            business_name: '',
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      setProfile({
        business_name: profileData?.business_name || '',
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    }
  };

  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      if (user.email !== profile.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: profile.email,
        });
        if (updateEmailError) throw updateEmailError;
      }

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_name: profile.business_name,
          updated_at: new Date().toISOString(),
        });

      if (updateProfileError) throw updateProfileError;

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (!isPasswordValid()) {
        throw new Error('Password does not meet security requirements');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email || '',
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
            <SubscriptionStatus />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            {message && (
              <div className={`mb-4 p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    value={profile.business_name || ''}
                    onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Your business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            {passwordMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {passwordMessage.text}
              </div>
            )}
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                  <div className="mt-2 space-y-2 text-sm">
                    <p className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least 8 characters
                    </p>
                    <p className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least one uppercase letter
                    </p>
                    <p className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least one lowercase letter
                    </p>
                    <p className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least one number
                    </p>
                    <p className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least one special character (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={passwordLoading || !isPasswordValid() || passwordForm.newPassword !== passwordForm.confirmPassword}
                    className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordMessage(null);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session</h2>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;