import axios from "../../api/axios";
const BOOKMARK_URL = '/bookmark'

async function removeBookmark(userId, hostUserId, accessToken) {

    try {
        const response = await axios.delete(BOOKMARK_URL,
            {
                params: {
                    userId, hostUserId
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

export default removeBookmark
