import axios from "../../api/axios";
const SUBMIT_URL = '/payments/newpayout'

async function addNewPayout (userId, accessToken) {

    try {
        
        const response = await axios.post(SUBMIT_URL, 
            JSON.stringify({userId}),
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

export default addNewPayout