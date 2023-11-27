import axios from "../../api/axios";
const ORDER_URL = '/payments/order'

async function addPaypalOrder (cart, userId, accessToken) {

    console.log(cart, userId, accessToken)

    try {
        
        const response = await axios.post(ORDER_URL, 
            JSON.stringify({cart, userId}),
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

export default addPaypalOrder