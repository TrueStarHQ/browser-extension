import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import AnalysisPanel from './AnalysisPanel.svelte';

describe('AnalysisPanel', () => {
  it('renders the component', () => {
    const { container } = render(AnalysisPanel, {
      props: {
        analysis: {
          isFake: true,
          confidence: 0.85,
          summary: 'Test summary',
          reasons: [],
          flags: [],
        },
      },
    });

    expect(container.querySelector('#truestar-panel')).toBeTruthy();
  });

  it('displays fake review score correctly', () => {
    const { getByText } = render(AnalysisPanel, {
      props: {
        analysis: {
          isFake: true,
          confidence: 0.85,
          summary: 'Test summary',
          reasons: [],
          flags: [],
        },
      },
    });

    expect(getByText('85%')).toBeTruthy();
  });

  it('displays confidence level', () => {
    const { getByText } = render(AnalysisPanel, {
      props: {
        analysis: {
          isFake: true,
          confidence: 0.85,
          summary: 'Test summary',
          reasons: [],
          flags: [],
        },
      },
    });

    expect(getByText(/Confidence: 85%/)).toBeTruthy();
  });

  it('displays summary', () => {
    const { getByText } = render(AnalysisPanel, {
      props: {
        analysis: {
          isFake: true,
          confidence: 0.85,
          summary: 'This product has suspicious review patterns',
          reasons: [],
          flags: [],
        },
      },
    });

    expect(
      getByText('This product has suspicious review patterns')
    ).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { getByRole } = render(AnalysisPanel, {
      props: {
        analysis: {
          isFake: true,
          confidence: 0.85,
          summary: 'Test summary',
          reasons: [],
          flags: [],
        },
        onClose,
      },
    });

    const closeButton = getByRole('button', { name: /close/i });
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  describe('Edge Cases', () => {
    it('displays fallback text for null summary', () => {
      const { getByText } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: false,
            confidence: 0.5,
            summary: null as any,
            reasons: [],
            flags: [],
          },
        },
      });

      expect(getByText('No analysis available')).toBeTruthy();
    });

    it('displays fallback text for undefined summary', () => {
      const { getByText } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: false,
            confidence: 0.5,
            summary: undefined as any,
            reasons: [],
            flags: [],
          },
        },
      });

      expect(getByText('No analysis available')).toBeTruthy();
    });

    it('displays fallback text for empty summary', () => {
      const { getByText } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: false,
            confidence: 0.5,
            summary: '',
            reasons: [],
            flags: [],
          },
        },
      });

      expect(getByText('No analysis available')).toBeTruthy();
    });

    it('hides red flags section when reasons is null', () => {
      const { container } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: true,
            confidence: 0.85,
            summary: 'Test',
            reasons: null as any,
            flags: [],
          },
        },
      });

      expect(container.querySelector('details')).toBeFalsy();
    });

    it('hides red flags section when flags is null', () => {
      const { container } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: true,
            confidence: 0.85,
            summary: 'Test',
            reasons: [],
            flags: null as any,
          },
        },
      });

      expect(container.querySelector('details')).toBeFalsy();
    });

    it('displays red flags when both arrays have items', () => {
      const { getByText, getAllByRole } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: true,
            confidence: 0.85,
            summary: 'Test',
            reasons: ['Reason 1', 'Reason 2'],
            flags: ['Flag 1', 'Flag 2'],
          },
        },
      });

      expect(getByText('Red Flags (4)')).toBeTruthy();
      const listItems = getAllByRole('listitem');
      expect(listItems.length).toBe(4);
    });

    it('displays 100% real score for 0 confidence fake', () => {
      const { getByText } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: false,
            confidence: 0,
            summary: 'Test',
            reasons: [],
            flags: [],
          },
        },
      });

      expect(getByText('100%')).toBeTruthy();
      expect(getByText('Confidence: 0%')).toBeTruthy();
    });

    it('displays 100% fake score for confidence of 1', () => {
      const { getByText } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: true,
            confidence: 1,
            summary: 'Test',
            reasons: [],
            flags: [],
          },
        },
      });

      expect(getByText('100%')).toBeTruthy();
      expect(getByText('Confidence: 100%')).toBeTruthy();
    });

    it('hides close button when onClose is not provided', () => {
      const { queryByRole } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: false,
            confidence: 0.5,
            summary: 'Test',
            reasons: [],
            flags: [],
          },
        },
      });

      const closeButton = queryByRole('button', { name: /close/i });
      expect(closeButton).toBeFalsy();
    });

    it('renders all items including empty strings', () => {
      const { getAllByRole } = render(AnalysisPanel, {
        props: {
          analysis: {
            isFake: true,
            confidence: 0.85,
            summary: 'Test',
            reasons: ['Valid reason', '', 'Another reason'],
            flags: ['', 'Valid flag', ''],
          },
        },
      });

      const listItems = getAllByRole('listitem');
      expect(listItems.length).toBe(6);
    });
  });
});
