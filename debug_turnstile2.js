
const { chromium } = require("playwright");

async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    
    await page.goto("https://info.aec.edu.in/aus/default.aspx", { waitUntil: "networkidle" });
    
    let val = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(() => "");
    console.log("Initial Token:", val);
    
    console.log("Waiting up to 10s for token to populate...");
    for(let i=0; i<10; i++) {
        await page.waitForTimeout(1000);
        val = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(() => "");
        if (val) {
            console.log("Token populated:", val.substring(0, 20) + "...");
            break;
        }
    }
    await browser.close();
}
test();

