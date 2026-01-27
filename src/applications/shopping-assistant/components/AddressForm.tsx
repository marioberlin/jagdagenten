/**
 * Address Form Component
 * Form for shipping/billing address entry with validation
 */
import React, { useState } from 'react';
import { MapPin, User, Building2, Phone, Mail, Check, AlertCircle } from 'lucide-react';
import { Address } from '@/services/a2a/CommerceService';

interface AddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onCancel?: () => void;
  title?: string;
  submitLabel?: string;
  isLoading?: boolean;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  address_line_1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
}

// Country list (common ones)
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
];

// US States
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  initialAddress = {},
  onSubmit,
  onCancel,
  title = 'Shipping Address',
  submitLabel = 'Save Address',
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Address>>({
    first_name: initialAddress.first_name || '',
    last_name: initialAddress.last_name || '',
    company: initialAddress.company || '',
    address_line_1: initialAddress.address_line_1 || '',
    address_line_2: initialAddress.address_line_2 || '',
    city: initialAddress.city || '',
    state: initialAddress.state || '',
    postal_code: initialAddress.postal_code || '',
    country: initialAddress.country || 'US',
    phone: initialAddress.phone || '',
    email: initialAddress.email || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field as keyof Address);
  };

  const validateField = (field: keyof Address): boolean => {
    let error: string | undefined;

    switch (field) {
      case 'first_name':
        if (!formData.first_name?.trim()) error = 'First name is required';
        break;
      case 'last_name':
        if (!formData.last_name?.trim()) error = 'Last name is required';
        break;
      case 'address_line_1':
        if (!formData.address_line_1?.trim()) error = 'Address is required';
        break;
      case 'city':
        if (!formData.city?.trim()) error = 'City is required';
        break;
      case 'postal_code':
        if (!formData.postal_code?.trim()) {
          error = 'Postal code is required';
        } else if (formData.country === 'US' && !/^\d{5}(-\d{4})?$/.test(formData.postal_code)) {
          error = 'Invalid US ZIP code';
        }
        break;
      case 'country':
        if (!formData.country?.trim()) error = 'Country is required';
        break;
      case 'email':
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          error = 'Invalid email address';
        }
        break;
      case 'phone':
        if (formData.phone && !/^[\d\s\-+()]{7,20}$/.test(formData.phone)) {
          error = 'Invalid phone number';
        }
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      return false;
    }
    return true;
  };

  const validateAll = (): boolean => {
    const requiredFields: (keyof Address)[] = ['first_name', 'last_name', 'address_line_1', 'city', 'postal_code', 'country'];
    let isValid = true;

    for (const field of requiredFields) {
      if (!validateField(field)) {
        isValid = false;
      }
    }

    // Validate optional fields that have values
    if (formData.email) validateField('email');
    if (formData.phone) validateField('phone');

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    onSubmit(formData as Address);
  };

  const showError = (field: keyof FormErrors) => touched.has(field) && errors[field];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={20} className="text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      {/* Name Row */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="First Name"
          value={formData.first_name || ''}
          onChange={(v) => handleChange('first_name', v)}
          onBlur={() => handleBlur('first_name')}
          error={showError('first_name') ? errors.first_name : undefined}
          icon={<User size={16} />}
          required
          disabled={isLoading}
        />
        <FormField
          label="Last Name"
          value={formData.last_name || ''}
          onChange={(v) => handleChange('last_name', v)}
          onBlur={() => handleBlur('last_name')}
          error={showError('last_name') ? errors.last_name : undefined}
          required
          disabled={isLoading}
        />
      </div>

      {/* Company (optional) */}
      <FormField
        label="Company"
        value={formData.company || ''}
        onChange={(v) => handleChange('company', v)}
        icon={<Building2 size={16} />}
        placeholder="Optional"
        disabled={isLoading}
      />

      {/* Address Lines */}
      <FormField
        label="Address"
        value={formData.address_line_1 || ''}
        onChange={(v) => handleChange('address_line_1', v)}
        onBlur={() => handleBlur('address_line_1')}
        error={showError('address_line_1') ? errors.address_line_1 : undefined}
        placeholder="Street address"
        required
        disabled={isLoading}
      />
      <FormField
        label="Address Line 2"
        value={formData.address_line_2 || ''}
        onChange={(v) => handleChange('address_line_2', v)}
        placeholder="Apartment, suite, etc. (optional)"
        disabled={isLoading}
      />

      {/* City, State, Postal Code */}
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <FormField
            label="City"
            value={formData.city || ''}
            onChange={(v) => handleChange('city', v)}
            onBlur={() => handleBlur('city')}
            error={showError('city') ? errors.city : undefined}
            required
            disabled={isLoading}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-white/60 mb-1.5">
            State / Province
          </label>
          <select
            value={formData.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">Select...</option>
            {formData.country === 'US' && US_STATES.map(state => (
              <option key={state.code} value={state.code}>{state.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <FormField
            label="Postal Code"
            value={formData.postal_code || ''}
            onChange={(v) => handleChange('postal_code', v)}
            onBlur={() => handleBlur('postal_code')}
            error={showError('postal_code') ? errors.postal_code : undefined}
            placeholder={formData.country === 'US' ? '12345' : ''}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">
          Country <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.country || 'US'}
          onChange={(e) => handleChange('country', e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
        >
          {COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>{country.name}</option>
          ))}
        </select>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Phone"
          value={formData.phone || ''}
          onChange={(v) => handleChange('phone', v)}
          onBlur={() => handleBlur('phone')}
          error={showError('phone') ? errors.phone : undefined}
          icon={<Phone size={16} />}
          placeholder="(555) 123-4567"
          type="tel"
          disabled={isLoading}
        />
        <FormField
          label="Email"
          value={formData.email || ''}
          onChange={(v) => handleChange('email', v)}
          onBlur={() => handleBlur('email')}
          error={showError('email') ? errors.email : undefined}
          icon={<Mail size={16} />}
          placeholder="your@email.com"
          type="email"
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 text-white/70 font-medium transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all disabled:opacity-50"
        >
          <Check size={18} />
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
};

// Form Field Component
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  icon,
  placeholder,
  type = 'text',
  required,
  disabled,
}) => (
  <div>
    <label className="block text-sm text-white/60 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${icon ? 'pl-9' : 'px-3'} pr-3 py-2 rounded-lg bg-white/5 border text-white placeholder-white/30 focus:outline-none transition-all disabled:opacity-50 ${
          error ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'
        }`}
      />
      {error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
          <AlertCircle size={16} />
        </div>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-400 mt-1">{error}</p>
    )}
  </div>
);

export default AddressForm;
