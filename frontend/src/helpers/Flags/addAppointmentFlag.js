import axios from "../../api/axios";
const FLAG_URL = '/flag/appointment'

async function addAppointmentFlag (loggedUserId, appointmentId, comment, accessToken) {

    try {
        
        const response = await axios.post(FLAG_URL, 
            JSON.stringify({loggedUserId, appointmentId, comment,}),
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

export default addAppointmentFlag


