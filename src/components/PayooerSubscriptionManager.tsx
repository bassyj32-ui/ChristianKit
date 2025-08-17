import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { payooerService, PayooerSubscription, PayooerPaymentMethod } from '../services/payooerService';

export const PayooerSubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PayooerSubscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PayooerPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      
      // Load user's subscription and payment methods
      // In a real implementation, you'd get the subscription ID from user data
      const userSubscriptionId = localStorage.getItem('userSubscriptionId');
      
      if (userSubscriptionId) {
        const sub = await payooerService.getSubscription(userSubscriptionId);
        setSubscription(sub);
      }
      
      const methods = await payooerService.getPaymentMethods(user!.uid);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    try {
      setIsCancelling(true);
      await payooerService.cancelSubscription(subscription.id, true);
      
      // Update local state
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setShowCancelModal(false);
      
      // Show success message
      alert('Subscription cancelled successfully. You will continue to have access until the end of your current billing period.');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', text: 'Past Due' },
      unpaid: { color: 'bg-red-100 text-red-800', text: 'Unpaid' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading subscription...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 text-6xl mb-4">💳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
        <p className="text-gray-600 mb-4">You don't have an active subscription at the moment.</p>
        <button
          onClick={() => window.location.href = '/subscription'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Subscription Management</h2>
            <p className="text-blue-100">Manage your ChristianKit Pro subscription</p>
          </div>
          <div className="text-right">
            {getStatusBadge(subscription.status)}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Subscription Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="mt-1 text-sm text-gray-900">ChristianKit Pro</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">{getStatusBadge(subscription.status)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Period Start</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(subscription.currentPeriodStart)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Period End</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(subscription.currentPeriodEnd)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Auto-Renewal</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {subscription.cancelAtPeriodEnd ? 'Disabled' : 'Enabled'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subscription ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{subscription.id}</dd>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    method.id === subscription.paymentMethodId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCardIcon(method.brand || 'card')}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Card'} 
                        ending in {method.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.id === subscription.paymentMethodId && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No payment methods found</p>
          )}
        </div>

        {/* Billing History */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">Billing history will be displayed here</p>
            <p className="text-sm text-gray-500">Recent invoices and payment records</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {subscription.status === 'active' && (
            <>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              >
                Cancel Subscription
              </button>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
              >
                Change Plan
              </button>
            </>
          )}
          <button
            onClick={() => window.location.href = '/support'}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Cancel Subscription</h3>
              <div className="mt-2 px-7">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for cancellation (optional)
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="too_expensive">Too expensive</option>
                    <option value="not_using">Not using enough</option>
                    <option value="missing_features">Missing features</option>
                    <option value="switching">Switching to another service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
