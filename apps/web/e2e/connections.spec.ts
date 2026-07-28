import { test, expect } from '@playwright/test';

test.describe('콘텐츠 연결 (BondContext 전달)', () => {
  test('발행정보 → 유통정보', async ({ page }) => {
    await page.goto('/issue');
    await expect(page.getByTestId('issue-screen')).toBeVisible();
    await page.getByTestId('btn-distribution').click();
    await expect(page.getByTestId('distribution-screen')).toBeVisible();
  });

  test('발행정보 → 투자 시뮬레이션', async ({ page }) => {
    await page.goto('/issue');
    await page.getByTestId('btn-simulation').click();
    await expect(page.getByTestId('simulation-screen')).toBeVisible();
    await expect(page.getByTestId('sim-results')).toBeVisible();
  });

  test('유통정보 선택일 → 시뮬레이션', async ({ page }) => {
    await page.goto('/distribution');
    await expect(page.getByTestId('distribution-screen')).toBeVisible();
    await expect(page.getByTestId('picked-card')).toBeVisible();
    await page.getByTestId('btn-calc-from-yield').click();
    await expect(page.getByTestId('simulation-screen')).toBeVisible();
  });

  test('시가평가표 → 수익률곡선', async ({ page }) => {
    await page.goto('/mtm');
    await expect(page.getByTestId('mtm-screen')).toBeVisible();
    // 첫 데이터 셀 클릭 (국고채 3M)
    await page.locator('[data-testid="mtm-grid"] tbody tr:first-child td:first-of-type').click();
    await page.getByTestId('btn-to-curve').click();
    await expect(page.getByTestId('curve-screen')).toBeVisible();
  });

  test('시가평가표 셀 → 시뮬레이션', async ({ page }) => {
    await page.goto('/mtm');
    await page.locator('[data-testid="mtm-grid"] tbody tr:first-child td:first-of-type').click();
    await page.getByTestId('btn-to-sim').click();
    await expect(page.getByTestId('simulation-screen')).toBeVisible();
  });

  test('하단 5개 메뉴 이동', async ({ page }) => {
    await page.goto('/issue');
    for (const [label, testid] of [
      ['곡선', 'curve-screen'],
      ['유통', 'distribution-screen'],
      ['투자', 'simulation-screen'],
      ['시가표', 'mtm-screen'],
      ['발행', 'issue-screen'],
    ] as const) {
      await page.getByRole('link', { name: label }).click();
      await expect(page.getByTestId(testid)).toBeVisible();
    }
  });

  test('기본 랜딩은 시가평가표', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('mtm-screen')).toBeVisible();
  });

  test('시가표 행(종류) → 수익률곡선', async ({ page }) => {
    await page.goto('/mtm');
    await expect(page.getByTestId('mtm-screen')).toBeVisible();
    await page.getByTestId('mtm-row-head').first().click();
    await expect(page.getByTestId('curve-screen')).toBeVisible();
  });

  test('시가표 셀 → 구간 종목 리스트', async ({ page }) => {
    await page.goto('/mtm');
    await page.locator('[data-testid="mtm-grid"] tbody tr:first-child td:first-of-type').click();
    await page.getByTestId('btn-segment-list').click();
    await expect(page.getByTestId('search-results')).toBeVisible();
  });
});
