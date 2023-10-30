import axios from "../../api/axios";

async function getAllFlags(userId, accessToken) {

    try {
        const response = await axios.get('/flag/' + userId, 
        {headers: { "Authorization": `Bearer ${accessToken} ${userId}`}});
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getAllFlags