import axios from "../../api/axios";

async function getBookmarks (userId, pageNumber, accessToken, authUserId) {

    try {
        const response = await axios.get('/bookmark/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId, pageNumber
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getBookmarks