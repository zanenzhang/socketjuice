import axios from "../../api/axios";
const USER_SETTINGS_PROFILE_URL = '/profile/profilepic'

async function editProfilePic (loggedUserId, profilePicKey, profilePicURL, accessToken) {

    try {
        const response = await axios.patch(USER_SETTINGS_PROFILE_URL, 
            JSON.stringify({loggedUserId, profilePicKey, profilePicURL}),
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


export default editProfilePic