
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

async function test() {
    console.log("Launching browser...");
    const browser = await chromium.launch({ 
        headless: true
    });
    
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    });
    
    const page = await context.newPage();
    console.log("Going to AUS default.aspx...");
    await page.goto("https://info.aec.edu.in/aus/default.aspx", { waitUntil: "networkidle" });
    
    console.log("Waiting up to 10s for Cloudflare Turnstile to auto-solve (if any)...");
    for(let i=0; i<10; i++) {
        await page.waitForTimeout(1000);
        let token = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(()=>"");
        if(token) {
            console.log("Got turnstile token auto-solved:", token.substring(0, 15) + "...");
            break;
        }
    }
    
    console.log("Filling form...");
    await page.fill("#txtUserId", "25B11EC001");
    await page.fill("#txtPassword", "Siddu@2007");
    
    console.log("Submitting...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.click("#btnLogin")
    ]);
    
    console.log("Current URL:", page.url());
    
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === "ASP.NET_SessionId");
    console.log("Session Cookie:", sessionCookie ? sessionCookie.value : "NONE");
    
    const isSuccess = page.url().includes("StudentMaster");
    console.log("Success?", isSuccess);
    
    await browser.close();
}
test().catch(e => console.error("Error:", e.message));

