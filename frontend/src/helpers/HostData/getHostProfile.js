import axios from "../../api/axios";

async function getHostProfile(profileUserId, loggedUserId, userOrStore, ipAddress, accessToken)  {

    try {
        const response = await axios.get('/profile/host/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {profileUserId, loggedUserId, userOrStore, ipAddress }});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getHostProfile