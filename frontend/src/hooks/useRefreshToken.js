import axios from '../api/axios';
import useAuth from './useAuth';

const useRefreshToken = () => {
    
    const { setAuth, auth } = useAuth();

    const refresh = async () => {

        const response = await axios.get('/refresh', {
            withCredentials: true
        });

        if(response && response?.status === 200){

            if(Object.keys(auth)?.length === 0){

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

            return response.data?.accessToken;
        
        } 
    }

    return refresh;
};

export default useRefreshToken;
