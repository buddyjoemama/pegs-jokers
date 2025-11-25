require('@testing-library/jest-dom');
require('whatwg-fetch');

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }], this);
  }
  unobserve() {}
  disconnect() {}
};

// Mock Firebase for testing
jest.mock('@/lib/firebase', () => ({
  database: {},
  app: {},
}));