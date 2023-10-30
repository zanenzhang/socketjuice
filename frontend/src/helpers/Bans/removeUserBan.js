import axios from "../../api/axios";
const BAN_URL = '/profile/ban'

async function removeUserBan(userId, bannedUserId, accessToken) {

    try {
        const response = await axios.delete(BAN_URL,
            {
                params: {
                    userId, bannedUserId
                },
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if (response){
            return response;
        }
        
    } catch (err) {
        console.error(err);
    }
}

export default removeUserBan
