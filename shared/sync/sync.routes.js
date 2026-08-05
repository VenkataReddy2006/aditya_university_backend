const express = require("express");
const {
    login,
    loginWithCookie,
    getCachedData,
    refreshData,
    storeCredentials
} = require("./sync.controller");

const router = express.Router();

router.post("/login", login);
router.post("/login-with-cookie", loginWithCookie);
router.post("/cached-data", getCachedData);
router.post("/refresh", refreshData);
router.post("/store-credentials", storeCredentials);

module.exports = router;
