import { useContext, useDebugValue } from "react";
import AuthContext from "../context/authprovider";

const useAuth = () => {
    const { auth } = useContext(AuthContext);
    useDebugValue(auth, auth => auth?.userId ? "Logged In" : "Logged Out")
    return useContext(AuthContext);
}

export default useAuth;