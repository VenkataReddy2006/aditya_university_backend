const { loginStudent } = require('./src/services/aec.service');
async function test() {
    const res = await loginStudent('23A91A0549', 'Reddy@2006');
    if (!res.success) return;
    const client = res.client;
    
    let page = await client.get('https://info.aec.edu.in/aec/StudentProfile.aspx').catch(e => e.response);
    if(page && page.status === 200) {
        console.log('Found StudentProfile.aspx');
        return;
    }

    page = await client.get('https://info.aec.edu.in/aec/StudentProfile/Profile.aspx').catch(e => e.response);
    if(page && page.status === 200) {
        console.log('Found Profile.aspx');
        return;
    }

    const dash = await client.get('https://info.aec.edu.in/aec/Default.aspx').catch(e => e.response);
    if(dash && dash.data) {
        const matches = dash.data.match(/href=[\"'](.*?)[\"']/gi);
        if (matches) {
            console.log('Links on Default.aspx:', matches.filter(m => m.toLowerCase().includes('profile')));
        }
    }
}
test();
