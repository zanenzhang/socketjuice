import axios from "../../api/axios";
const REQUEST_URL = '/twilio/send';

async function addCodeRequest(number, userId, phoneCountry, hash) {

    try {
        const response = await axios.post(REQUEST_URL, 
            JSON.stringify({number, phoneCountry, userId}),
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

export default addCodeRequest
