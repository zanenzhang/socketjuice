import axios from "../../api/axios";

async function getGoogleMatrix (originString, destinationString, userId, accessToken) {

    try {
        const response = await axios.get('/google/matrix/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
            params: {
                originString, destinationString, userId
              }
        });
        
        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
    }

}

export default getGoogleMatrix