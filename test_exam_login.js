const { loginExamPortal } = require("./src/services/examLogin.service");

(async () => {
    const { browser, page } = await loginExamPortal("24P31A1243");

    console.log(await page.title());

    await page.waitForTimeout(10000);

    await browser.close();
})();
