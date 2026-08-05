const express = require("express");

const router = express.Router();

const {
    internalMarks
} = require("./internalMarks.controller");

router.post("/internal-marks", internalMarks);

module.exports = router;
