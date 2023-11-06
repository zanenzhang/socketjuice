import axios from "../../api/axios";

async function getHostAppointments (userId, currentDate, accessToken, authUserId) {

    try {
        const response = await axios.get('/appointment/host/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${authUserId}`},
            params: {
                userId, currentDate
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getHostAppointments