
const { chromium } = require("playwright");

async function test() {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto("https://info.aec.edu.in/aec/default.aspx");
        
        await page.fill("#txtId2", "23A91A0549");
        await page.fill("#txtPwd2", "Reddy@2006");
        await page.evaluate(() => encryptJSText(2));
        
        await Promise.all([
            page.waitForNavigation(),
            page.click("#imgBtn2")
        ]);
        
        console.log("Logged in:", page.url());
        
        await Promise.all([
            page.waitForNavigation(),
            page.goto("https://info.aec.edu.in/aec/Academics/StudentMarksReport.aspx")
        ]);
        
        const iframeElement = await page.$("#capIframeId");
        if (iframeElement) {
            const frame = await iframeElement.contentFrame();
            const html = await frame.content();
            const fs = require("fs");
            fs.writeFileSync("aec_marks_playwright.html", html);
            console.log("Saved aec_marks_playwright.html from iframe");
        } else {
            // maybe it is not in iframe
            const html = await page.content();
            const fs = require("fs");
            fs.writeFileSync("aec_marks_playwright.html", html);
            console.log("Saved aec_marks_playwright.html from main page");
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
test();

