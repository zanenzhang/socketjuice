import axios from "../../api/axios";
const CHATS_URL = '/chats/mute'

async function editChatMute (loggedUserId, loggedFirstName, chatId, accessToken) {

    try {
        const response = await axios.patch(CHATS_URL, 
            JSON.stringify({ loggedUserId, loggedFirstName, chatId }),
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

export default editChatMute


