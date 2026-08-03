
const fs = require("fs");
const path = require("path");

const libPath = path.join("d:", "aditya_university", "lib");
const colleges = ["aec", "acet", "aus"];

colleges.forEach(college => {
    const mainScreenPath = path.join(libPath, college, "screens", `${college}_main_screen.dart`);
    if (fs.existsSync(mainScreenPath)) {
        let content = fs.readFileSync(mainScreenPath, "utf8");
        
        // Update imports
        content = content.replace(/import \x27\.\.\/\.\.\/shared\/screens\/home_screen\.dart\x27;/g, `import \x27${college}_home_screen.dart\x27;`);
        content = content.replace(/import \x27\.\.\/\.\.\/shared\/screens\/attendance_screen\.dart\x27;/g, `import \x27${college}_attendance_screen.dart\x27;`);
        content = content.replace(/import \x27\.\.\/\.\.\/shared\/screens\/marks_screen\.dart\x27;/g, `import \x27${college}_marks_screen.dart\x27;`);
        content = content.replace(/import \x27\.\.\/\.\.\/shared\/screens\/profile_screen\.dart\x27;/g, `import \x27${college}_profile_screen.dart\x27;`);
        
        // Update instances
        const prefix = college.charAt(0).toUpperCase() + college.slice(1);
        content = content.replace(/HomeScreen\(\)/g, `${prefix}HomeScreen()`);
        content = content.replace(/AttendanceScreen\(\)/g, `${prefix}AttendanceScreen()`);
        content = content.replace(/MarksScreen\(\)/g, `${prefix}MarksScreen()`);
        content = content.replace(/ProfileScreen\(\)/g, `${prefix}ProfileScreen()`);
        
        fs.writeFileSync(mainScreenPath, content);
        console.log(`Updated ${mainScreenPath}`);
    }
});

