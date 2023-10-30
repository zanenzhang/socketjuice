import axios from "../../api/axios";
const FLAG_URL = '/flag/user'

async function addUserFlag (loggedUserId, profileUserId, accessToken) {

    try {
        
        const response = await axios.post(FLAG_URL, 
            JSON.stringify({loggedUserId, profileUserId}),
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

export default addUserFlag


