
const { loginAndGetPage } = require("./src/acet/acet.service.js");

async function test() {
    try {
        const { browser, page } = await loginAndGetPage("23A91A0549", "Reddy@2006");
        console.log("Logged in!", page.url());
        
        const html = await page.content();
        const fs = require("fs");
        fs.writeFileSync("acet_master.html", html);
        console.log("Saved master page");
        await browser.close();
    } catch (e) {
        console.error("Login failed:", e.message);
    }
}
test();

