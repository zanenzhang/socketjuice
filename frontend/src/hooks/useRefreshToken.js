import axios from '../api/axios';
import useAuth from './useAuth';

const useRefreshToken = () => {
    
    const { setAuth, setBrowse } = useAuth();

    const refresh = async () => {
        const response = await axios.get('/refresh', {
            withCredentials: true
        });

        if(response?.status === 200){

            setBrowse('no');

            setAuth(prev => {
            
                return {
                    ...prev,
                    
                    userId: response.data.userId,
                    roles: response.data.roles,
                    
                    accessToken: response.data.accessToken,
                    profilePicURL: response.data.profilePicURL,
                    privacySetting: response.data.privacySetting,
                    currency: response.data.currency,
                    FXRates: response.data.FXRates,
                    
                    userTheme: response.data.userTheme,
                    credits: response.data.credits,

                    j1772ACChecked: response.data.j1772ACChecked,
                    ccs1DCChecked: response.data.ccs1DCChecked,
                    mennekesACChecked: response.data.mennekesACChecked,
                    ccs2DCChecked: response.data.ccs2DCChecked,
                    chademoDChecked: response.data.chademoDChecked,
                    gbtACChecked: response.data.gbtACChecked,
                    gbtDCChecked: response.data.gbtDCChecked,
                    teslaChecked: response.data.teslaChecked
                }
            });

            return response.data.accessToken;
        
        } else {
            setBrowse('yes');
        }
    }
    return refresh;
};

export default useRefreshToken;
