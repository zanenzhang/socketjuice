import axios from "../../api/axios";
const APPOINTMENT_URL = '/appointment/approval/'

async function addAppointmentApproval (userId, directionsURL, hostUserId, appointmentId, accessToken) {

    try {
        
        const response = await axios.post(APPOINTMENT_URL, 
            JSON.stringify({userId, directionsURL, hostUserId, appointmentId}),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${hostUserId}`, 
                    'Content-Type': 'application/json'},
            }
        );
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default addAppointmentApproval


