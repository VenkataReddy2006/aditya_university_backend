const { getLoginPage } = require("./src/services/acetHttpService");
getLoginPage().then(() => console.log("Done")).catch(console.error);
