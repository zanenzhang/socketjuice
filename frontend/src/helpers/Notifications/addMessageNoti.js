import axios from "../../api/axios";
const NOTI_URL = '/notification/addmessage';

async function addMessageNoti (loggedUserId, chatId, accessToken) {

    try {
        const response = await axios.post(NOTI_URL, 
            JSON.stringify({loggedUserId, chatId }),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
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