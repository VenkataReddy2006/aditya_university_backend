const fs = require("fs");
let c = fs.readFileSync("src/aus/aus.service.js.bak", "utf8");

// 1. Add playwright imports
c = c.replace(
    "const axios = require(\"axios\");",
    "const axios = require(\"axios\");\nconst { chromium } = require(\"playwright-extra\");\nconst stealth = require(\"puppeteer-extra-plugin-stealth\")();\nchromium.use(stealth);"
);

// 2. Replace old loginStudent + add loginWithCookie  
const oldStart = "async function loginStudent(username, password) {\n    try {";
const oldEnd = "\n}\n\nasync function getAttendance";
const startIdx = c.indexOf(oldStart);
const endMarker = "\n}\n\nasync function getAttendance";
const endIdx = c.indexOf(endMarker, startIdx);

if (startIdx < 0 || endIdx < 0) {
    console.error("Could not find boundaries. startIdx=" + startIdx + " endIdx=" + endIdx);
    process.exit(1);
}

const before = c.substring(0, startIdx);
const after = c.substring(endIdx + "\n}\n\n".length);

const newFns = `async function loginStudent(username, password) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        });
        const page = await context.newPage();
        await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
        await page.fill("#txtUserId", username);
        await page.fill("#txtPassword", password);
        for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000);
            let token = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(() => "");
            if (token) break;
        }
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
            page.click("#btnLogin")
        ]);
        if (!page.url().includes("StudentMaster")) {
            await browser.close();
            return { success: false, requires_webview: true, message: "Cloudflare Turnstile blocked backend login. WebView required." };
        }
        const cookies = await context.cookies();
        await browser.close();
        const sessionCookie = cookies.find(ck => ck.name === "ASP.NET_SessionId");
        if (!sessionCookie) { return { success: false, requires_webview: true, message: "No session cookie found" }; }
        return loginWithCookie(sessionCookie.value);
    } catch (err) {
        if (browser) await browser.close();
        return { success: false, requires_webview: true, error: err.message };
    }
}

function loginWithCookie(cookieString) {
    const jar = new CookieJar();
    jar.setCookieSync("ASP.NET_SessionId=" + cookieString, "https://info.aec.edu.in");
    const client = wrapper(axios.create({ jar, withCredentials: true, maxRedirects: 10, validateStatus: () => true }));
    return { success: true, client };
}

`;

c = before + newFns + "async function getAttendance" + after;

// 3. Update getAttendance signature
c = c.replace(
    "async function getAttendance(username, password, fromDate = \"\", toDate = \"\") {\n\n    const login = await loginStudent(username, password);\n\n    if (!login.success) {\n        return login;\n    }\n\n    const client = login.client;\n",
    "async function getAttendance(username, password, fromDate = \"\", toDate = \"\", cookieClient = null) {\n    let client;\n    if (cookieClient) { client = cookieClient; } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }\n"
);

// 4. Update getProfile
c = c.replace(
    "async function getProfile(username, password) {\n    const login = await loginStudent(username, password);\n    if (!login.success) return login;\n    \n    const client = login.client;",
    "async function getProfile(username, password, cookieClient = null) {\n    let client;\n    if (cookieClient) { client = cookieClient; } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }"
);

// 5. Update getTodayAttendance
c = c.replace(
    "async function getTodayAttendance(username, password) {\n    const today = formatDate(new Date());\n    return await getAttendance(username, password, today, today);\n}",
    "async function getTodayAttendance(username, password, cookieClient = null) {\n    const today = formatDate(new Date());\n    return await getAttendance(username, password, today, today, cookieClient);\n}"
);

// 6. Update getMarksHistory
c = c.replace(
    "async function getMarksHistory(username, password) {\n    const login = await loginStudent(username, password);\n    if (!login.success) return login;\n    \n    const MARKS_URL",
    "async function getMarksHistory(username, password, cookieClient = null) {\n    let client;\n    if (cookieClient) { client = cookieClient; } else {\n        const login = await loginStudent(username, password);\n        if (!login.success) return login;\n        client = login.client;\n    }\n    \n    const MARKS_URL"
);

// 7. Fix getMarksHistory which uses login.client
c = c.replace("const response = await login.client.post(", "const response = await client.post(");

// 8. Add loginWithCookie to exports
c = c.replace(
    "module.exports = {\n    getMarksHistory,",
    "module.exports = {\n    loginWithCookie,\n    getMarksHistory,"
);

fs.writeFileSync("src/aus/aus.service.js", c);
console.log("Done! Lines:", c.split("\n").length);
