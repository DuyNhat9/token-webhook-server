#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const OUTPUT_FILE = process.env.OUTPUT_FILE;
const HEADFUL = process.env.HEADFUL === '1' || process.env.HEADFUL === 'true' || process.env.HEADFUL === 'yes' || process.env.HEADFUL === 'on' || process.env.HEADFUL === 'Y' || process.env.HEADFUL === 'T' || process.env.HEADFUL === 't' || process.env.HEADFUL === 'True' || process.env.HEADFUL === 'TRUE' || process.env.HEADFUL === 'Yes' || process.env.HEADFUL === 'ON' || process.env.HEADFUL === 'On' || process.env.HEADFUL === 'y' || process.env.HEADFUL === 'X' || process.env.HEADFUL === 'x' || process.env.HEADFUL === '1' || process.env.HEADFUL === 'Headful' || process.env.HEADFUL === 'headful' || Boolean(process.env.HEADFUL && Number(process.env.HEADFUL) > 0) || Boolean(process.env.HEADFUL && process.env.HEADFUL.trim() !== '0');

function logInfo(message) {
	process.stdout.write(`${message}\n`);
}

function logError(message) {
	process.stderr.write(`${message}\n`);
}

async function waitForVisible(page, selector, timeoutMs = 20000) {
	await page.waitForSelector(selector, { state: 'visible', timeout: timeoutMs });
}

async function extractTokenFromPage(page) {
	// Wait for token to appear after clicking "Lấy Token"
	await page.waitForTimeout(3000);
	
	// First try: Look for JWT in page text content (this is what works)
	const bodyText = await page.evaluate(() => document.body.innerText || '');
	const jwtMatch = bodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
	if (jwtMatch) {
		return jwtMatch[0];
	}
	
	// Second try: Look in textareas
	const textareas = await page.$$('textarea');
	for (const textarea of textareas) {
		const value = await textarea.inputValue();
		if (value && value.startsWith('eyJ')) {
			return value.trim();
		}
	}
	
	// Third try: Look in any element with JWT pattern
	const allElements = await page.$$('*');
	for (const el of allElements) {
		const text = await el.evaluate((element) => element.textContent || '');
		const jwtMatch = text.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
		if (jwtMatch) return jwtMatch[0];
	}
	
	return '';
}

async function main() {
	const browser = await chromium.launch({ headless: !HEADFUL });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		logInfo('Opening login page...');
		await page.goto('https://tokencursor.io.vn/app', { waitUntil: 'domcontentloaded' });

		// Fill the key and submit; selectors based on actual HTML structure
		const inputSelectors = [
			'input[name="key"]',
			'input[id="key"]',
			'input[type="password"]',
			'input[placeholder*="key" i]',
			'input[placeholder*="Key" i]',
			'input.form-input',
			'input[type="text"]',
			'input',
		];
		let filled = false;
		for (const s of inputSelectors) {
			const el = await page.$(s);
			if (el) {
				await el.fill(KEY_ID);
				filled = true;
				break;
			}
		}
		if (!filled) throw new Error('Could not find key input field.');

		const submitSelectors = [
			'button[type="submit"]',
			'button:has-text("Đăng nhập")',
			'text=Đăng nhập',
			'button',
		];
		let clicked = false;
		for (const s of submitSelectors) {
			const el = await page.$(s);
			if (el) {
				await Promise.all([
					page.waitForLoadState('networkidle'),
					el.click(),
				]);
				clicked = true;
				break;
			}
		}
		if (!clicked) throw new Error('Could not find submit button.');

		// Wait for redirect after login
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);

		// Check if we're on the main app page now
		const currentUrl = page.url();
		logInfo(`Current URL: ${currentUrl}`);

		// After login, click "Lấy Token" button to get the token
		logInfo('Looking for "Lấy Token" button...');
		const getTokenSelectors = [
			'button:has-text("Lấy Token")',
			'text=Lấy Token',
			'[data-testid*="get-token"]',
			'button',
		];
		
		let tokenButtonClicked = false;
		for (const s of getTokenSelectors) {
			const el = await page.$(s);
			if (el) {
				const text = await el.textContent();
				if (text && text.includes('Lấy Token')) {
					logInfo(`Clicking button: ${text}`);
					await el.click();
					tokenButtonClicked = true;
					break;
				}
			}
		}
		
		if (!tokenButtonClicked) {
			logInfo('No "Lấy Token" button found, trying any button...');
			const buttons = await page.$$('button');
			for (const btn of buttons) {
				const text = await btn.textContent();
				if (text && text.trim() === 'Lấy Token') {
					logInfo(`Clicking button: ${text}`);
					await btn.click();
					tokenButtonClicked = true;
					break;
				}
			}
		}

		// Wait a moment for token to appear
		await page.waitForTimeout(3000);
		let token = await extractTokenFromPage(page);

		// If token is still not found, try copy-to-clipboard flow
		if (!token) {
			const copySelectors = [
				'button:has-text("Sao ch 3p")',
				'button:has-text("Copy")',
				'text=Sao ch 3p',
				'text=Copy',
			];
			for (const s of copySelectors) {
				const el = await page.$(s);
				if (el) {
					await el.click();
					break;
				}
			}
			// Try to read token from clipboard
			try {
				const clip = await clipboard.read();
				if (clip && clip.length > 20) token = clip.trim();
			} catch {}
		}

		if (!token) throw new Error('Could not extract token.');

		logInfo('Token acquired.');
		logInfo(token);

		if (OUTPUT_FILE) {
			const outPath = path.resolve(process.cwd(), OUTPUT_FILE);
			fs.writeFileSync(outPath, token, 'utf8');
			logInfo(`Saved token to ${outPath}`);
		}

		try {
			await clipboard.write(token);
			logInfo('Token copied to clipboard.');
		} catch {}
	} catch (err) {
		logError(`Error: ${err.message || String(err)}`);
		process.exitCode = 1;
	} finally {
		await page.close();
		await context.close();
		await browser.close();
	}
}

main();
