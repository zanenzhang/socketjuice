import axios from "../../api/axios";

async function getNotifications(userId, pageNumber, accessToken) {

    try {
        const response = await axios.get('/notification', 
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
                params: {userId, pageNumber} 
            });
        if(response){
            return response
        }
        
    } catch (err) {
        console.error(err);
    }
    
}

export default getNotifications