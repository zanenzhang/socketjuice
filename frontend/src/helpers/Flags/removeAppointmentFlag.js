import axios from "../../api/axios";
const FLAG_URL = '/flag/appointment'

async function removeAppointmentFlag(appointmentId, loggedUserId, accessToken) {

    try {
        
        const response = await axios.delete(FLAG_URL, 
            {
                params:{appointmentId},
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

export default removeAppointmentFlag
