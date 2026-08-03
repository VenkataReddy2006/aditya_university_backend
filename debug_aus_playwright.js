
const { chromium } = require("playwright");
async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://info.aec.edu.in/aus/default.aspx", { waitUntil: "networkidle" });
    
    // Fill credentials
    await page.fill("#txtUserId", "25B11EC001");
    await page.fill("#txtPassword", "Siddu@2007");
    
    // Check student radio if needed
    // Already checked by default but lets click it
    await page.click("#rbtStudent");
    
    // Click login
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.click("#btnLogin")
    ]);
    
    console.log("Logged in URL:", page.url());
    
    const cookies = await context.cookies();
    console.log("Cookies:", cookies);
    
    await browser.close();
}
test().catch(console.error);

