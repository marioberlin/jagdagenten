/**
 * UCP Payment Adapter
 *
 * Mock payment processor with deterministic "magic tokens" for testing.
 * In production, this would integrate with Stripe, Adyen, etc.
 */

import {
  type UCPPaymentData,
  type UCPPaymentResult,
  type UCPRiskSignals,
  type UCPCheckout,
  UCPException,
  UCP_ERROR_CODES,
} from './types.js';

// ============================================================================
// Magic Payment Tokens
// ============================================================================

/**
 * Magic tokens for deterministic testing outcomes.
 * Use these token values in payment_data.token to trigger specific behaviors.
 */
export const MAGIC_TOKENS = {
  // Success scenarios
  SUCCESS: 'tok_success',
  SUCCESS_VISA: 'tok_visa',
  SUCCESS_MASTERCARD: 'tok_mastercard',
  SUCCESS_AMEX: 'tok_amex',

  // Failure scenarios
  DECLINE_GENERIC: 'tok_decline',
  DECLINE_INSUFFICIENT_FUNDS: 'tok_insufficient_funds',
  DECLINE_CARD_EXPIRED: 'tok_card_expired',
  DECLINE_INVALID_CVC: 'tok_invalid_cvc',
  DECLINE_PROCESSING_ERROR: 'tok_processing_error',
  DECLINE_FRAUD: 'tok_fraud_detected',

  // Risk review scenarios
  RISK_REVIEW: 'tok_risk_review',
  RISK_HIGH: 'tok_high_risk',

  // 3DS / Action required
  REQUIRES_ACTION: 'tok_3ds_required',

  // Timeout (for testing async handling)
  TIMEOUT: 'tok_timeout',
} as const;

// Token to outcome mapping
const TOKEN_OUTCOMES: Record<string, UCPPaymentResult> = {
  // Success
  [MAGIC_TOKENS.SUCCESS]: {
    success: true,
    transaction_id: `txn_${Date.now()}_success`,
    risk_level: 'low',
  },
  [MAGIC_TOKENS.SUCCESS_VISA]: {
    success: true,
    transaction_id: `txn_${Date.now()}_visa`,
    risk_level: 'low',
  },
  [MAGIC_TOKENS.SUCCESS_MASTERCARD]: {
    success: true,
    transaction_id: `txn_${Date.now()}_mc`,
    risk_level: 'low',
  },
  [MAGIC_TOKENS.SUCCESS_AMEX]: {
    success: true,
    transaction_id: `txn_${Date.now()}_amex`,
    risk_level: 'low',
  },

  // Declines
  [MAGIC_TOKENS.DECLINE_GENERIC]: {
    success: false,
    error_code: 'card_declined',
    error_message: 'Your card was declined. Please try a different payment method.',
    risk_level: 'medium',
  },
  [MAGIC_TOKENS.DECLINE_INSUFFICIENT_FUNDS]: {
    success: false,
    error_code: 'insufficient_funds',
    error_message: 'Your card has insufficient funds. Please try a different card.',
    risk_level: 'low',
  },
  [MAGIC_TOKENS.DECLINE_CARD_EXPIRED]: {
    success: false,
    error_code: 'expired_card',
    error_message: 'Your card has expired. Please update your payment method.',
    risk_level: 'low',
  },
  [MAGIC_TOKENS.DECLINE_INVALID_CVC]: {
    success: false,
    error_code: 'invalid_cvc',
    error_message: 'The CVC code is incorrect. Please check and try again.',
    risk_level: 'low',
  },
  [MAGIC_TOKENS.DECLINE_PROCESSING_ERROR]: {
    success: false,
    error_code: 'processing_error',
    error_message: 'An error occurred while processing your payment. Please try again.',
    risk_level: 'low',
  },
  [MAGIC_TOKENS.DECLINE_FRAUD]: {
    success: false,
    error_code: 'fraud_detected',
    error_message: 'This transaction has been flagged for review. Please contact support.',
    risk_level: 'high',
  },

  // Risk review
  [MAGIC_TOKENS.RISK_REVIEW]: {
    success: true,
    transaction_id: `txn_${Date.now()}_review`,
    risk_level: 'medium',
  },
  [MAGIC_TOKENS.RISK_HIGH]: {
    success: false,
    error_code: 'high_risk',
    error_message: 'This transaction requires additional verification.',
    risk_level: 'high',
  },

  // 3DS required
  [MAGIC_TOKENS.REQUIRES_ACTION]: {
    success: false,
    requires_action: true,
    action_url: 'https://example.com/3ds-challenge',
    error_code: 'authentication_required',
    error_message: 'Additional authentication is required.',
  },

  // Timeout
  [MAGIC_TOKENS.TIMEOUT]: {
    success: false,
    error_code: 'timeout',
    error_message: 'Payment processing timed out. Please try again.',
  },
};

// ============================================================================
// Payment Processing
// ============================================================================

export interface ProcessPaymentOptions {
  checkout: UCPCheckout;
  paymentData: UCPPaymentData;
  riskSignals?: UCPRiskSignals;
}

/**
 * Process a payment request
 */
