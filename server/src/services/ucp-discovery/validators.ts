/**
 * UCP Profile & Agent Card Validators
 *
 * Two-layer validation:
 * 1. Structural validation (fast) - JSON structure and required fields
 * 2. Semantic validation (strict) - Business logic and spec compliance
 */

import { z } from 'zod';
import {
  ValidationResult,
  ValidationSeverity,
  VALIDATION_CODES,
  UCPProfileSnapshot,
  UCPServices,
  UCPCapability,
  AgentCardSnapshot,
  AgentInterface,
  AgentCapabilities,
  AgentExtensions,
  AgentSkill,
} from './types.js';

// ============================================================================
// Zod Schemas for Structural Validation
// ============================================================================

const UCPCapabilitySchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  spec: z.string().optional(),
  schema: z.string().optional(),
  extends: z.string().optional(),
});

const UCPServiceSchema = z.object({
  version: z.string(),
  spec: z.string().optional(),
  a2a: z.object({
    endpoint: z.string().url(),
  }).optional(),
  rest: z.object({
    endpoint: z.string().url(),
  }).optional(),
  mcp: z.object({
    endpoint: z.string().url(),
  }).optional(),
});

const UCPProfileSchema = z.object({
  ucp: z.object({
    version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Version must be YYYY-MM-DD format'),
    services: z.record(z.string(), UCPServiceSchema),
    capabilities: z.array(UCPCapabilitySchema).optional(),
  }),
  payment: z.unknown().optional(),
  signing_keys: z.array(z.unknown()).optional(),
});

