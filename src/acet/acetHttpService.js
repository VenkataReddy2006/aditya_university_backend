const axios = require("axios");

async function getLoginPage() {

    try {

        const response = await axios.get(
            "https://info.aec.edu.in/acet/default.aspx",
            {
                maxRedirects: 0,
                validateStatus: () => true
            }
        );

        console.log("STATUS:", response.status);
        console.log("LOCATION:", response.headers.location);
        console.log("HEADERS:", response.headers);

        return response.data;

    } catch (err) {
        console.log(err.response?.status);
        console.log(err.response?.headers);
        throw err;
    }

}

module.exports = { getLoginPage };
