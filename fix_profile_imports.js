
const fs = require("fs");
const path = require("path");

const libPath = path.join("d:", "aditya_university", "lib");
const colleges = ["aec", "acet", "aus"];

colleges.forEach(college => {
    const profilePath = path.join(libPath, college, "screens", `${college}_profile_screen.dart`);
    if (fs.existsSync(profilePath)) {
        let content = fs.readFileSync(profilePath, "utf8");
        content = content.replace(/import \x27login_screen\.dart\x27;/g, `import \x27../../shared/screens/login_screen.dart\x27;`);
        fs.writeFileSync(profilePath, content);
        console.log(`Updated ${profilePath}`);
    }
});

