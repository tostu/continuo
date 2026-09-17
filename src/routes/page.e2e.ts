import { expect, test } from '@playwright/test';

test('home page renders without CSP violations', async ({ page }) => {
	const violations: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
			violations.push(msg.text());
		}
	});

	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	expect(violations).toEqual([]);
});
