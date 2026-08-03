
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function test() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: "C:\\Users\\padal\\.cache\\puppeteer\\chrome\\win64-151.0.7922.47\\chrome-win64\\chrome.exe",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();
    console.log("Going to AUS default.aspx...");
    await page.goto("https://info.aec.edu.in/aus/default.aspx", { waitUntil: "networkidle2" });
    
    console.log("Waiting a few seconds for Cloudflare Turnstile to auto-solve (if any)...");
    await page.waitForTimeout(5000);
    
    const turnstileToken = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(()=>"");
    console.log("Turnstile Token:", turnstileToken ? turnstileToken.substring(0, 15) + "..." : "NONE");
    
    console.log("Filling form...");
    await page.type("#txtUserId", "25B11EC001");
    // Since txtPassword is automatically encrypted by the site on blur/keyup, we can just type it in!
    await page.type("#txtPassword", "Siddu@2007");
    
    console.log("Submitting...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#btnLogin")
    ]);
    
    console.log("Current URL:", page.url());
    
    const cookies = await page.cookies();
    const sessionCookie = cookies.find(c => c.name === "ASP.NET_SessionId");
    console.log("Session Cookie:", sessionCookie ? sessionCookie.value : "NONE");
    
    // Check if it reached StudentMaster
    const isSuccess = page.url().includes("StudentMaster");
    console.log("Success?", isSuccess);
    
    await browser.close();
}
test().catch(e => console.error("Error:", e.message));

