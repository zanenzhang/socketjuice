import axios from "../../api/axios";

async function getChatMessages(chatId, pageNumber, userId, accessToken) {

    try {
        const response = await axios.get('/messages', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`}, 
            params:{chatId, pageNumber}
        });

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getChatMessages