import axios from "../../api/axios";
const VERIFY_URL = '/verifyuser/approvephone';

async function approvePhone(userId, phoneNumber, accessToken) {

    try {
        const response = await axios.post(VERIFY_URL, 
            JSON.stringify({userId, phoneNumber}),
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

export default approvePhone
