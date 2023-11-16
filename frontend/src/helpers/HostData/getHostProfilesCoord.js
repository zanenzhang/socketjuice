import axios from "../../api/axios";

async function getHostProfilesCoord(coordinatesInput, dayofweek, localtime, loggedUserId, accessToken)  {

    try {
        const response = await axios.get('/profile/hostcoord/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {coordinatesInput: JSON.stringify(coordinatesInput), loggedUserId,
                dayofweek, localtime }});

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getHostProfilesCoord