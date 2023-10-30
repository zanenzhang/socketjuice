import axios from "../../api/axios";
const NOTI_URL = '/notification/openedalert'

async function editOpenedAlert(userId, accessToken) {

    try {
        const response = await axios.patch(NOTI_URL, 
            JSON.stringify({userId}),
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

export default editOpenedAlert