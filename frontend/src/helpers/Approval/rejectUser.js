import axios from "../../api/axios";
const VERIFY_URL = '/verifyuser/rejectuser';

async function rejectUser(userId, accessToken) {

    try {
        const response = await axios.post(VERIFY_URL, 
            JSON.stringify({userId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if (response){
            return response
        } else {
            return null
        }

    } catch (err) {
        console.error(err);
    }
}

export default rejectUser
