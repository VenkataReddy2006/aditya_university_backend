const {
    getSemesters,
    getMarks
} = require("./src/services/acetMarks.service");

(async () => {
    console.log("Fetching semesters and marks...");
    try {
        const semestersResult = await getSemesters("24P31A1243", "ACET");
        console.log(JSON.stringify(semestersResult, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
