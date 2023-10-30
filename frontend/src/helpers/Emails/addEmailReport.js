import axios from "../../api/axios";
const EMAILS_REPORT_URL = '/emails/report'

async function addEmailReport(loggedUserId, message, accessToken) {

    try {
        const response = await axios.post(EMAILS_REPORT_URL, 
            JSON.stringify({loggedUserId, message}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default addEmailReport


