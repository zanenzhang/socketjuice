import { useContext } from "react";
import AuthContext from "../context/authprovider";

const useNewMessages = () => {
    const { newMessages } = useContext(AuthContext);
    return useContext(AuthContext);
}

export default useNewMessages;