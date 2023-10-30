import axios from "../../api/axios";

async function getHostPrefix(storename, accessToken, userId) {

    try {

        const response = await axios.get('/autocomplete/hostname',
        {
            headers: { "Authorization": `Bearer ${accessToken} ${userId}`},
            params: { storename
          }});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
    }

}

export default getHostPrefix