import axios from "../../api/axios";
const APPOINTMENT_URL = '/appointment/completion/'

async function addAppointmentCompletion (userId, hostUserId, appointmentId, accessToken) {

    try {
        
        const response = await axios.post(APPOINTMENT_URL, 
            JSON.stringify({userId, hostUserId, appointmentId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
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

export default addAppointmentCompletion