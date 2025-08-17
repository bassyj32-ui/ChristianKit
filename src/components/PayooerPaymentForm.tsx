import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { payooerService, PayooerPaymentMethod, PayooerPlan } from '../services/payooerService';

interface PayooerPaymentFormProps {
  plan: PayooerPlan;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  saveCard: boolean;
}

export const PayooerPaymentForm: React.FC<PayooerPaymentFormProps> = ({
  plan,
  onSuccess,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    saveCard: true
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [savedCards, setSavedCards] = useState<PayooerPaymentMethod[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadSavedCards();
    }
  }, [user]);

  const loadSavedCards = async () => {
    try {
      const cards = await payooerService.getPaymentMethods(user!.uid);
      setSavedCards(cards);
    } catch (error) {
      console.error('Failed to load saved cards:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      newErrors.expiryMonth = 'Please select expiry month and year';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(formData.expiryYear) < currentYear || 
          (parseInt(formData.expiryYear) === currentYear && parseInt(formData.expiryMonth) < currentMonth)) {
        newErrors.expiryMonth = 'Card has expired';
      }
    }

    if (!formData.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    
    try {
      if (selectedCard) {
        // Use existing saved card
        const subscription = await payooerService.createSubscription(
          plan.id,
          selectedCard,
          user!.uid
        );
        onSuccess(subscription.id);
      } else {
        // Process new card payment
        const paymentResult = await payooerService.processPayment(
          plan.price,
          plan.currency,
          'new_card', // This would be replaced with actual card tokenization
          `Subscription to ${plan.name}`,
          user!.uid
        );

        if (paymentResult.success) {
          // Create subscription with the new payment method
          const subscription = await payooerService.createSubscription(
            plan.id,
            paymentResult.transactionId!,
            user!.uid
          );
          onSuccess(subscription.id);
        } else {
          onError(paymentResult.error || 'Payment failed');
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCard = async () => {
    if (!validateForm()) return;
    
    try {
      // In a real implementation, you would tokenize the card first
      // For now, we'll simulate adding a payment method
      const newCard: PayooerPaymentMethod = {
        id: `card_${Date.now()}`,
        type: 'card',
        last4: formData.cardNumber.slice(-4),
        brand: 'visa', // This would be detected from the card number
        expiryMonth: parseInt(formData.expiryMonth),
        expiryYear: parseInt(formData.expiryYear),
        isDefault: savedCards.length === 0
      };
      
      setSavedCards(prev => [...prev, newCard]);
      setSelectedCard(newCard.id);
      
      // Clear form
      setFormData({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
        saveCard: true
      });
    } catch (error) {
      onError('Failed to save card');
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h3 className="text-white text-lg font-semibold">Complete Your Subscription</h3>
        <p className="text-blue-100 text-sm">Plan: {plan.name} - ${plan.price}/{plan.interval}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Saved Cards Section */}
        {savedCards.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Use Saved Card
            </label>
            <div className="space-y-2">
              {savedCards.map((card) => (
                <label key={card.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="savedCard"
                    value={card.id}
                    checked={selectedCard === card.id}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCardIcon(card.brand || 'card')}</span>
                    <span className="text-sm text-gray-700">
                      •••• {card.last4} - Expires {card.expiryMonth}/{card.expiryYear}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              Or add a new card below
            </div>
          </div>
        )}

        {/* New Card Form */}
        {!selectedCard && (
          <div className="space-y-4 border-t pt-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Month
                </label>
                <select
                  value={formData.expiryMonth}
                  onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                {errors.expiryMonth && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryMonth}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Year
                </label>
                <select
                  value={formData.expiryYear}
                  onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expiryYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.expiryYear && (
                  <p className="text-red-500 text-xs mt-1">{errors.expiryYear}</p>
                )}
              </div>
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={4}
              />
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={formData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
              )}
            </div>

            {/* Save Card Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saveCard"
                checked={formData.saveCard}
                onChange={(e) => handleInputChange('saveCard', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700">
                Save this card for future payments
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          
          {!selectedCard && formData.saveCard && (
            <button
              type="button"
              onClick={handleSaveCard}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
            >
              Save Card
            </button>
          )}
          
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Subscribe for $${plan.price}/${plan.interval}`
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          🔒 Your payment information is encrypted and secure. 
          We never store your full card details.
        </div>
      </form>
    </div>
  );
};
