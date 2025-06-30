/**
 * Mounts a Svelte component with Shadow DOM isolation for browser extensions.
 * CSS is imported at build time using Vite's ?inline query.
 */

import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';

// Import the compiled CSS as a string at build time
// postcss-import will process @import statements
import styles from '../assets/app.css?inline';
import { log } from './logger';

// Singleton CSSStyleSheet instance shared across all Shadow DOM instances
let sharedStyleSheet: CSSStyleSheet | null = null;

/**
 * Gets or creates a shared CSSStyleSheet
 */
function getSharedStyleSheet(): CSSStyleSheet {
  if (!sharedStyleSheet) {
    sharedStyleSheet = new CSSStyleSheet();
    sharedStyleSheet.replaceSync(styles);
  }

  return sharedStyleSheet;
}

/**
 * Mounts a Svelte component with Shadow DOM isolation.
 * @returns Object with destroy method for cleanup
 */
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

  if (typeof container.attachShadow === 'function') {
    const shadow = container.attachShadow({ mode: 'open' });

    // Svelte needs a regular element, not the shadow root itself
    const shadowContainer = document.createElement('div');
    shadowContainer.className = 'shadow-root';
    shadow.appendChild(shadowContainer);
    mountTarget = shadowContainer;

    // Apply styles - try Constructable Stylesheets first, with a fallback to style element
    try {
      // Check if browser supports Constructable Stylesheets on ShadowRoot
      if (
        typeof CSSStyleSheet !== 'undefined' &&
        'adoptedStyleSheets' in shadow
      ) {
        shadow.adoptedStyleSheets = [getSharedStyleSheet()];
      } else {
        throw new Error('Constructable Stylesheets not supported');
      }
    } catch {
      // Fallback to style element for any errors or unsupported browsers
      styleElement = document.createElement('style');
      styleElement.textContent = styles;
      shadow.insertBefore(styleElement, shadowContainer);
    }
  } else {
    log.warn('Shadow DOM not supported - styles may conflict with host page');
  }

  // Mount the Svelte component
  const componentInstance = mount(ComponentClass, {
    target: mountTarget,
    props,
  });

  // Return an object with a cleanup function
  return {
    destroy: () => {
      unmount(componentInstance);

      if (styleElement) {
        styleElement.remove();
      }

      if (!target && container.parentNode) {
        // We created the container, so we need to remove it
        container.remove();
      }
    },
  };
}
