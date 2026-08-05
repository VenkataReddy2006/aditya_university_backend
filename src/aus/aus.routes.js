const express = require("express");
const router = express.Router();

const {
    login,
    attendance,
    image,
    profile,
    todayAttendance,
    saveCredentials
} = require("./aus.controller");

router.post("/login", login);

router.post("/attendance", attendance);

router.post("/today-attendance", todayAttendance);

router.get("/image/:rollNo", image);

router.post("/profile", profile);

router.post("/save-credentials", saveCredentials);

module.exports = router;