import axios from "../../api/axios";
const CHATS_URL = '/chats/leave'

async function removeUserFromChat(loggedUserId, loggedUsername, chatId, accessToken) {

    try {

        const response = await axios.delete(CHATS_URL,
            {
                params: {
                    loggedUserId, loggedUsername, chatId
                },
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if (response){
            return response;
        }
        
    } catch (err) {
        console.error(err);
    }
}

export default removeUserFromChat


