import axios from "../../api/axios";

async function getAppointmentFlags(userId, accessToken) {

    try {
        const response = await axios.get('/flag/appointment/' + userId, 
        {headers: { "Authorization": `Bearer ${accessToken} ${userId}`}});
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default getAppointmentFlags