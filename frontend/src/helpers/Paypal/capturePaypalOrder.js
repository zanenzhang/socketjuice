import axios from "../../api/axios";
const ORDER_URL = '/payments/capture'

async function capturePaypalOrder (orderId, userId, accessToken) {

    console.log(orderId, userId, accessToken)

    try {
        
        const response = await axios.post(ORDER_URL, 
            JSON.stringify({orderId, userId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
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

export default capturePaypalOrder