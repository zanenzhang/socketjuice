import axios from "../../api/axios";
const ORDER_URL = '/payments/capture'

async function capturePaypalOrder (orderID, userId, accessToken) {

    console.log(orderID, userId, accessToken)

    try {
        
        const response = await axios.post(ORDER_URL, 
            JSON.stringify({orderID, userId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
    }

}

export default capturePaypalOrder