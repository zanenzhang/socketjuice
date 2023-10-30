import axios from "../../api/axios";

async function getDriverProfile(profileUserId, loggedUserId, userOrStore, ipAddress, accessToken)  {

    try {
        const response = await axios.get('/profile/driver/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {profileUserId, loggedUserId, ipAddress, userOrStore}});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
        return 
    }
}

export default getDriverProfile