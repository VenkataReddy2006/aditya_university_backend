const {
    getInternalMarks
} = require("./internalMarks.service");

async function internalMarks(req, res) {
    console.log("CONTROLLER");

    const { username } = req.body;

    const result = await getInternalMarks(username);

    res.json(result);
}

module.exports = {
    internalMarks
};
