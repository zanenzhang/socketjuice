import axios from "../../api/axios";
const CHATS_URL = '/chats/new'

async function addChat (participantsList, loggedUserId, accessToken) {

    try {
        
        const response = await axios.post(CHATS_URL, 
            JSON.stringify({participantsList}),
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

export default addChat


