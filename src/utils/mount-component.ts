/**
 * Mounts a Svelte component with Shadow DOM isolation for browser extensions.
 * CSS is imported at build time using Vite's ?inline query.
 */

import type { Component } from 'svelte';
import { mount, unmount } from 'svelte';

import styles from '../assets/app.css?inline';
import { log } from './logger';

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
export function mountComponent<T extends Record<string, unknown>>(
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

    const shadowContainer = document.createElement('div');
    shadow.appendChild(shadowContainer);
    mountTarget = shadowContainer;

    try {
      if (
        typeof CSSStyleSheet !== 'undefined' &&
        'adoptedStyleSheets' in shadow
      ) {
        shadow.adoptedStyleSheets = [getSharedStyleSheet()];
      } else {
        throw new Error('Constructable Stylesheets not supported');
      }
    } catch {
      styleElement = document.createElement('style');
      styleElement.textContent = styles;
      shadow.insertBefore(styleElement, shadowContainer);
    }
  } else {
    log.warn('Shadow DOM not supported - styles may conflict with host page');
  }

  const componentInstance = mount(ComponentClass, {
    target: mountTarget,
    props,
  });

  return {
    destroy: () => {
      unmount(componentInstance);

      if (styleElement) {
        styleElement.remove();
      }

      if (!target && container.parentNode) {
        container.remove();
      }
    },
  };
}
