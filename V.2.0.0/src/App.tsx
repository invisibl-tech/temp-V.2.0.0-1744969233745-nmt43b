import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Dashboard from './pages/Dashboard.tsx';
import PricingTools from './pages/PricingTools.tsx';
import Settings from './pages/Settings.tsx';
import Help from './pages/Help.tsx';
import Auth from './pages/Auth.tsx';
import Landing from './pages/Landing.tsx';
import Pricing from './pages/Pricing.tsx';
import FAQ from './pages/FAQ.tsx';
import Contact from './pages/Contact.tsx';
import Features from './pages/Features.tsx';
import Terms from './pages/Terms.tsx';
import Privacy from './pages/Privacy.tsx';
import ProductCosts from './pages/ProductCosts.tsx';
import PlatformManagement from './pages/PlatformManagement.tsx';
import Promotions from './pages/Promotions.tsx';
import Campaigns from './pages/Campaigns.tsx';
import useAuth from './hooks/useAuth';

// Initialize Supabase client with explicit error handling and debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration:', {
  url: supabaseUrl ? 'URL is defined' : 'URL is missing',
  key: supabaseKey ? 'Key is defined' : 'Key is missing',
  fullUrl: supabaseUrl
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', {
    url: supabaseUrl,
    key: supabaseKey ? 'Key exists but hidden' : 'Key is missing'
  });
  throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: true,
    site: window.location.origin
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test the connection with better error handling
supabase.auth.getSession().then(
  ({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      // Check for specific error types
      if (error.message?.includes('Failed to fetch')) {
        console.error('Network error - Check CORS and Supabase endpoint accessibility');
      }
    } else {
      console.log('Supabase connection test successful:', {
        hasSession: !!data.session,
        timestamp: new Date().toISOString()
      });
    }
  }
).catch(err => {
  console.error('Unexpected error during Supabase connection:', {
    error: err.message,
    type: err.name,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/auth"
        element={session ? <Navigate to="/dashboard" /> : <Auth />}
      />
      <Route
        path="/dashboard"
        element={session ? <Dashboard /> : <Navigate to="/auth" />}
      />
      <Route
        path="/platform-management"
        element={session ? <PlatformManagement /> : <Navigate to="/auth" />}
      />
      <Route
        path="/pricing-tools"
        element={session ? <PricingTools /> : <Navigate to="/auth" />}
      />
      <Route
        path="/promotions"
        element={session ? <Promotions /> : <Navigate to="/auth" />}
      />
      <Route
        path="/campaigns"
        element={session ? <Campaigns /> : <Navigate to="/auth" />}
      />
      <Route
        path="/product-costs"
        element={session ? <ProductCosts /> : <Navigate to="/auth" />}
      />
      <Route
        path="/settings"
        element={session ? <Settings /> : <Navigate to="/auth" />}
      />
      <Route
        path="/help"
        element={session ? <Help /> : <Navigate to="/auth" />}
      />
    </Routes>
  );
}

export default App;