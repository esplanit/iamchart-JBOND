import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MtmScreen } from './MtmScreen.js';
import { dataService } from '../data/service.js';

const mockNavigate = vi.fn();
const mockPushContext = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

vi.mock('../store/appStore.js', () => ({
  useAppStore: () => ({ pushContext: mockPushContext }),
}));

vi.mock('../data/service.js', () => ({
  dataService: {
    getMtmMatrix: vi.fn(),
  },
}));

describe('MtmScreen', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(dataService.getMtmMatrix).mockResolvedValue([
      {
        rowKey: 'GOV',
        rowLabel: '국고채',
        tenorLabel: '3M',
        yield: 2.5,
        changeBp: 0.4,
        valueType: 'FINAL_QUOTE',
        qualityStatus: 'VALID',
        source: 'MOCK',
        valuationDate: '2026-07-23',
      },
    ] as never);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    mockNavigate.mockReset();
    mockPushContext.mockReset();
  });

  it('row header click navigates to the curve screen', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <MtmScreen />
        </MemoryRouter>,
      );
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(container.textContent).toContain('시가평가표'));

    const rowHead = container.querySelector('[data-testid="mtm-row-head"]') as HTMLElement;
    expect(rowHead).not.toBeNull();

    await act(async () => {
      rowHead.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/curve');
  });
});
