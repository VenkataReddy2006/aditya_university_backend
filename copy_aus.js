
const fs = require("fs");
const aecServicePath = "d:/aditya_university/backend/src/aec/aec.service.js";
const ausServicePath = "d:/aditya_university/backend/src/aus/aus.service.js";

let content = fs.readFileSync(aecServicePath, "utf8");
content = content.replace(/https:\/\/info.aec.edu.in\/aec\//g, "https://info.aec.edu.in/aus/");
content = content.replace(/\/api\/aec\/image\//g, "/api/aus/image/");

fs.writeFileSync(ausServicePath, content);
console.log("Created aus.service.js");

