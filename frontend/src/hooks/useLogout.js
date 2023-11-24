import axios from "../api/axios";
import useAuth from "./useAuth";

const useLogout = () => {

    const { setAuth, auth, setSocket, setBrowse } = useAuth();

    const logout = async () => {
        
        setAuth("");
        setSocket("");

        try {
            
            const response = await axios.get('/logout', {
                params: {loggedUserId: auth.userId},
                withCredentials: true
            });

            if(response){
                return response
            }

        } catch (err) {
            console.error(err);
        }
    }

    return logout;
}

export default useLogout