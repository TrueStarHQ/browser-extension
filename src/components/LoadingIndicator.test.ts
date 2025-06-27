import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LoadingIndicator from './LoadingIndicator.svelte';

describe('LoadingIndicator', () => {
  it('should render loading indicator', () => {
    const { container } = render(LoadingIndicator);

    expect(container.querySelector('#truestar-loader')).toBeTruthy();
  });

  it('should display loading text', () => {
    const { getByText } = render(LoadingIndicator);

    expect(getByText('TrueStar Analysis')).toBeTruthy();
    expect(getByText(/Loading reviews from multiple pages/)).toBeTruthy();
  });
});
