import axios from "../../api/axios";

async function getGoogleCoordinates (placeId, userId, accessToken) {

    try {

        const response = await axios.get('/google/coordinates/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
            params: {
                placeId, userId
            }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getGoogleCoordinates