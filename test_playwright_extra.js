
try {
    const { chromium } = require("playwright-extra");
    const stealth = require("puppeteer-extra-plugin-stealth")();
    chromium.use(stealth);
    console.log("Playwright-extra and stealth loaded successfully.");
} catch(e) {
    console.log("Error loading plugins:", e.message);
}

