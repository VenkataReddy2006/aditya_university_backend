
const fs = require("fs");
const acetPath = "d:/aditya_university/backend/src/acet/acet.service.js";
let content = fs.readFileSync(acetPath, "utf8");

// Remove the broken loginStudentAxios which is missing the signature
// I will just read a fresh copy of what it was supposed to be before my first bad script

