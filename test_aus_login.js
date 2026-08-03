
const aus = require("./src/aus/aus.service");
async function test() {
    const res = await aus.loginStudent("25B11EC001", "Siddu@2007");
    console.log(res);
}
test();

