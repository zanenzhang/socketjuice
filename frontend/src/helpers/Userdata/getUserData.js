import axios from "../../api/axios";

async function getUserData (accessToken, userId) {

    try {
        const response = await axios.get('/profile/userdata/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
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