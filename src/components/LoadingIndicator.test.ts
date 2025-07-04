import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import LoadingIndicator from './LoadingIndicator.svelte';

describe('LoadingIndicator', () => {
  it('renders loading indicator', () => {
    const { container } = render(LoadingIndicator);

    expect(container.querySelector('#truestar-loader')).toBeTruthy();
  });

  it('displays loading text', () => {
    const { getByText } = render(LoadingIndicator);

    expect(getByText('TrueStar Analysis')).toBeTruthy();
    expect(getByText(/Loading reviews from multiple pages/)).toBeTruthy();
  });
});
