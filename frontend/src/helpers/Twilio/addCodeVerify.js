import axios from "../../api/axios";
const REQUEST_URL = '/twilio/check';

async function addCodeVerify(number, code, userId, hash) {

    try {
        const response = await axios.post(REQUEST_URL, 
            JSON.stringify({number, code, userId}),
            {
                headers: { "Authorization": `Hash ${hash} ${userId}`, 
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

export default addCodeVerify
