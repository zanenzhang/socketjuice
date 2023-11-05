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
