import { beforeEach, afterEach, vi } from 'vitest';

// Global test setup
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();
});

afterEach(() => {
	// Restore console methods
	vi.restoreAllMocks();
});

// Global fetch mock - used by all tests
// Individual tests can override with: globalThis.fetch = vi.fn().mockResolvedValue(...)
globalThis.fetch = vi.fn(); 