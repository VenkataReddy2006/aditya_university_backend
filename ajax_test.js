const { loginStudent } = require('./src/services/aec.service');
async function test() {
    const res = await loginStudent('23A91A0549', 'Reddy@2006');
    const client = res.client;
    
    // Attempt 3: AjaxPro correct format
    let r3 = await client.post('https://info.aec.edu.in/aec/ajax/StudentProfile,App_Web_studentprofile.aspx.a2a1b31c.ashx?_method=ShowStudentProfileNew&_session=rw', 
        'RollNo="23A91A0549"\r\nisImageDisplay=true',
        { 
            headers: { 
                'Content-Type': 'text/plain; charset=utf-8'
            } 
        }
    ).catch(e => e.response);
    
    console.log('r3 status:', r3 ? r3.status : 'null');
    if (r3 && r3.status === 200) {
        console.log(r3.data.substring(0, 500));
        require('fs').writeFileSync('ajax_profile.json', r3.data);
    }
}
test();
