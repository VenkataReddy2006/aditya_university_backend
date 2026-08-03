
const axios = require("axios");
const fs = require("fs");
axios.get("https://info.aec.edu.in/aus/default.aspx").then(res => {
    fs.writeFileSync("aus_login.html", res.data);
    console.log("Written aus_login.html");
});

