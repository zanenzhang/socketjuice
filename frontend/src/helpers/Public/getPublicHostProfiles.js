import axios from "../../api/axios";

async function getPublicHostProfilesCoord(coordinatesInput)  {

    try {
        const response = await axios.get('/public/hostcoord/',
        {
            params: {coordinatesInput: JSON.stringify(coordinatesInput) }});

        if(response){
            return response
        }

    } catch (err) {
        console.error(err);
        return
    }
}

export default getPublicHostProfilesCoord