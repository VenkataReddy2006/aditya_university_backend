
const axios = require("axios");
async function test() {
    try {
        const res = await axios.post("http://localhost:3000/api/shared/sync/login", {
            username: "23A91A0549",
            password: "Reddy@2006",
            college: "ACET"
        });
        console.log("Success:", res.data.success);
        console.log("MarksHistory keys:", Object.keys(res.data.data.marksHistory || {}));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();

