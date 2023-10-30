import axios from "../../api/axios";
const USER_SETTINGS_GENERAL_URL = '/profile/usergeneral'

async function editSettingsGeneral (loggedUserId, lessMotion, privacySetting, 
    currency, language, showFXPriceSetting, pushNotifications, userTheme, userOrStore, 
    gender, accessToken ) {

    try {
        const response = await axios.patch(USER_SETTINGS_GENERAL_URL, 
            JSON.stringify({loggedUserId, lessMotion, privacySetting, currency, language,
                showFXPriceSetting, pushNotifications, userTheme, userOrStore, gender}),
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


export default editSettingsGeneral
