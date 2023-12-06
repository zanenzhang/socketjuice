import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from '../../hooks/useAuth';
import axios from "../../api/axios";


const PersistLogin = () => {
    
    const { auth, setAuth, persist } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        
        let isMounted = true;

        const verifyRefreshToken = async () => {
            try {
                const response = await axios.get('/refresh', {
                    withCredentials: true
                });
        
                if(response && response?.status === 200){

                    setAuth({
                    
                        userId: response?.data?.userId,
                        firstName: response?.data?.firstName,
                        lastName: response?.data?.lastName,
                        roles: response?.data?.roles,
                        accessToken: response?.data?.accessToken,
                        profilePicURL: response?.data?.profilePicURL,
                        privacySetting: response?.data?.privacySetting,
                        currency: response?.data?.currency,
                        currencySymbol: response?.data?.currencySymbol,
                        appointmentFlags: response?.data?.appointmentFlags,
        
                        FXRates: response?.data?.FXRates,
                        
                        userTheme: response?.data?.userTheme,
                        credits: response?.data?.credits,
                        escrow: response?.data?.escrow,
        
                        pushNotifications: response?.data?.pushNotifications,
                        smsNotifications: response?.data?.smsNotifications,
                        emailNotifications: response?.data?.emailNotifications,
        
                        requestedPayout: response?.data?.requestedPayout,
                        requestedPayoutCurrency: response?.data?.requestedPayoutCurrency,
                        requestedPayoutOption: response?.data?.requestedPayoutOption,
        
                        j1772ACChecked: response?.data?.j1772ACChecked,
                        ccs1DCChecked: response?.data?.ccs1DCChecked,
                        mennekesACChecked: response?.data?.mennekesACChecked,
                        ccs2DCChecked: response?.data?.ccs2DCChecked,
                        chademoDCChecked: response?.data?.chademoDCChecked,
                        gbtACChecked: response?.data?.gbtACChecked,
                        gbtDCChecked: response?.data?.gbtDCChecked,
                        teslaChecked: response?.data?.teslaChecked
                    });
                } 
            }
            catch (err) {
                console.error(err);
            }
            finally {
                isMounted && setIsLoading(false);
            }
        }

        (!auth.accessToken && persist) ? verifyRefreshToken() : setIsLoading(false);

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