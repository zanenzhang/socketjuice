import axios from "../../api/axios";
const PAYOUT_URL = '/payments/request'

async function addPayoutRequest (userId, currency, option, accessToken) {

    try {
        
        const response = await axios.post(PAYOUT_URL, 
            JSON.stringify({userId, currency, option}),
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

export default addPayoutRequest