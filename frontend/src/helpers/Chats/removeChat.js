import axios from "../../api/axios";
const CHATS_URL = '/chats/remove'

async function removeChat(chatId, userId, accessToken) {

    try {
        const response = await axios.delete(CHATS_URL,
            {
                params: {
                    chatId, userId
                },
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
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

export default removeChat


