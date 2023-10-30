import axios from "../../api/axios";
const CHECK_USER_URL = '/checkuser';

async function checkUser(email) {

    try {
        const response = await axios.get(CHECK_USER_URL, 
            {params:{email }},
            {
                withCredentials: true
            }
        );
        if (response){
            return response.data;
        }

    } catch (err) {
        console.error(err);
    }
}

export default checkUser
