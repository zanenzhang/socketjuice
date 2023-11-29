import axios from "../../api/axios";

async function getIncomingPayments (userId, pageNumber, dateStart, dateEnd, accessToken, authUserId) {

    try {
        const response = await axios.get('/payments/incoming/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId, pageNumber, dateStart, dateEnd
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getIncomingPayments