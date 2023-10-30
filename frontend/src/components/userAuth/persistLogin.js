import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from '../../hooks/useRefreshToken';
import useAuth from '../../hooks/useAuth';

const PersistLogin = () => {
    
    const { auth, persist } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const refresh = useRefreshToken();
    
    useEffect(() => {
        
        let isMounted = true;

        const verifyRefreshToken = async () => {
            try {
                await refresh();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                if(isMounted){
                    setIsLoading(false);
                };
            }
        }

        (!auth?.accessToken && persist) ? verifyRefreshToken() : setIsLoading(false);

        return () => isMounted = false;
    
    }, [])


    return (
        <>
            { !persist
                ? <Outlet />
                : isLoading
                    ? <p>Loading...</p>
                    : <Outlet />
            }
        </>
    )
}

export default PersistLogin