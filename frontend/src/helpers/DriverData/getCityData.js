import axios from "../../api/axios";

async function getCityData (citySearch ) {

    try {
        const response = await axios.get('/cities/', 
        {
            params: {
                citySearch,
              }
        });
        
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default getCityData