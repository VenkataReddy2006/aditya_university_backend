const cheerio = require('cheerio');
const fs = require('fs');

const data = fs.readFileSync('ajax_profile.json', 'utf8');

let html = data;
if (html.startsWith("'") && html.endsWith("'")) {
    html = html.substring(1, html.length - 1);
}
html = html.replace(/\\'/g, "'").replace(/\\r\\n/g, "\n");

const $ = cheerio.load(html);

// We only want data from divProfile_BioData
const bioData = $("#divProfile_BioData");

function getVal(key) {
    let val = "";
    bioData.find("td").each((i, td) => {
        if ($(td).text().trim() === key) {
            val = $(td).next().next().text().trim();
        }
    });
    return val;
}

const student = {
    photo: `http://localhost:3000/api/aec/image/${getVal("RollNo")}.jpg`,
    admissionNo: getVal("Admission.No"),
    rollNo: getVal("RollNo"),
    name: getVal("Name"),
    course: getVal("Course"),
    branch: getVal("Branch"),
    semester: getVal("Semester"),
    gender: getVal("Gender"),
    dob: getVal("DOB"),
    nationality: getVal("Nationality"),
    religion: getVal("Religion"),
    sscMarks: getVal("SSC Marks, %"),
    interMarks: getVal("Inter Marks, %"),
    sscGrade: getVal("SSC Gradepoints"),
    interGrade: getVal("Inter Gradepoints"),
    entranceType: getVal("Entrance Type"),
    rank: getVal("EAMCET/ECET Rank"),
    seatType: getVal("Seat Type"),
    caste: getVal("Caste"),
    lastStudied: getVal("Last Studied"),
    joiningDate: getVal("Joining Date"),
    mobile: getVal("Mobile.No"),
    email: getVal("Email"),
    bankAccount: getVal("Bank A/C.No"),
    aadhaar: getVal("Adhar.No"),
    rationCard: getVal("Ration Card.No"),
    
    fatherName: getVal("Father Name"),
    motherName: getVal("Mother Name"),
    fatherMobile: getVal("Father Mobile.No"),
    motherMobile: getVal("Mother Mobile.No"),
    fatherOccupation: getVal("Occupation"), // This might get overwritten if both have occupation
    annualIncome: getVal("Annual Income"),
    
    correspondenceAddress: getVal("Correspondence Address"),
    permanentAddress: getVal("Permanent Address")
};

// Fix for occupation (there are two)
let occupations = [];
bioData.find("td").each((i, td) => {
    if ($(td).text().trim() === "Occupation") {
        occupations.push($(td).next().next().text().trim());
    }
});
if (occupations.length >= 2) {
    student.fatherOccupation = occupations[0];
    student.motherOccupation = occupations[1];
}

console.log(student);
