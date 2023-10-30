import axios from "../../api/axios";
const CHATS_URL = '/chats/user'

async function addUserToChat (chatId, userId, username, participantsList, accessToken, loggedUserId) {

    try {
        
        const response = await axios.post(CHATS_URL, 
            JSON.stringify({chatId, userId, username, participantsList }),
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

export default addUserToChat


