import { render } from '@testing-library/svelte';
import type { CheckAmazonProductResponse } from '@truestarhq/shared-types';
import { describe, expect, it, vi } from 'vitest';

import AnalysisPanel from './AnalysisPanel.svelte';

const createMockAnalysis = (
  trustScore: number,
  overrides: Partial<CheckAmazonProductResponse> = {}
): CheckAmazonProductResponse => ({
  timestamp: '2024-01-01T00:00:00Z',
  summary: { trustScore },
  metrics: { analyzed: 10, total: 20 },
  ...overrides,
});

describe('AnalysisPanel', () => {
  it('renders the component', () => {
    const { container } = render(AnalysisPanel, {
      props: {
        analysis: createMockAnalysis(15),
      },
    });

    expect(container.querySelector('#truestar-panel')).toBeTruthy();
  });

  it('displays default message when no error', () => {
    const { getByText } = render(AnalysisPanel, {
      props: {
        analysis: createMockAnalysis(85),
      },
    });

    expect(getByText('Analysis complete')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(AnalysisPanel, {
      props: {
        analysis: createMockAnalysis(0),
        errorMessage: 'Analysis service unavailable',
      },
    });

    expect(getByText('Analysis service unavailable')).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { getByRole } = render(AnalysisPanel, {
      props: {
        analysis: createMockAnalysis(50),
        onClose,
      },
    });

    const closeButton = getByRole('button', { name: /close/i });
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('hides close button when onClose is not provided', () => {
    const { queryByRole } = render(AnalysisPanel, {
      props: {
        analysis: createMockAnalysis(50),
      },
    });

    const closeButton = queryByRole('button', { name: /close/i });
    expect(closeButton).toBeFalsy();
  });

  // TODO: Add more comprehensive tests once the UI design is finalized
  // These will include:
  // - Trust score display and color coding
  // - Review metrics visualization
  // - Flag/issue display
  // - Interactive elements
});
