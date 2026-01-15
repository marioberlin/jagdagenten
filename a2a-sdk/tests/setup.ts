/**
 * Test setup file
 * Initializes the test environment
 */

// Mock crypto for tests
(global as any).crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
};

// Setup console for tests
global.console = {
  ...console,
  // Uncomment to silence console during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
