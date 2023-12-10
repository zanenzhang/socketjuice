import axios from "../../api/axios";
const PROMO_URL = '/profile/promo';

async function addPromoCode(loggedUserId, promoCode, accessToken) {

    try {
        const response = await axios.post(PROMO_URL, 
            JSON.stringify({loggedUserId, promoCode}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
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

export default addPromoCode