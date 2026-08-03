const fs = require("fs");
const path = require("path");

const sharedScreensPath = path.join("d:", "aditya_university", "lib", "shared", "screens");
const libPath = path.join("d:", "aditya_university", "lib");

const screens = [
    { file: "home_screen.dart", name: "HomeScreen" },
    { file: "attendance_screen.dart", name: "AttendanceScreen" },
    { file: "marks_screen.dart", name: "MarksScreen" },
    { file: "profile_screen.dart", name: "ProfileScreen" }
];

const colleges = ["aec", "acet", "aus"];

colleges.forEach(college => {
    const collegePath = path.join(libPath, college, "screens");
    if (!fs.existsSync(collegePath)) {
        fs.mkdirSync(collegePath, { recursive: true });
    }

    screens.forEach(screen => {
        const sourcePath = path.join(sharedScreensPath, screen.file);
        const destFile = `${college}_${screen.file}`;
        const destPath = path.join(collegePath, destFile);

        if (fs.existsSync(sourcePath)) {
            let content = fs.readFileSync(sourcePath, "utf8");
            
            // Rename class
            const prefix = college.charAt(0).toUpperCase() + college.slice(1); // Aec, Acet, Aus
            const newClassName = `${prefix}${screen.name}`;
            
            content = content.replace(new RegExp(`class ${screen.name}`, "g"), `class ${newClassName}`);
            content = content.replace(new RegExp(`State<${screen.name}>`, "g"), `State<${newClassName}>`);
            content = content.replace(new RegExp(`_${screen.name}State`, "g"), `_${newClassName}State`);
            content = content.replace(new RegExp(`const ${screen.name}`, "g"), `const ${newClassName}`);
            
            // Need to fix imports if they use relative paths (e.g. `../providers/...`)
            // shared screens are in lib/shared/screens
            // college screens are in lib/aec/screens
            // Both are one level deeper than lib, so `../providers/` actually becomes `../../shared/providers/`
            
            content = content.replace(/import '\.\.\//g, "import '../../shared/");
            
            fs.writeFileSync(destPath, content);
            console.log(`Created ${destPath}`);
        }
    });
});
