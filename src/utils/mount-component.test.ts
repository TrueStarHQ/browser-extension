import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mountComponent } from './mount-component';

vi.mock('svelte', () => ({
  mount: vi.fn(() => ({ component: 'mocked' })),
  unmount: vi.fn(),
}));

vi.mock('../assets/app.css?inline', () => ({
  default: 'mocked styles',
}));

const TestComponent = {} as any;

describe('mountComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates and mounts a component with default container', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    expect(document.body.children.length).toBe(1);
    const container = document.body.children[0] as HTMLElement;
    expect(container.tagName).toBe('DIV');

    expect(container.shadowRoot).toBeTruthy();
    expect(container.shadowRoot!.mode).toBe('open');

    expect(mount).toHaveBeenCalledWith(TestComponent, {
      target: expect.any(HTMLElement),
      props,
    });

    expect(result).toHaveProperty('destroy');
    expect(typeof result.destroy).toBe('function');
  });

  it('uses provided target element', () => {
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);

    const props = { test: 'value' };
    mountComponent(TestComponent, props, targetElement);

    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0]).toBe(targetElement);

    expect(targetElement.shadowRoot).toBeTruthy();
  });

  it('injects styles into shadow DOM', () => {
    const props = { test: 'value' };
    mountComponent(TestComponent, props);

    const container = document.body.children[0] as HTMLElement;
    const shadowRoot = container.shadowRoot!;

    const styleElement = shadowRoot.firstElementChild as HTMLStyleElement;
    expect(styleElement.tagName).toBe('STYLE');
    expect(styleElement.textContent).toBe('mocked styles');
  });

  it('properly destroys component and cleans up', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    expect(document.body.children.length).toBe(1);

    result.destroy();

    expect(unmount).toHaveBeenCalled();

    expect(document.body.children.length).toBe(0);
  });

  it('does not remove custom target on destroy', () => {
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);

    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props, targetElement);

    result.destroy();

    expect(unmount).toHaveBeenCalled();
    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0]).toBe(targetElement);
  });

  it('handles browsers that do not support shadow DOM', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'attachShadow', {
      value: undefined,
      configurable: true,
    });

    document.body.appendChild(container);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const props = { test: 'value' };
    mountComponent(TestComponent, props, container);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[TrueStar] Shadow DOM not supported - styles may conflict with host page'
    );

    expect(container.shadowRoot).toBeFalsy();
    expect(mount).toHaveBeenCalledWith(TestComponent, {
      target: container,
      props,
    });

    consoleSpy.mockRestore();
    container.remove();
  });

  it('properly cleans up style element on destroy', () => {
    const props = { test: 'value' };
    const result = mountComponent(TestComponent, props);

    const container = document.body.children[0] as HTMLElement;
    const shadowRoot = container.shadowRoot!;
    const styleElement = shadowRoot.querySelector('style');

    expect(styleElement).toBeTruthy();

    result.destroy();

    expect(document.body.children.length).toBe(0);
  });
});
