
const fs = require("fs");
const path = require("path");

const aecPath = path.join("d:", "aditya_university", "backend", "src", "aec", "aec.service.js");
const acetPath = path.join("d:", "aditya_university", "backend", "src", "acet", "acet.service.js");

const aecContent = fs.readFileSync(aecPath, "utf8");
let acetContent = fs.readFileSync(acetPath, "utf8");

const startLogin = aecContent.indexOf("async function loginStudent(username, password)");
const endLogin = aecContent.indexOf("async function getAttendance(username");
let loginStr = aecContent.substring(startLogin, endLogin);

const startMarks = aecContent.indexOf("async function getMarksHistory(username, password)");
const endMarks = aecContent.indexOf("module.exports = {");
let marksStr = aecContent.substring(startMarks, endMarks);

loginStr = loginStr.replace("loginStudent", "loginStudentAxios");
loginStr = loginStr.replace("https://info.aec.edu.in/aec/default.aspx", "https://info.aec.edu.in/acet/default.aspx");

marksStr = marksStr.replace("loginStudent", "loginStudentAxios");
marksStr = marksStr.replace("https://info.aec.edu.in/aec/ajax", "https://info.aec.edu.in/acet/ajax");

if (!acetContent.includes("const axios")) {
    acetContent = `
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("../shared/utils/encryption");
` + acetContent;
}

acetContent = acetContent.replace("module.exports = { login, getProfile, loginAndGetPage };", loginStr + marksStr + "module.exports = { login, getProfile, loginAndGetPage, getMarksHistory };\n");

fs.writeFileSync(acetPath, acetContent);
console.log("Appended functions correctly!");

