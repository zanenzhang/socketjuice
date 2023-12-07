import axios from "../../api/axios";

async function getPayoutRequests(authUserId, accessToken)  {

    try {
        const response = await axios.get('/payments/requests/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId: authUserId
              },
            withCredentials: true
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getPayoutRequests