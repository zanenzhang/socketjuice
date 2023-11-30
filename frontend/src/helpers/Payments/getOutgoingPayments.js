import axios from "../../api/axios";

async function getOutgoingPayments (userId, pageNumber, dateStart, dateEnd, accessToken, authUserId) {

    console.log(userId, pageNumber, dateStart, dateEnd,)

    try {
        const response = await axios.get('/payments/outgoing/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId, pageNumber, dateStart, dateEnd
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

export default getOutgoingPayments