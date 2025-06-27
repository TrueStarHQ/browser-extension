/**
 * Mounts a Svelte component with Shadow DOM isolation for browser extensions.
 * TODO: Build process to automatically extract and inject compiled CSS
 */

import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';
import { getComponentStyles } from './get-component-styles';
export function mountComponent<T extends Record<string, any>>(
  ComponentClass: Component<T>,
  props: T,
  target?: HTMLElement
): { destroy: () => void } {
  const container = target || document.createElement('div');
  let mountTarget: HTMLElement | ShadowRoot = container;
  let styleElement: HTMLStyleElement | null = null;

  if (!target) {
    document.body.appendChild(container);
  }

  // Set up Shadow DOM for style isolation
  if (typeof container.attachShadow === 'function') {
    const shadow = container.attachShadow({ mode: 'open' });

    // Svelte needs a regular element, not the shadow root itself
    const shadowContainer = document.createElement('div');
    shadow.appendChild(shadowContainer);
    mountTarget = shadowContainer;

    // Inject styles into shadow DOM
    styleElement = document.createElement('style');
    styleElement.textContent = getComponentStyles();
    shadow.insertBefore(styleElement, shadowContainer);
  } else {
    console.warn(
      'Shadow DOM not supported - styles may conflict with host page'
    );
  }

  const instance = mount(ComponentClass, {
    target: mountTarget,
    props,
  });

  return {
    destroy: () => {
      unmount(instance);
      if (styleElement) {
        styleElement.remove();
      }
      if (!target && container.parentElement) {
        container.remove();
      }
    },
  };
}
