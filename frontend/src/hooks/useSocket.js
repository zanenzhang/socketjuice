import { useContext } from "react";
import AuthContext from "../context/authprovider";

const useSocket = () => {
    const { socket } = useContext(AuthContext);
    return useContext(AuthContext);
}

export default useSocket;