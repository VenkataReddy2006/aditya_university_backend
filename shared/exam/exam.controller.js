const { loginToExamPortal } = require("./exam.service");

async function testExamLogin(req, res) {

    console.log("CONTROLLER CALLED");

    const { username } = req.body;

    const result = await loginToExamPortal(username);

    res.json(result);
}

module.exports = {
    testExamLogin
};
