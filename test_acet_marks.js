
const acet = require("./src/acet/acet.service.js");

async function test() {
    console.log("Fetching marks...");
    const res = await acet.getMarksHistory("24P31A1243", "Nikhil@6893");
    console.log(res);
}
test();

