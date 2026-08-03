
const fs = require("fs");
const acetPath = "d:/aditya_university/backend/src/acet/acet.service.js";
let content = fs.readFileSync(acetPath, "utf8");

const originalEnd = "module.exports = { login, getProfile, loginAndGetPage };\r\n";
// The file before the mess probably had "module.exports = { login, getProfile, loginAndGetPage };"
// I will slice up to getProfile function end.
const getProfileEnd = content.indexOf("module.exports = { login, getProfile, loginAndGetPage, getMarksHistory };");

let originalContent = content.substring(0, getProfileEnd);
// Remove any injected imports
originalContent = originalContent.replace(/const axios = require\("axios"\);\r\nconst cheerio = require\("cheerio"\);\r\nconst qs = require\("qs"\);\r\nconst \{ CookieJar \} = require\("tough-cookie"\);\r\nconst \{ wrapper \} = require\("axios-cookiejar-support"\);\r\nconst \{ encryptPassword \} = require\("\.\.\/shared\/utils\/encryption"\);\r\n/g, "");

// find start of loginStudentAxios
const startBroken = originalContent.indexOf("                withCredentials: true,");
if (startBroken !== -1) {
    // it was broken around here, wait, I can just slice before that.
    const startOfMess = originalContent.indexOf("async function getMarksHistory");
    if (startOfMess !== -1) {
        // Wait, the broken try block is before getMarksHistory.
    }
}

