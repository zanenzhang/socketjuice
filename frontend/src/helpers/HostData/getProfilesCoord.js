import axios from "../../api/axios";

async function getHostProfilesCoord(coordinatesInput, loggedUserId, accessToken)  {

    try {
        const response = await axios.get('/profile/hostcoord/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {coordinatesInput: JSON.stringify(coordinatesInput), loggedUserId }});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getHostProfilesCoord