import axios from "../../api/axios";

async function getSingleChat(chatId, accessToken, userId) {

    try {
        const response = await axios.get('/singlechat/' + chatId, 
        {headers: { "Authorization": `Bearer ${accessToken} ${userId}`}});

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getSingleChat