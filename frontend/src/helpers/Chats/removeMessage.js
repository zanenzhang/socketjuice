import axios from "../../api/axios";
const MESSAGES_URL = '/messages'

async function removeMessage(messageId, chatId, loggedUserId, loggedFirstName, accessToken) {

    try {
        const response = await axios.delete(MESSAGES_URL,
            {
                params: {
                    messageId, chatId, loggedUserId, loggedFirstName
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

export default removeMessage


