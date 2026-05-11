import '@testing-library/jest-dom/vitest'

// jsdom does not implement ResizeObserver — polyfill for components that use it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
