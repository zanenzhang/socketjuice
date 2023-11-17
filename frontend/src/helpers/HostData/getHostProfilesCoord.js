import axios from "../../api/axios";

async function getHostProfilesCoord(coordinatesInput, dayofweek, localtime, j1772ACChecked, ccs1DCChecked, 
    mennekesACChecked, ccs2DCChecked, chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked, loggedUserId, accessToken)  {

    try {
        const response = await axios.get('/profile/hostcoord/',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`},
            params: {coordinatesInput: JSON.stringify(coordinatesInput), loggedUserId,
                dayofweek, localtime, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, chademoDCChecked, 
                gbtACChecked, gbtDCChecked, teslaChecked }});

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getHostProfilesCoord