const {
    getMarks
} = require("./src/services/acetMarks.service");

(async () => {

    const result = await getMarks(
        "24P31A1243",
        3
    );

    console.log(JSON.stringify(result, null, 2));

})();
