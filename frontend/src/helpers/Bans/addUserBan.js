import axios from "../../api/axios";
const BAN_URL = '/profile/ban'

async function addUserBan (userId, bannedUserId, accessToken) {

    try {
        
        const response = await axios.post(BAN_URL, 
            JSON.stringify({userId, bannedUserId }),
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

export default addUserBan