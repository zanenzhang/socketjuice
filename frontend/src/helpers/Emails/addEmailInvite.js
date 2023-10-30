import axios from "../../api/axios";
const EMAIL_INVITATION_URL = '/invite/email'

async function addEmailInvitation(loggedUserId, roles, friendname, email, accessToken) {

    try {
        const response = await axios.post(EMAIL_INVITATION_URL, 
            JSON.stringify({loggedUserId, roles, friendname, email}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${loggedUserId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default addEmailInvitation