const AgentExtensionSchema = z.object({
  uri: z.string().url(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

const AgentSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  inputModes: z.array(z.string()).optional(),
  outputModes: z.array(z.string()).optional(),
});

const AgentCardSchema = z.object({
  protocolVersions: z.array(z.string()).optional(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  provider: z.object({
    organization: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  supportedInterfaces: z.array(z.object({
    url: z.string().url(),
    protocolBinding: z.string(),
  })).optional(),
  capabilities: z.object({
    streaming: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    stateTransitionHistory: z.boolean().optional(),
    extendedAgentCard: z.boolean().optional(),
    extensions: z.array(AgentExtensionSchema).optional(),
  }).optional(),
  extensions: z.object({
    ucp: z.object({
      version: z.string(),
      capabilities: z.array(UCPCapabilitySchema).optional(),
      features: z.record(z.string(), z.boolean()).optional(),
    }).optional(),
  }).optional(),
  skills: z.array(AgentSkillSchema).optional(),
});

// ============================================================================
// Validation Result Builder
// ============================================================================

function createValidationResult(
  merchantId: string,
  target: 'ucp_profile' | 'agent_card',
  severity: ValidationSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>
): ValidationResult {
  return {
    id: `val-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    merchantId,
    fetchedAt: new Date().toISOString(),
    target,
    severity,
    code,
    message,
    details,
  };
}

// ============================================================================
// UCP Profile Validator
// ============================================================================

export interface UCPValidationResult {
  isValid: boolean;
  profile?: UCPProfileSnapshot;
  results: ValidationResult[];
}

export function validateUCPProfile(
  merchantId: string,
  json: unknown
): UCPValidationResult {
  const results: ValidationResult[] = [];

  // Check if it's valid JSON object
  if (!json || typeof json !== 'object') {
    results.push(createValidationResult(
      merchantId,
      'ucp_profile',
      'error',
      VALIDATION_CODES.NOT_JSON,
      'Response is not a valid JSON object'
    ));
    return { isValid: false, results };
  }

  // Structural validation with Zod
  const parseResult = UCPProfileSchema.safeParse(json);

  if (!parseResult.success) {
    // Map Zod errors to validation results
    for (const error of parseResult.error.errors) {
      const path = error.path.join('.');
      let code: string = VALIDATION_CODES.NOT_JSON;
      let severity: ValidationSeverity = 'error';

      // Map specific paths to codes
      if (path === 'ucp' || path.startsWith('ucp.')) {
        if (path === 'ucp') code = VALIDATION_CODES.MISSING_UCP;
        else if (path === 'ucp.version') code = VALIDATION_CODES.MISSING_VERSION;
        else if (path === 'ucp.services') code = VALIDATION_CODES.MISSING_SERVICES;
      } else if (path === 'payment') {
        code = VALIDATION_CODES.MISSING_PAYMENT;
        severity = 'warn';
      } else if (path === 'signing_keys') {
        code = VALIDATION_CODES.MISSING_SIGNING_KEYS;
        severity = 'warn';
      }

      results.push(createValidationResult(
        merchantId,
        'ucp_profile',
        severity,
        code,
        `${error.message} at ${path}`,
        { path, zodError: error }
      ));
    }

    // Check if there are any errors (not just warnings)
    const hasErrors = results.some(r => r.severity === 'error');
    if (hasErrors) {
      return { isValid: false, results };
    }
  }

  const data = json as z.infer<typeof UCPProfileSchema>;

  // Semantic validation
  const semanticResults = validateUCPSemantics(merchantId, data);
  results.push(...semanticResults);

  // Check for hard errors
  const hasHardErrors = results.some(r => r.severity === 'error');
  if (hasHardErrors) {
    return { isValid: false, results };
  }

  // Build profile snapshot
  const profile = buildProfileSnapshot(merchantId, data);

  return { isValid: true, profile, results };
}

function validateUCPSemantics(
  merchantId: string,
  data: z.infer<typeof UCPProfileSchema>
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const UCP_SHOPPING_NAMESPACE = 'dev.ucp.shopping';

  // Check for shopping service
  const shoppingService = data.ucp.services[UCP_SHOPPING_NAMESPACE];
  if (!shoppingService) {
    results.push(createValidationResult(
      merchantId,
      'ucp_profile',
      'warn',
      VALIDATION_CODES.NO_SHOPPING_SERVICE,
      `No ${UCP_SHOPPING_NAMESPACE} service found`
    ));
  } else {
    // Check for at least one transport
    const hasTransport = shoppingService.a2a || shoppingService.rest || shoppingService.mcp;
    if (!hasTransport) {
      results.push(createValidationResult(
        merchantId,
        'ucp_profile',
        'warn',
        VALIDATION_CODES.MISSING_A2A_ENDPOINT,
        'Shopping service has no transport endpoints (a2a, rest, or mcp)'
      ));
    }
  }

  // Check for payment section (warning only)
  if (!data.payment) {
    results.push(createValidationResult(
      merchantId,
      'ucp_profile',
      'warn',
      VALIDATION_CODES.MISSING_PAYMENT,
      'No payment section found'
    ));
  }

  // Check for signing keys (warning only)
  if (!data.signing_keys || !Array.isArray(data.signing_keys) || data.signing_keys.length === 0) {
    results.push(createValidationResult(
      merchantId,
      'ucp_profile',
      'warn',
      VALIDATION_CODES.MISSING_SIGNING_KEYS,
      'No signing keys found'
    ));
  }

  // Check capabilities for checkout capability
  const capabilities = data.ucp.capabilities || [];
  const hasCheckout = capabilities.some(c => c.name === 'dev.ucp.shopping.checkout');
  if (!hasCheckout && shoppingService) {
    results.push(createValidationResult(
      merchantId,
      'ucp_profile',
      'info',
      'UCP_NO_CHECKOUT_CAPABILITY',
      'No dev.ucp.shopping.checkout capability declared'
    ));
  }

  // Validate capability extends references
  for (const cap of capabilities) {
    if (cap.extends) {
      const parentExists = capabilities.some(c => c.name === cap.extends);
      if (!parentExists) {
        results.push(createValidationResult(
          merchantId,
          'ucp_profile',
          'warn',
          'UCP_MISSING_PARENT_CAPABILITY',
          `Capability ${cap.name} extends ${cap.extends} which is not declared`,
          { capability: cap.name, extends: cap.extends }
        ));
      }
    }
  }

  return results;
}

function buildProfileSnapshot(
  merchantId: string,
  data: z.infer<typeof UCPProfileSchema>
): UCPProfileSnapshot {
  const UCP_SHOPPING_NAMESPACE = 'dev.ucp.shopping';
  const shoppingService = data.ucp.services[UCP_SHOPPING_NAMESPACE];

  // Convert Zod services to UCPServices (handle version requirement)
  const services: UCPServices = {};
  for (const [namespace, service] of Object.entries(data.ucp.services)) {
    if (service.version) {
      services[namespace] = {
        version: service.version,
        spec: service.spec,
        a2a: service.a2a ? { endpoint: service.a2a.endpoint } : undefined,
        rest: service.rest ? { endpoint: service.rest.endpoint } : undefined,
        mcp: service.mcp ? { endpoint: service.mcp.endpoint } : undefined,
      };
    }
  }

  return {
    merchantId,
    ucpVersion: data.ucp.version,
    services,
    capabilities: (data.ucp.capabilities || []) as UCPCapability[],
    payment: data.payment,
    signingKeys: data.signing_keys,
    hasA2A: !!shoppingService?.a2a,
    a2aAgentCardUrl: shoppingService?.a2a?.endpoint,
    restEndpoint: shoppingService?.rest?.endpoint,
    mcpEndpoint: shoppingService?.mcp?.endpoint,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Agent Card Validator
// ============================================================================

export interface AgentCardValidationResult {
  isValid: boolean;
  agentCard?: AgentCardSnapshot;
  results: ValidationResult[];
}

const UCP_EXTENSION_URI_PATTERN = /^https:\/\/ucp\.dev\/specification\/reference/;

export function validateAgentCard(
  merchantId: string,
  json: unknown
): AgentCardValidationResult {
  const results: ValidationResult[] = [];

  // Check if it's valid JSON object
  if (!json || typeof json !== 'object') {
    results.push(createValidationResult(
      merchantId,
      'agent_card',
      'error',
      VALIDATION_CODES.NOT_JSON,
      'Agent card is not a valid JSON object'
    ));
    return { isValid: false, results };
  }

  // Structural validation with Zod
  const parseResult = AgentCardSchema.safeParse(json);

  if (!parseResult.success) {
    for (const error of parseResult.error.errors) {
      results.push(createValidationResult(
        merchantId,
        'agent_card',
        'warn',
        'A2A_STRUCTURAL_ERROR',
        `${error.message} at ${error.path.join('.')}`,
        { zodError: error }
      ));
    }
  }

  const data = json as z.infer<typeof AgentCardSchema>;

  // Check for UCP extension
  const extensions = data.capabilities?.extensions || [];
  const hasUCPExtension = extensions.some(ext =>
    UCP_EXTENSION_URI_PATTERN.test(ext.uri)
  );

  if (!hasUCPExtension) {
    results.push(createValidationResult(
      merchantId,
      'agent_card',
      'warn',
      VALIDATION_CODES.AGENT_MISSING_UCP_EXTENSION,
      'Agent card does not advertise UCP extension URI'
    ));
  }

  // Check for UCP extension details
  if (!data.extensions?.ucp) {
    results.push(createValidationResult(
      merchantId,
      'agent_card',
      'info',
      'A2A_NO_UCP_EXTENSION_DETAILS',
      'Agent card has no extensions.ucp section'
    ));
  }

  // Build agent card snapshot
  const agentCard = buildAgentCardSnapshot(merchantId, data);

  return { isValid: true, agentCard, results };
}

function buildAgentCardSnapshot(
  merchantId: string,
  data: z.infer<typeof AgentCardSchema>
): AgentCardSnapshot {
  // Convert supportedInterfaces (ensure required fields)
  const supportedInterfaces: AgentInterface[] = (data.supportedInterfaces || [])
    .filter((iface): iface is { url: string; protocolBinding: string } =>
      !!iface.url && !!iface.protocolBinding
    )
    .map(iface => ({
      url: iface.url,
      protocolBinding: iface.protocolBinding,
    }));

  // Build capabilities with proper typing
  const capabilities: AgentCapabilities = {
    streaming: data.capabilities?.streaming,
    pushNotifications: data.capabilities?.pushNotifications,
    stateTransitionHistory: data.capabilities?.stateTransitionHistory,
    extendedAgentCard: data.capabilities?.extendedAgentCard,
    extensions: (data.capabilities?.extensions || [])
      .filter((ext): ext is { uri: string; description?: string; required?: boolean } => !!ext.uri)
      .map(ext => ({
        uri: ext.uri,
        description: ext.description,
        required: ext.required,
      })),
  };

  // Build extensions with proper typing
  const extensions: AgentExtensions = {};
  if (data.extensions?.ucp && data.extensions.ucp.version) {
    extensions.ucp = {
      version: data.extensions.ucp.version,
      capabilities: (data.extensions.ucp.capabilities || [])
        .filter((cap): cap is { name: string; version: string; description?: string; spec?: string; schema?: string; extends?: string } =>
          !!cap.name && !!cap.version
        )
        .map(cap => ({
          name: cap.name,
          version: cap.version,
          description: cap.description,
          spec: cap.spec,
          schema: cap.schema,
          extends: cap.extends,
        })),
      features: data.extensions.ucp.features,
    };
  }

  // Build skills with proper typing
  const skills: AgentSkill[] = (data.skills || [])
    .filter((skill): skill is { id: string; name: string; description?: string; tags?: string[]; examples?: string[]; inputModes?: string[]; outputModes?: string[] } =>
      !!skill.id && !!skill.name
    )
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      tags: skill.tags,
      examples: skill.examples,
      inputModes: skill.inputModes,
      outputModes: skill.outputModes,
    }));

  return {
    merchantId,
    name: data.name,
    description: data.description,
    version: data.version,
    protocolVersions: data.protocolVersions || ['1.0'],
    supportedInterfaces,
    capabilities,
    extensions,
    skills,
    updatedAt: new Date().toISOString(),
  };
}