export async function processPayment(
  options: ProcessPaymentOptions
): Promise<UCPPaymentResult> {
  const { checkout, paymentData, riskSignals } = options;

  // Validate payment amount matches checkout total
  const paymentAmount = parseFloat(paymentData.amount.amount);
  const checkoutTotal = parseFloat(checkout.total.amount);

  if (Math.abs(paymentAmount - checkoutTotal) > 0.01) {
    throw new UCPException(
      UCP_ERROR_CODES.PAYMENT_FAILED,
      `Payment amount ($${paymentAmount}) does not match checkout total ($${checkoutTotal})`
    );
  }

  // Validate currency matches
  if (paymentData.amount.currency !== checkout.currency) {
    throw new UCPException(
      UCP_ERROR_CODES.PAYMENT_FAILED,
      `Payment currency (${paymentData.amount.currency}) does not match checkout currency (${checkout.currency})`
    );
  }

  // Simulate processing delay
  await simulateProcessingDelay(paymentData.token);

  // Check for magic token
  const magicOutcome = TOKEN_OUTCOMES[paymentData.token];
  if (magicOutcome) {
    // Generate fresh transaction ID for success cases
    if (magicOutcome.success) {
      return {
        ...magicOutcome,
        transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }
    return magicOutcome;
  }

  // For non-magic tokens, simulate realistic processing
  return simulateRealPayment(checkout, paymentData, riskSignals);
}

/**
 * Simulate processing delay based on token type
 */
async function simulateProcessingDelay(token: string): Promise<void> {
  let delay = 500; // Default 500ms

  if (token === MAGIC_TOKENS.TIMEOUT) {
    delay = 10000; // 10 seconds for timeout simulation
  } else if (token === MAGIC_TOKENS.REQUIRES_ACTION) {
    delay = 1000; // 1 second for 3DS
  } else if (token.startsWith('tok_risk')) {
    delay = 2000; // 2 seconds for risk checks
  }

  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Simulate realistic payment processing for non-magic tokens
 */
function simulateRealPayment(
  checkout: UCPCheckout,
  paymentData: UCPPaymentData,
  riskSignals?: UCPRiskSignals
): UCPPaymentResult {
  // Calculate risk score based on various factors
  let riskScore = 0;

  // High-value orders are riskier
  const orderValue = parseFloat(checkout.total.amount);
  if (orderValue > 500) riskScore += 20;
  if (orderValue > 1000) riskScore += 30;

  // New customers are riskier
  if (riskSignals?.is_new_customer) riskScore += 15;
  if (riskSignals?.previous_orders_count === 0) riskScore += 10;

  // Account age affects risk
  if (riskSignals?.account_age_days !== undefined) {
    if (riskSignals.account_age_days < 7) riskScore += 25;
    else if (riskSignals.account_age_days < 30) riskScore += 10;
  }

  // Determine outcome based on risk score
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore > 50) riskLevel = 'high';
  else if (riskScore > 25) riskLevel = 'medium';

  // High risk orders fail
  if (riskLevel === 'high' && Math.random() > 0.7) {
    return {
      success: false,
      error_code: 'high_risk',
      error_message: 'This transaction has been flagged for review.',
      risk_level: 'high',
    };
  }

  // Random decline rate (5%)
  if (Math.random() < 0.05) {
    return {
      success: false,
      error_code: 'card_declined',
      error_message: 'Your card was declined. Please try a different payment method.',
      risk_level: riskLevel,
    };
  }

  // Success!
  return {
    success: true,
    transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    risk_level: riskLevel,
  };
}

// ============================================================================
// Refund Processing
// ============================================================================

export interface RefundResult {
  success: boolean;
  refund_id?: string;
  error_code?: string;
  error_message?: string;
}

/**
 * Process a refund
 */
export async function processRefund(
  transactionId: string,
  amount: number,
  currency: string,
  reason?: string
): Promise<RefundResult> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Magic token for testing refund failures
  if (transactionId.includes('no_refund')) {
    return {
      success: false,
      error_code: 'refund_not_allowed',
      error_message: 'This transaction cannot be refunded.',
    };
  }

  // Success
  return {
    success: true,
    refund_id: `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate payment method type
 */
export function isValidPaymentMethod(
  method: string
): method is UCPPaymentData['method'] {
  return ['card', 'apple_pay', 'google_pay', 'paypal', 'bank_transfer'].includes(method);
}

/**
 * Get supported payment methods
 */
export function getSupportedPaymentMethods(): UCPPaymentData['method'][] {
  return ['card', 'apple_pay', 'google_pay', 'paypal'];
}

/**
 * Format card last 4 for display
 */
export function formatCardLast4(token: string): string {
  // Magic tokens return predictable last 4
  if (token === MAGIC_TOKENS.SUCCESS_VISA) return '4242';
  if (token === MAGIC_TOKENS.SUCCESS_MASTERCARD) return '5555';
  if (token === MAGIC_TOKENS.SUCCESS_AMEX) return '0005';

  // Random last 4 for other tokens
  return Math.floor(1000 + Math.random() * 9000).toString();
}
