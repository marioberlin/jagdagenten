/**
 * Checkout Flow
 * Multi-step checkout with shipping, payment, and review
 */
import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, MapPin, Truck, CreditCard, Check,
  Package, Loader2, Shield, Lock, User, Mail, Phone
} from 'lucide-react';
import { Checkout, ShippingMethod } from '@/services/a2a/CommerceService';
import { useCurrency } from '@/hooks/useCurrency';

interface CheckoutFlowProps {
  checkout: Checkout | null;
  shippingMethods: ShippingMethod[];
  isLoading?: boolean;
  onSetShipping: (methodId: string) => void;
  onApplyDiscount: (code: string) => void;
  onCheckout: (paymentToken: string) => void;
  onBack: () => void;
}

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review';

interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const DEFAULT_GUEST_INFO: GuestInfo = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  },
};

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  checkout,
  shippingMethods,
  isLoading = false,
  onSetShipping,
  onApplyDiscount: _onApplyDiscount,
  onCheckout,
  onBack
}) => {
  const [step, setStep] = useState<CheckoutStep>('address');
  const [guestInfo, setGuestInfo] = useState<GuestInfo>(DEFAULT_GUEST_INFO);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>(
    checkout?.shipping?.method_id || ''
  );
  const [paymentToken, setPaymentToken] = useState('tok_success');
  const { formatPrice } = useCurrency();

  const handleSelectShipping = (methodId: string) => {
    setSelectedShippingMethod(methodId);
    onSetShipping(methodId);
  };

  const handleNextStep = () => {
    if (step === 'address') setStep('shipping');
    else if (step === 'shipping') setStep('payment');
    else if (step === 'payment') setStep('review');
  };

  const handlePrevStep = () => {
    if (step === 'shipping') setStep('address');
    else if (step === 'payment') setStep('shipping');
    else if (step === 'review') setStep('payment');
    else onBack();
  };

  const handlePlaceOrder = () => {
    onCheckout(paymentToken);
  };

  const isAddressValid = () => {
    const { email, firstName, lastName, address } = guestInfo;
    return (
      email.includes('@') &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      address.line1.trim().length > 0 &&
      address.city.trim().length > 0 &&
      address.state.trim().length > 0 &&
      address.postalCode.trim().length > 0
    );
  };

  const canProceed = () => {
    if (step === 'address') return isAddressValid();
    if (step === 'shipping') return !!selectedShippingMethod;
    if (step === 'payment') return !!paymentToken;
    return true;
  };

  if (!checkout) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with steps */}
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevStep}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
            <span>{step === 'shipping' ? 'Back to Cart' : 'Back'}</span>
          </button>
          <h1 className="text-lg font-semibold text-white">Checkout</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
          <StepIndicator
            icon={<MapPin size={18} />}
            label="Address"
            isActive={step === 'address'}
            isComplete={step !== 'address'}
          />
          <div className="w-6 md:w-12 h-px bg-white/10 flex-shrink-0" />
          <StepIndicator
            icon={<Truck size={18} />}
            label="Shipping"
            isActive={step === 'shipping'}
            isComplete={step === 'payment' || step === 'review'}
          />
          <div className="w-6 md:w-12 h-px bg-white/10 flex-shrink-0" />
          <StepIndicator
            icon={<CreditCard size={18} />}
            label="Payment"
            isActive={step === 'payment'}
            isComplete={step === 'review'}
          />
          <div className="w-6 md:w-12 h-px bg-white/10 flex-shrink-0" />
          <StepIndicator
            icon={<Check size={18} />}
            label="Review"
            isActive={step === 'review'}
            isComplete={false}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-2xl mx-auto">
          {step === 'address' && (
            <AddressStep
              guestInfo={guestInfo}
              onGuestInfoChange={setGuestInfo}
            />
          )}

          {step === 'shipping' && (
            <ShippingStep
              methods={shippingMethods}
              selectedMethodId={selectedShippingMethod}
              onSelectMethod={handleSelectShipping}
              isLoading={isLoading}
            />
          )}

          {step === 'payment' && (
            <PaymentStep
              selectedToken={paymentToken}
              onSelectToken={setPaymentToken}
            />
          )}

          {step === 'review' && (
            <ReviewStep checkout={checkout} guestInfo={guestInfo} formatPrice={formatPrice} />
          )}
        </div>
      </div>

      {/* Footer with order summary and action */}
      <div className="border-t border-white/5 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Order summary */}
          <div className="text-sm">
            <div className="text-white/60">
              {checkout.item_count} items | Subtotal: {formatPrice(checkout.subtotal.amount)}
            </div>
            <div className="text-lg font-semibold text-white">
              Total: {formatPrice(checkout.total.amount)}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={step === 'review' ? handlePlaceOrder : handleNextStep}
            disabled={!canProceed() || isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : step === 'review' ? (
              <>
                <Lock size={18} />
                <span>Place Order</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step indicator
const StepIndicator: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}> = ({ icon, label, isActive, isComplete }) => (
  <div className={`flex items-center gap-2 flex-shrink-0 ${isActive ? 'text-indigo-400' : isComplete ? 'text-green-400' : 'text-white/30'}`}>
    <div className={`p-2 rounded-full ${isActive ? 'bg-indigo-500/20' : isComplete ? 'bg-green-500/20' : 'bg-white/5'}`}>
      {isComplete ? <Check size={18} /> : icon}
    </div>
    <span className="text-sm font-medium hidden md:block">{label}</span>
  </div>
);

// Address step (Guest checkout)
const AddressStep: React.FC<{
  guestInfo: GuestInfo;
  onGuestInfoChange: (info: GuestInfo) => void;
}> = ({ guestInfo, onGuestInfoChange }) => {
  const updateField = (field: keyof GuestInfo, value: string) => {
    onGuestInfoChange({ ...guestInfo, [field]: value });
  };

  const updateAddress = (field: keyof GuestInfo['address'], value: string) => {
    onGuestInfoChange({
      ...guestInfo,
      address: { ...guestInfo.address, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Contact & Shipping Address</h2>
        <p className="text-white/60 text-sm">Enter your details for guest checkout</p>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <User size={16} />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">First Name *</label>
            <input
              type="text"
              value={guestInfo.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="John"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Last Name *</label>
            <input
              type="text"
              value={guestInfo.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Doe"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Email Address *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={guestInfo.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Phone (optional)</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                value={guestInfo.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <MapPin size={16} />
          Shipping Address
        </h3>
        <div>
          <label className="block text-xs text-white/50 mb-1">Address Line 1 *</label>
          <input
            type="text"
            value={guestInfo.address.line1}
            onChange={(e) => updateAddress('line1', e.target.value)}
            placeholder="123 Main Street"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Address Line 2</label>
          <input
            type="text"
            value={guestInfo.address.line2}
            onChange={(e) => updateAddress('line2', e.target.value)}
            placeholder="Apt 4B (optional)"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-white/50 mb-1">City *</label>
            <input
              type="text"
              value={guestInfo.address.city}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="New York"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">State *</label>
            <input
              type="text"
              value={guestInfo.address.state}
              onChange={(e) => updateAddress('state', e.target.value)}
              placeholder="NY"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">ZIP Code *</label>
            <input
              type="text"
              value={guestInfo.address.postalCode}
              onChange={(e) => updateAddress('postalCode', e.target.value)}
              placeholder="10001"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Country</label>
            <select
              value={guestInfo.address.country}
              onChange={(e) => updateAddress('country', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <Shield size={20} className="text-indigo-400" />
        <span className="text-sm text-indigo-300">
          Your information is secure and will only be used for this order.
        </span>
      </div>
    </div>
  );
};

// Shipping step
const ShippingStep: React.FC<{
  methods: ShippingMethod[];
  selectedMethodId: string;
  onSelectMethod: (id: string) => void;
  isLoading?: boolean;
}> = ({ methods, selectedMethodId, onSelectMethod, isLoading }) => {
  const { formatPrice } = useCurrency();
  return (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Shipping Method</h2>
      <p className="text-white/60 text-sm">Choose how you'd like your order delivered</p>
    </div>

    {methods.length === 0 ? (
      <div className="text-center py-8">
        <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto mb-4" />
        <p className="text-white/60">Loading shipping options...</p>
      </div>
    ) : (
      <div className="space-y-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedMethodId === method.id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Truck size={20} className={selectedMethodId === method.id ? 'text-indigo-400' : 'text-white/60'} />
                <span className="font-medium text-white">{method.name}</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {parseFloat(method.price.amount) === 0 ? 'Free' : formatPrice(method.price.amount)}
              </span>
            </div>
            <p className="text-sm text-white/60 ml-8">{method.description}</p>
            <p className="text-xs text-white/40 ml-8 mt-1">
              {method.estimated_days_min === method.estimated_days_max
                ? `${method.estimated_days_min} business days`
                : `${method.estimated_days_min}-${method.estimated_days_max} business days`}
              {method.tracking_available && ' • Tracking included'}
            </p>
          </button>
        ))}
      </div>
    )}
  </div>
  );
};

// Payment step (demo tokens)
const PaymentStep: React.FC<{
  selectedToken: string;
  onSelectToken: (token: string) => void;
}> = ({ selectedToken, onSelectToken }) => {
  const paymentOptions = [
    { token: 'tok_success', label: 'Demo Card (Success)', description: 'Payment will succeed' },
    { token: 'tok_decline', label: 'Demo Card (Decline)', description: 'Payment will be declined' },
    { token: 'tok_insufficient_funds', label: 'Demo Card (Insufficient Funds)', description: 'Declined due to insufficient funds' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Payment Method</h2>
        <p className="text-white/60 text-sm">Select a demo payment token (UCP magic tokens)</p>
      </div>

      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <button
            key={option.token}
            onClick={() => onSelectToken(option.token)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedToken === option.token
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <CreditCard size={20} className={selectedToken === option.token ? 'text-indigo-400' : 'text-white/60'} />
              <span className="font-medium text-white">{option.label}</span>
            </div>
            <p className="text-sm text-white/60 ml-8">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <Shield size={20} className="text-green-400" />
        <span className="text-sm text-green-400">
          This is a demo store. No real payment will be processed.
        </span>
      </div>
    </div>
  );
};

// Review step
const ReviewStep: React.FC<{ checkout: Checkout; guestInfo: GuestInfo; formatPrice: (amount: number | string) => string }> = ({ checkout, guestInfo, formatPrice }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Review Your Order</h2>
      <p className="text-white/60 text-sm">Please review your order before placing it</p>
    </div>

    {/* Contact & Shipping Address */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-3 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
          <User size={14} />
          Contact
        </h3>
        <p className="text-sm text-white">{guestInfo.firstName} {guestInfo.lastName}</p>
        <p className="text-sm text-white/60">{guestInfo.email}</p>
        {guestInfo.phone && <p className="text-sm text-white/60">{guestInfo.phone}</p>}
      </div>
      <div className="p-3 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
          <MapPin size={14} />
          Ship To
        </h3>
        <p className="text-sm text-white">{guestInfo.address.line1}</p>
        {guestInfo.address.line2 && <p className="text-sm text-white">{guestInfo.address.line2}</p>}
        <p className="text-sm text-white/60">
          {guestInfo.address.city}, {guestInfo.address.state} {guestInfo.address.postalCode}
        </p>
      </div>
    </div>

    {/* Items */}
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/80">Items ({checkout.item_count})</h3>
      {checkout.line_items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Package size={20} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{item.name}</p>
            <p className="text-xs text-white/40">Qty: {item.quantity}</p>
          </div>
          <span className="text-sm font-medium text-white">{formatPrice(item.total_price.amount)}</span>
        </div>
      ))}
    </div>

    {/* Shipping */}
    {checkout.shipping && (
      <div className="p-3 rounded-xl bg-white/5">
        <h3 className="text-sm font-medium text-white/80 mb-2">Shipping</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">{checkout.shipping.method_name}</span>
          <span className="text-white">
            {parseFloat(checkout.shipping_total.amount) === 0
              ? 'Free'
              : formatPrice(checkout.shipping_total.amount)}
          </span>
        </div>
      </div>
    )}

    {/* Order Summary */}
    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Subtotal</span>
        <span className="text-white">{formatPrice(checkout.subtotal.amount)}</span>
      </div>
      {parseFloat(checkout.discount_total.amount) > 0 && (
        <div className="flex justify-between text-sm text-green-400">
          <span>Discount</span>
          <span>-{formatPrice(checkout.discount_total.amount)}</span>
        </div>
      )}
      {checkout.shipping && (
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Shipping</span>
          <span className="text-white">
            {parseFloat(checkout.shipping_total.amount) === 0
              ? 'Free'
              : formatPrice(checkout.shipping_total.amount)}
          </span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-white/60">Tax</span>
        <span className="text-white">{formatPrice(checkout.tax_total.amount)}</span>
      </div>
      <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10">
        <span>Total</span>
        <span>{formatPrice(checkout.total.amount)}</span>
      </div>
    </div>
  </div>
);
