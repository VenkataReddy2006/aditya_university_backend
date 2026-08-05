const express = require("express");
const router = express.Router();

const { testExamLogin } = require("./exam.controller");

router.post("/test-login", testExamLogin);

module.exports = router;
