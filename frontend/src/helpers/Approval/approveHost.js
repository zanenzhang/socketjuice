import axios from "../../api/axios";
const VERIFY_URL = '/verifyuser/approvehost';

async function approveHost(userId, authUserId, accessToken) {

    try {
        const response = await axios.post(VERIFY_URL, 
            JSON.stringify({userId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`, 
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

export default approveHost