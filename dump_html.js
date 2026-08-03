const { chromium } = require("playwright");
const fs = require("fs");

const LOGIN_URL = "https://examsection.aec.edu.in/Login.aspx";

async function dumpHTML(username) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
        await page.waitForLoadState("networkidle");
        await page.click("#lnkLogins");
        await page.waitForSelector("#lnkStudent", { state: 'visible' });

        await page.click("#lnkStudent");
        await page.waitForSelector("#txtUserId", { state: 'visible' });

        await page.fill("#txtUserId", username);
        await page.fill("#txtPwd", username);
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle" }),
            page.click("#btnLogin")
        ]);

        await page.evaluate(() => {
            __doPostBack("ctl00$lnkOverallMarksSemwise", "");
        });

        await page.waitForSelector("input[id^='ctl00_cpStudCorner_btn']");

        const responsePromise = page.waitForResponse(response => 
            response.url().includes('OverallMarksSemwise.aspx') && response.status() === 200
        );
        
        await page.click("#ctl00_cpStudCorner_btn1");
        
        await responsePromise;
        await page.waitForTimeout(1000);

        const html = await page.content();
        fs.writeFileSync("page_after.html", html);
        console.log("Saved page_after.html");
    } finally {
        await browser.close();
    }
}

dumpHTML("23A91A0549");
