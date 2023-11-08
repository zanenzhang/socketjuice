import axios from "../../api/axios";
const APPOINTMENT_URL = '/appointment/approval/'

async function addAppointmentApproval (userId, hostUserId, appointmentStart, appointmentEnd, accessToken) {

    try {
        
        const response = await axios.post(APPOINTMENT_URL, 
            JSON.stringify({userId, hostUserId, appointmentStart, appointmentEnd}),
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

export default addAppointmentApproval

