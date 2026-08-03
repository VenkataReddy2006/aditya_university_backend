
const fs = require("fs");

// Controller
const aecControllerPath = "d:/aditya_university/backend/src/aec/aec.controller.js";
const ausControllerPath = "d:/aditya_university/backend/src/aus/aus.controller.js";
let ctrlContent = fs.readFileSync(aecControllerPath, "utf8");
ctrlContent = ctrlContent.replace(/\.\/aec\.service/g, "./aus.service");
ctrlContent = ctrlContent.replace(/https:\/\/info.aec.edu.in\/aec\//g, "https://info.aec.edu.in/aus/");
fs.writeFileSync(ausControllerPath, ctrlContent);
console.log("Created aus.controller.js");

// Routes
const aecRoutesPath = "d:/aditya_university/backend/src/aec/aec.routes.js";
const ausRoutesPath = "d:/aditya_university/backend/src/aus/aus.routes.js";
let routesContent = fs.readFileSync(aecRoutesPath, "utf8");
routesContent = routesContent.replace(/\.\/aec\.controller/g, "./aus.controller");
fs.writeFileSync(ausRoutesPath, routesContent);
console.log("Created aus.routes.js");

