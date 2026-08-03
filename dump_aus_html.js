
const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const fs = require("fs");

async function test() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true, maxRedirects: 10 }));
    const loginPage = await client.get("https://info.aec.edu.in/aus/default.aspx");
    fs.writeFileSync("aus_login.html", loginPage.data);
    console.log("Wrote aus_login.html");
}
test();

