const { chromium } = require("playwright");

async function loginExamPortal(username, college) {
    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();

    const url = college === "AEC" 
        ? "https://examsection.aec.edu.in/Login.aspx"
        : "https://examsection.acet.ac.in/Login.aspx";

    await page.goto(url, {
        waitUntil: "networkidle"
    });

    // Click the visible "Logins" menu
    await page.click("text=Logins");

    await page.waitForSelector("#lnkStudent", {
        state: "visible",
        timeout: 10000,
    });

    // Now click Student Login
    await page.click("#lnkStudent");

    await page.waitForSelector("#txtUserId", {
        state: "visible",
        timeout: 10000
    });

    await page.fill("#txtUserId", username);

    // Password = Username
    await page.fill("#txtPwd", username);

    await page.click("#btnLogin");

    await page.waitForLoadState("networkidle");

    return { browser, page };
}

module.exports = {
    loginExamPortal
};
