
const { chromium } = require("playwright");

async function checkMarksLink() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto("https://info.aec.edu.in/acet/default.aspx");
        
        await page.fill("#txtId2", "23A91A0549");
        await page.fill("#txtPwd2", "Reddy@2006");
        await page.evaluate(() => encryptJSText(2));
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
            page.click("#imgBtn2")
        ]);
        
        // Take a screenshot
        await page.screenshot({ path: "acet_login_error.png" });
        
        // Dump all text
        const text = await page.evaluate(() => document.body.innerText);
        require("fs").writeFileSync("acet_login_text.txt", text);
    } finally {
        await browser.close();
    }
}
checkMarksLink();

