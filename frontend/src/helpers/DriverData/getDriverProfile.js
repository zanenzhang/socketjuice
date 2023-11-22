import axios from "../../api/axios";

async function getDriverProfile(profileUserId, loggedUserId, accessToken)  {

    try {
        const response = await axios.get('/profile/driver/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {profileUserId, loggedUserId}});

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
        return 
    }
}

export default getDriverProfile