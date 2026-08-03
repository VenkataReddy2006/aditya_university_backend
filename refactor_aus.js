
const fs = require("fs");
let content = fs.readFileSync("backend/src/aus/aus.service.js", "utf8");

content = content.replace(/const axios = require\("axios"\);/, "const axios = require(\"axios\");\nconst { chromium } = require(\"playwright-extra\");\nconst stealth = require(\"puppeteer-extra-plugin-stealth\")();\nchromium.use(stealth);");

const oldLoginStudentRegex = /async function loginStudent[\s\S]*?\}\n\}/m;

const newLoginStudent = `async function loginStudent(username, password) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        });
        
        const page = await context.newPage();
        await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
        
        // Fill form
        await page.fill("#txtUserId", username);
        await page.fill("#txtPassword", password);
        
        // Wait up to 5 seconds for turnstile to solve
        for(let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000);
            let token = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(()=>"");
            if(token) break;
        }
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
            page.click("#btnLogin")
        ]);
        
        if (!page.url().includes("StudentMaster")) {
            await browser.close();
            return {
                success: false,
                requires_webview: true,
                message: "Cloudflare Turnstile blocked backend login. WebView required."
            };
        }
        
        const cookies = await context.cookies();
        await browser.close();
        
        const sessionCookie = cookies.find(c => c.name === "ASP.NET_SessionId");
        if (!sessionCookie) {
             return { success: false, requires_webview: true, message: "No session cookie found" };
        }
        
        return loginWithCookie(sessionCookie.value);
    } catch (err) {
        if(browser) await browser.close();
        return {
            success: false,
            requires_webview: true,
            error: err.message
        };
    }
}

function loginWithCookie(cookieString) {
    const jar = new CookieJar();
    const fullCookie = \`ASP.NET_SessionId=\${cookieString}\`;
    jar.setCookieSync(fullCookie, "https://info.aec.edu.in");

    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
            maxRedirects: 10,
            validateStatus: () => true,
        })
    );

    return {
        success: true,
        client
    };
}`;

content = content.replace(oldLoginStudentRegex, newLoginStudent);

content = content.replace(
    /async function getAttendance\(username, password, fromDate = "", toDate = ""\) \{\s*const login = await loginStudent\(username, password\);\s*if \(!login\.success\) \{\s*return login;\s*\}/,
    "async function getAttendance(username, password, fromDate = \"\", toDate = \"\", cookieClient = null) {\n    let client;\n    if (cookieClient) {\n        client = cookieClient;\n    } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }"
);
content = content.replace(/const client = login.client;/g, ""); // Remove the leftover client assignments

content = content.replace(
    /async function getProfile\(username, password\) \{\s*const login = await loginStudent\(username, password\);\s*if \(!login\.success\) return login;/,
    "async function getProfile(username, password, cookieClient = null) {\n    let client;\n    if (cookieClient) {\n        client = cookieClient;\n    } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }"
);

content = content.replace(
    /async function getMarksHistory\(username, password\) \{\s*const login = await loginStudent\(username, password\);\s*if \(!login\.success\) return login;/,
    "async function getMarksHistory(username, password, cookieClient = null) {\n    let client;\n    if (cookieClient) {\n        client = cookieClient;\n    } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }"
);

content = content.replace(
    /async function getTodayAttendance\(username, password\) \{\s*const today = formatDate\(new Date\(\)\);\s*return await getAttendance\(username, password, today, today\);\s*\}/,
    "async function getTodayAttendance(username, password, cookieClient = null) {\n    const today = formatDate(new Date());\n    return await getAttendance(username, password, today, today, cookieClient);\n}"
);

content = content.replace(/module.exports = \{/, "module.exports = { loginWithCookie,");

fs.writeFileSync("backend/src/aus/aus.service.js", content);
console.log("Updated aus.service.js successfully!");

