import axios from "../../api/axios";
const BOOKMARK_URL = '/bookmark'

async function addBookmark (userId, hostUserId, accessToken) {

    try {
        
        const response = await axios.post(BOOKMARK_URL, 
            JSON.stringify({userId, hostUserId}),
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

export default addBookmark


