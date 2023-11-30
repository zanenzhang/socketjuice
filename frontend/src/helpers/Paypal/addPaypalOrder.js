import axios from "../../api/axios";
const ORDER_URL = '/payments/order'

async function addPaypalOrder (currency, selectedOption, userId, accessToken) {

    console.log(currency, selectedOption)

    var cart = [
        {
            id: "PAYPAL_RELOAD",
            quantity: "1",
            currency: currency,
            option: `${selectedOption}`
        },
    ]

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