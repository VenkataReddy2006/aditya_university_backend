const CryptoJS = require("crypto-js");

function encryptPassword(password) {
    const key = CryptoJS.enc.Utf8.parse("8701661282118308");
    const iv = CryptoJS.enc.Utf8.parse("8701661282118308");

    const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(password),
        key,
        {
            keySize: 128 / 8,
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return encrypted.toString();
}

module.exports = encryptPassword;
