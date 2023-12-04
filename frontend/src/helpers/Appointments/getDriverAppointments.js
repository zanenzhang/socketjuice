import axios from "../../api/axios";

async function getDriverAppointments (userId, currentDate, accessToken, authUserId) {

    console.log(userId, currentDate)

    try {
        const response = await axios.get('/appointment/driver/', 
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

export default getDriverAppointments