import axios from "../../api/axios";
const EMAILS_ORDERS_URL = '/emails/orders'

async function addEmailOrders(loggedUserId, orderId, message, accessToken) {

    try {
        const response = await axios.post(EMAILS_ORDERS_URL, 
            JSON.stringify({loggedUserId, message, orderId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
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

export default addEmailOrders


