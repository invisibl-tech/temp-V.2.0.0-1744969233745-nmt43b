import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Calculator, 
  DollarSign, 
  HelpCircle, 
  Settings,
  Store,
  BadgePercent,
  LineChart,
  Lock
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  requiresSubscription?: boolean;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { hasActiveSubscription, loading } = useSubscription();

  // Define all menu items with subscription requirements
  const menuItems: MenuItem[] = [
    { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard', requiresSubscription: true },
    { path: '/platform-management', icon: Store, label: 'Platform Management', requiresSubscription: true },
    { path: '/pricing-tools', icon: Calculator, label: 'Pricing Tools', requiresSubscription: true },
    { path: '/promotions', icon: BadgePercent, label: 'Voucher & Promotions', requiresSubscription: true },
    { path: '/campaigns', icon: LineChart, label: 'Campaign Performance', requiresSubscription: true },
    { path: '/product-costs', icon: DollarSign, label: 'Product Costs', requiresSubscription: true },
    { path: '/help', icon: HelpCircle, label: 'Help' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-gray-800">invisibl</h1>
          </Link>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = item.requiresSubscription && !hasActiveSubscription;

            return (
              <Link
                key={item.path}
                to={isDisabled ? '/pricing' : item.path}
                className={`flex items-center px-4 py-3 ${
                  isDisabled 
                    ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50' 
                    : `text-gray-600 hover:bg-primary-50 hover:text-primary-600 ${
                        isActive ? 'bg-primary-50 text-primary-600' : ''
                      }`
                } transition-colors relative`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
                {isDisabled && (
                  <Lock className="h-4 w-4 absolute right-4 top-1/2 transform -translate-y-1/2" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {(!hasActiveSubscription && location.pathname !== '/settings' && location.pathname !== '/help') ? (
          <div className="p-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscribe to Access</h2>
              <p className="text-gray-600 mb-6">
                This feature requires an active subscription. Please subscribe to access our full suite of tools.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                View Subscription Options
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;