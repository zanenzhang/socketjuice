import axios from "../../api/axios";
const SALE_URL = '/payments/sale';

async function addSale (userId, nonce, currency, paymentAmount, authUserId, accessToken) {

    try {
        const response = await axios.post(SALE_URL, 
            JSON.stringify({userId, nonce, currency, paymentAmount }),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`, 
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

export default addSale
