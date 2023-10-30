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
                    username: response.data.username,
                    roles: response.data.roles,
                    userId: response.data.userId,
                    accessToken: response.data.accessToken,
                    profilePicURL: response.data.profilePicURL,
                    privacySetting: response.data.privacySetting,
                    currency: response.data.currency,
                    FXRates: response.data.FXRates,
                    showFXPriceSetting: response.data.showFXPriceSetting,
                    lessMotion: response.data.lessMotion,
                    pushNotifications: response.data.pushNotifications,
                    userTheme: response.data.userTheme,
                    city: response.data.city,
                    region: response.data.region,
                    country: response.data.country,
                    credits: response.data.credits,
                    genderSet: response.data.genderSet,
                    gender: response.data.gender,
                    retailerIds: response.data.retailerIds,
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
