import axios from "../../api/axios";

async function getAppointmentFlagsAdmin(userId, accessToken) {

    try {
        const response = await axios.get('/flag/appointmentadmin/' + userId, 
        {headers: { "Authorization": `Bearer ${accessToken} ${userId}`}});
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getAppointmentFlagsAdmin