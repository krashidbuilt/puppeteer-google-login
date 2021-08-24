/* eslint no-undef: "warn"*/

const read = require('read');
const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');

const Logger = require('@KrashidBuilt/common/utils/logger');

puppeteer.use(pluginStealth());

const headless = false; // watch it work
const logger = new Logger(__filename);

const promptForValue = (label, silent = false) => new Promise((resolve, reject) => {
    read({ prompt: `Please enter ${label}: `, silent }, (error, value) => {
        if (error) {
            reject(error);
        }
        if (!value) {
            reject(new Error(`${label} cannot be blank`));
        }
        resolve(value);
    });
});

const waitFor = (ms = 1000) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

// Launch puppeteer browser.
puppeteer.launch({ headless: headless }).then(async (browser) => {
    logger.debug('Opening chromium browser...');
    const page = await browser.newPage();
    const pages = await browser.pages();

    // Close the new tab that chromium always opens first.
    pages[0].close();

    await page.goto('https://accounts.google.com/signin/v2/identifier', { waitUntil: 'networkidle2' });


    // Only needed if sign in requires you to click 'sign in with google' button.
    // await page.waitForSelector('button[data-test="google-button-login"]');
    // await waitFor(1000);
    // await page.click('button[data-test="google-button-login"]');

    // Wait for email input.
    await page.waitForSelector('#identifierId');
    let badInput = true;

    // Keep trying email until user inputs email correctly.
    // This will error due to captcha if too many incorrect inputs.
    while (badInput) {
        const email = await promptForValue('email or phone: ');
        await page.type('#identifierId', email);
        await waitFor(1000);
        await page.keyboard.press('Enter');
        await waitFor(1000);
        badInput = await page.evaluate(() => document.querySelector('#identifierId[aria-invalid="true"]') !== null);
        if (badInput) {
            logger.debug('Incorrect email or phone. Please try again.');
            await page.click('#identifierId', { clickCount: 3 });
        }
    }

    const password = await promptForValue('your password: ', true);
    logger.debug('Finishing up...');

    // Wait for password input
    await page.type('input[type="password"]', password);

    await waitFor(1000);
    await page.keyboard.press('Enter');

    logger.debug('Go deal with MFA if it\'s enabled for your account...');
    // deal with MFA here
});