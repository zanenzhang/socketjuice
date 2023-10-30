import axios from "../../api/axios";
const HOST_SETTINGS_PROFILE_URL = '/profile/hostsettings'

async function editSettingsHostProfile (loggedUserId, phonePrimary, profilePicKey, profilePicURL, 
    regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, 
    regularHoursThursdayFinish, regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
    closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, address, city, region, regionCode, country, accessToken) {

    try {
        const response = await axios.patch(HOST_SETTINGS_PROFILE_URL, 
            JSON.stringify({loggedUserId, phonePrimary, profilePicKey, profilePicURL,  
                regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, 
                regularHoursThursdayFinish, regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
                closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, address, city, region, regionCode, country }),
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


export default editSettingsHostProfile
