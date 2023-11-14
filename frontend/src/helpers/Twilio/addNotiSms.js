import axios from "../../api/axios";
const REQUEST_URL = '/twilio/noti';

async function addNotiSms(receivingUserId, notificationType, authUserId, accessToken) {

    try {
        const response = await axios.post(REQUEST_URL, 
            JSON.stringify({receivingUserId, notificationType}),
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

export default addNotiSms
