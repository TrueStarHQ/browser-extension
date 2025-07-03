import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mountComponent } from './mount-component';

// Mock Svelte mount/unmount functions
vi.mock('svelte', () => ({
  mount: vi.fn(() => ({ component: 'mocked' })),
  unmount: vi.fn(),
}));

// Mock the CSS import
vi.mock('../assets/app.css?inline', () => ({
  default: 'mocked styles',
}));

// Simple test component
const TestComponent = {} as any;

describe('mountComponent', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clean up any elements added to body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
  });

  it('should create and mount a component with default container', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    // Should create a container and append to body
    expect(document.body.children.length).toBe(1);
    const container = document.body.children[0] as HTMLElement;
    expect(container.tagName).toBe('DIV');

    // Should always use shadow DOM
    expect(container.shadowRoot).toBeTruthy();
    expect(container.shadowRoot!.mode).toBe('open');

    // Should have mounted the component
    expect(mount).toHaveBeenCalledWith(TestComponent, {
      target: expect.any(HTMLElement),
      props,
    });

    // Should return object with destroy function
    expect(result).toHaveProperty('destroy');
    expect(typeof result.destroy).toBe('function');
  });

  it('should use provided target element', () => {
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);

    const props = { test: 'value' };
    mountComponent(TestComponent, props, targetElement);

    // Should not create a new container
    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0]).toBe(targetElement);

    // Should still use shadow DOM
    expect(targetElement.shadowRoot).toBeTruthy();
  });

  it('should inject styles into shadow DOM', () => {
    const props = { test: 'value' };
    mountComponent(TestComponent, props);

    const container = document.body.children[0] as HTMLElement;
    const shadowRoot = container.shadowRoot!;

    // Should have style element as first child
    const styleElement = shadowRoot.firstElementChild as HTMLStyleElement;
    expect(styleElement.tagName).toBe('STYLE');
    expect(styleElement.textContent).toBe('mocked styles');
  });

  it('should properly destroy component and clean up', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    // Verify container was added
    expect(document.body.children.length).toBe(1);

    // Call destroy
    result.destroy();

    // Should unmount the component
    expect(unmount).toHaveBeenCalled();

    // Should remove container from DOM
    expect(document.body.children.length).toBe(0);
  });

  it('should not remove custom target on destroy', () => {
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);

    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props, targetElement);

    result.destroy();

    // Should unmount but not remove the target element
    expect(unmount).toHaveBeenCalled();
    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0]).toBe(targetElement);
  });

  it('should handle browsers that do not support shadow DOM', () => {
    // Create container element without attachShadow
    const container = document.createElement('div');
    Object.defineProperty(container, 'attachShadow', {
      value: undefined,
      configurable: true,
    });

    document.body.appendChild(container);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const props = { test: 'value' };
    mountComponent(TestComponent, props, container);

    // Should warn about lack of Shadow DOM support
    expect(consoleSpy).toHaveBeenCalledWith(
      'TrueStar: Shadow DOM not supported - styles may conflict with host page'
    );

    // Should fall back to regular mounting without shadow DOM
    expect(container.shadowRoot).toBeFalsy();
    expect(mount).toHaveBeenCalledWith(TestComponent, {
      target: container,
      props,
    });

    consoleSpy.mockRestore();

    // Clean up
    container.remove();
  });

  it('should properly clean up style element on destroy', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    const container = document.body.children[0] as HTMLElement;
    const shadowRoot = container.shadowRoot!;
    const styleElement = shadowRoot.querySelector('style');

    expect(styleElement).toBeTruthy();

    result.destroy();

    // Style element should be removed (along with the entire container)
    expect(document.body.children.length).toBe(0);
  });
});
