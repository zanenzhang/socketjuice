import axios from "../../api/axios";

async function getHostsCheck (authUserId, accessToken) {

    try {
        const response = await axios.get('/verifyuser/hostscheck', 
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

export default getHostsCheck