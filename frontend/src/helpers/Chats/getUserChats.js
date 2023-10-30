import axios from "../../api/axios";

async function getUserChats (userId, accessToken) {

    try {
        const response = await axios.get('/chats/' + userId, 
        {headers: { "Authorization": `Bearer ${accessToken} ${userId}`}});
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getUserChats