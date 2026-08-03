
const { chromium } = require("playwright");

async function checkMarksLink() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log("Navigating to AEC login...");
        await page.goto("https://info.aec.edu.in/aec/default.aspx");
        
        await page.fill("#txtId2", "23A91A0549");
        await page.fill("#txtPwd2", "Reddy@2006");
        await page.evaluate(() => encryptJSText(2));
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
            page.click("#imgBtn2")
        ]);
        console.log("Logged in!", page.url());

        if (page.url().includes("default.aspx")) {
            console.log("Failed. Text:", await page.evaluate(() => document.body.innerText));
            return;
        }

        const iframeElement = await page.$("#capIframeId");
        if (iframeElement) {
            console.log("Iframe found! Waiting a bit to let it load.");
            await page.waitForTimeout(2000);
            
            const html = await page.content();
            require("fs").writeFileSync("aec_master.html", html);
            console.log("Saved parent HTML.");
            
            const frame = await iframeElement.contentFrame();
            const frameHtml = await frame.content();
            require("fs").writeFileSync("aec_frame.html", frameHtml);
            console.log("Saved iframe HTML.");
        } else {
            console.log("No iframe found on", page.url());
            require("fs").writeFileSync("aec_master.html", await page.content());
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
checkMarksLink();

