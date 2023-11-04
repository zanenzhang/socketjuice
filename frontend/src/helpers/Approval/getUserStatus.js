import axios from "../../api/axios";

async function getUserStatus (authUserId, accessToken) {

    try {
        const response = await axios.get('/verifyuser/userstatus', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            withCredentials: true
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getUserStatus