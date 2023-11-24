import axios from "../../api/axios";
const MESSAGES_URL = '/messages'

async function addMessage (loggedUserId, chatId, content, accessToken) {

    console.log(loggedUserId, chatId, content)

    try {
        
        const response = await axios.post(MESSAGES_URL, 
            JSON.stringify({loggedUserId, chatId, content}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default addMessage


