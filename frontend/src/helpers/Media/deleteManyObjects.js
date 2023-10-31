import axios from "../../api/axios";
const S3_DELETE_URL = '/s3/deletemany'

async function deleteManyObj (ObjectIdArray, userId, accessToken) {

    try {
        
        const response = await axios.delete(S3_DELETE_URL, 
            {
                data: {
                    userId,
                    ObjectIdArray
                },
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );
        if(response){
            return response.data
        }

    } catch (err) {
        console.error(err);
    }

}

export default deleteManyObj