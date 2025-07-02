import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import AnalysisPanel from './AnalysisPanel.svelte';

describe('AnalysisPanel', () => {
  it('should render the component', () => {
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

  it('should display fake review score correctly', () => {
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

  it('should display confidence level', () => {
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

  it('should display summary', () => {
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

  it('should call onClose when close button is clicked', () => {
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
    it('should handle null summary gracefully', () => {
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

    it('should handle undefined summary gracefully', () => {
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

    it('should handle empty string summary', () => {
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

    it('should handle missing reasons array', () => {
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

      // Should not show red flags section when reasons is null
      expect(container.querySelector('details')).toBeFalsy();
    });

    it('should handle missing flags array', () => {
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

      // Should not show red flags section when flags is null
      expect(container.querySelector('details')).toBeFalsy();
    });

    it('should display red flags when both arrays have items', () => {
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

    it('should handle confidence value of 0', () => {
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

      expect(getByText('100%')).toBeTruthy(); // 0% confidence it's fake = 100% confidence it's real
      expect(getByText('Confidence: 0%')).toBeTruthy();
    });

    it('should handle confidence value of 1', () => {
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

    it('should not render close button when onClose is not provided', () => {
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

    it('should handle arrays with empty strings', () => {
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

      // Should render all items including empty strings
      const listItems = getAllByRole('listitem');
      expect(listItems.length).toBe(6);
    });
  });
});
