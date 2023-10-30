import axios from "../../api/axios";
const NOTI_URL = '/notification/readrecent'

async function editReadRecent(notificationId, loggedUserId, accessToken) {

    try {
        const response = await axios.patch(NOTI_URL, 
            JSON.stringify({notificationId, loggedUserId}),
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

export default editReadRecent