import axios from "../../api/axios";

async function checkStage(userId, hash) {

    try {
        const response = await axios.get('/profile/stage', 
        {
            headers: { "Authorization": `Hash ${hash} ${userId}`},
            params: {
                userId
            }
        });

        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }
}

export default checkStage