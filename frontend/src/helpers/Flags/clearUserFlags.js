import axios from "../../api/axios";
const FLAG_URL = '/flag/clearusers'

async function clearUserFlags(loggedUserId, profileUserId, accessToken) {

    try {
        const response = await axios.delete(FLAG_URL, 
            {
                params:{loggedUserId, profileUserId},
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

export default clearUserFlags


