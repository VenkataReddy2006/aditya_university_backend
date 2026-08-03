
const fs = require("fs");
const appJsPath = "d:/aditya_university/backend/src/app.js";
let content = fs.readFileSync(appJsPath, "utf8");

if (!content.includes("/api/aus")) {
    content = content.replace("const aecRoutes = require(\"./aec/aec.routes\");", "const aecRoutes = require(\"./aec/aec.routes\");\nconst ausRoutes = require(\"./aus/aus.routes\");");
    content = content.replace("app.use(\"/api/aec\", aecRoutes);", "app.use(\"/api/aec\", aecRoutes);\napp.use(\"/api/aus\", ausRoutes);");
    fs.writeFileSync(appJsPath, content);
    console.log("Injected AUS routes into app.js");
} else {
    console.log("AUS routes already exist in app.js");
}

