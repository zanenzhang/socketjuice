import axios from "../../api/axios";

async function getUserStatus (accessToken, authUserId) {

    try {
        const response = await axios.get('/verifyuser/userstatus/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getUserStatus