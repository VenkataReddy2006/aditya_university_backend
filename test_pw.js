const { login } = require("./src/services/acet.service");

login("24P31A1243", "Nikhil@6893").then(r => {
    console.log("Returned:", r);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
