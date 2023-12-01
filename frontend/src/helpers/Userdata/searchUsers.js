import axios from "../../api/axios";

async function searchUsers (firstName, lastName, userId, accessToken) {

    try {
        const response = await axios.get('/profile/searchusers/', 
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
            params: {
                firstName, lastName, userId
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default searchUsers