const { chromium } = require("playwright");
const fs = require("fs");

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://info.aec.edu.in/acet/default.aspx");

    await page.fill("#txtId2", "24P31A1243");
    await page.fill("#txtPwd2", "Nikhil@6893");
    await page.evaluate(() => encryptJSText(2));
    
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }),
        page.click("#imgBtn2")
    ]);

    console.log("Logged in:", page.url());

    // Wait for the ajax and iframe to load
    await page.waitForTimeout(5000); 

    fs.writeFileSync("StudentMaster.html", await page.content());

    const iframeElement = await page.$("#capIframeId");
    if (iframeElement) {
        const frame = await iframeElement.contentFrame();
        if (frame) {
            fs.writeFileSync("StudentProfile.html", await frame.content());
            console.log("Saved StudentProfile.html");
        } else {
            console.log("No contentFrame found");
        }
    } else {
        console.log("No #capIframeId found");
    }

    await browser.close();
}

run().catch(console.error);
