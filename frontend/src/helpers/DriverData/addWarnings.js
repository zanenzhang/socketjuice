import axios from "../../api/axios";
const WARNINGS_URL = '/warnings'

async function addWarnings (loggedUserId, accessToken) {

    try {
        const response = await axios.post(WARNINGS_URL, 
            JSON.stringify({loggedUserId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if (response){
            return response
        }
        
    } catch (err) {
        console.error(err);
    }
}

export default addWarnings






