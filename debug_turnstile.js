
const { chromium } = require("playwright");

async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();
    
    console.log("Navigating...");
    await page.goto("https://info.aec.edu.in/aus/default.aspx");
    
    console.log("Waiting for turnstile...");
    try {
        await page.waitForSelector("[name=cf-turnstile-response]", { timeout: 5000 });
        let val = await page.$eval("[name=cf-turnstile-response]", el => el.value);
        console.log("Initial Token:", val);
        
        console.log("Waiting up to 10s for token to populate...");
        for(let i=0; i<10; i++) {
            await page.waitForTimeout(1000);
            val = await page.$eval("[name=cf-turnstile-response]", el => el.value);
            if (val) {
                console.log("Token populated:", val.substring(0, 20) + "...");
                break;
            }
        }
    } catch(e) {
        console.log("Error waiting for turnstile:", e.message);
    }
    
    await browser.close();
}
test();

