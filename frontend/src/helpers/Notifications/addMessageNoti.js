import axios from "../../api/axios";
const NOTI_URL = '/notification/addmessage';

async function addMessageNoti (sendingUserId, chatId, authUserId, accessToken) {

    try {
        const response = await axios.post(NOTI_URL, 
            JSON.stringify({sendingUserId, chatId }),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response
        }
        
    } catch (err) {
        console.error(err);
    }
    
}

export default addMessageNoti
