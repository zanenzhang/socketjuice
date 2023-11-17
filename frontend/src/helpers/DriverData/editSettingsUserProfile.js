import axios from "../../api/axios";
const USER_SETTINGS_PROFILE_URL = '/profile/usersettings'

async function editSettingsUserProfile (loggedUserId, firstname, lastname, profilePicKey, profilePicURL, pushNotifications, 
    emailNotifications, smsNotifications, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, 
    chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked, accessToken) {

    try {
        const response = await axios.patch(USER_SETTINGS_PROFILE_URL, 
            JSON.stringify({loggedUserId, firstname, lastname, profilePicKey, profilePicURL, pushNotifications, 
                emailNotifications, smsNotifications, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, 
                chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked,}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        
        if(response){
            return response
        } 

    } catch (err) {
        console.error(err);
    }
}


export default editSettingsUserProfile







