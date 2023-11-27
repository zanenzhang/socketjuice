import axios from "../../api/axios";

async function getPaymentToken(loggedUserId, accessToken) {

    try {
        const response = await axios.get('/payments/token', 
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
                params: {loggedUserId},
                withCredentials: true
            });
        if(response){
            return response
        }
        
    } catch (err) {
        console.error(err);
    }
    
}

export default getPaymentToken