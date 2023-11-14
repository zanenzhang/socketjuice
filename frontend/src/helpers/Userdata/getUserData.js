import axios from "../../api/axios";

async function getUserData (userId, accessToken, authUserId) {

    try {
        const response = await axios.get('/profile/userdata/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getUserData