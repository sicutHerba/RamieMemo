import '@testing-library/jest-dom'

// Set default test timeout to 10 seconds
jest.setTimeout(10000);

// Mock window.scrollTo since it's not implemented in jsdom
window.scrollTo = jest.fn();

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
