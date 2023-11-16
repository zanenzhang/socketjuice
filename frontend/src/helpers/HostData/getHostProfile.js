import axios from "../../api/axios";

async function getHostProfile(loggedUserId, accessToken)  {

    try {
        const response = await axios.get('/profile/host/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {loggedUserId }});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getHostProfile