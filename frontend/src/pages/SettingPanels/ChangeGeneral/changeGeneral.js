import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth'
import Box from "@material-ui/core/Box";
import { makeStyles, withStyles, Switch } from "@material-ui/core";

import editSettingsGeneral from "../../../helpers/UserData/editSettingsGeneral";

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function ChangeGeneral({loggedUserId }) {

    const useStyles = makeStyles({
        appContainer: {
          display: "flex",
          flexDirection: "row",
          width: "93vw",
          height: "100vh"
        },
      
        container: {
          display: "flex",
          justifyContent: "center",
          height: "100%",
          width: "100%"
        },
        panel: {
          width: "100%"
        }
      });
      
      const CustomSwitch = withStyles({
          switchBase: {
            color: 'black',
            '&$checked': {
              color: '#8BEDF3',
            },
            '&$checked + $track': {
              backgroundColor: '#8BEDF3',
            },
          },
          checked: {},
          track: {},
        })(Switch);
        
    const { setAuth, auth } = useAuth();
    const classes = useStyles();
    
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [privacySetting, setPrivacySetting] = useState(false)
    const [privacyChecked, setPrivacyChecked] = useState(false)
    const [genderSetting, setGenderSetting] = useState(false)
    const [genderChecked, setGenderChecked] = useState(false)
    const [currency, setCurrency] = useState("CAD")
    const [language, setLanguage] = useState("English");
    const [showFXPriceSetting, setShowFXPriceSetting] = useState(null)
    const [showFXPriceSettingChecked, setShowFXPriceSettingChecked] = useState(null)
    const [lessMotion, setLessMotion] = useState(null)
    const [pushNotifications, setPushNotifications] = useState(null)
    const [userTheme, setUserTheme] = useState(null)
    const [validTheme, setValidTheme] = useState(false);
    const [userOrStore, setUserOrStore] = useState(null)

    const THEME_REGEX = /^[a-zA-Z ]{2,12}$/;

    useEffect( () => {

        if(auth?.roles?.includes(3780)){
    
            setUserOrStore(2)
    
        } else {
            setUserOrStore(1)
        }
    
      }, [auth.roles])


    useEffect(() => {
        setValidTheme(THEME_REGEX.test(userTheme));
    }, [userTheme])


    useEffect( ()=> {

        if(auth.privacySetting === 1){

            setPrivacySetting(1);
            setPrivacyChecked(false);
        
        } else {
            setPrivacySetting(2);
            setPrivacyChecked(true);
        }

        if(auth.genderSet){

          if(auth.gender === 'Male' || auth.gender === 'male'){
            
            setGenderSetting("male")
            setGenderChecked(true);

          } else {

            setGenderSetting("female")
            setGenderChecked(false);
          }
        } 

    }, [auth])

    
    // useEffect( ()=> {

    //     if(auth.currency){

    //         setCurrency(auth.currency);
    //     } 

    // }, [auth.currency])

    useEffect( () => {

        setCurrency("CAD")

    }, [])


    useEffect( ()=> {

        if(auth.showFXPriceSetting === 1){

            setShowFXPriceSetting(1);
            setShowFXPriceSettingChecked(false);
        
        } else {
            
            setShowFXPriceSetting(2);
            setShowFXPriceSettingChecked(true);
        }

    }, [auth.showFXPriceSetting])

    useEffect( ()=> {

        if(auth.lessMotion){
            setLessMotion(true);
        } else {
            setLessMotion(false);
        }

    }, [auth.lessMotion])

    useEffect( ()=> {

        if(auth.pushNotifications){
            setPushNotifications(true);
        } else {
            setPushNotifications(false);
        }

    }, [auth.pushNotifications])

    useEffect( ()=> {

        if(auth.userTheme){

            setUserTheme(auth.userTheme)
        
        } else {
            setUserTheme("light")
        }

    }, [auth.userTheme])

    const handleLessMotion = (e) => {
        setLessMotion(e.target.checked)
    }

    const handleGender = (e) => {
        setGenderChecked(e.target.checked)
        if(e.target.checked){
            setGenderSetting('male')
        } else {
            setGenderSetting("female")
        }
    }

    const handleLanguage = (e) => {
        setLanguage(e.target.value)
    }

    const handlePrivacySetting = (e) => {

        if(userOrStore === 2){
            return
        }

        if(e.target.checked === true){
            setPrivacySetting(2)
        } else {
            setPrivacySetting(1)
        }
        setPrivacyChecked(e.target.checked);
    }

    const handleShowFXSetting = (e) => {

        if(e.target.checked === true){
            setShowFXPriceSetting(2)
        } else {
            setShowFXPriceSetting(1)
        }
        setShowFXPriceSettingChecked(e.target.checked);
    }

    const handlePushNotifications = (e) => {
        setPushNotifications(e.target.checked)
    }

    const handleCurrency = (e) => {
        setCurrency(e.target.value)
    }

    const handleUserTheme = (e) => {
        setUserTheme(e.target.value)
    }

    async function handleSubmit(e) {

        e.preventDefault();
        if(isLoading){
            return
        }
        setIsLoading(true);

        try {
            
            const editedSettings = await editSettingsGeneral(loggedUserId, lessMotion, 
                privacySetting, currency, language, showFXPriceSetting, pushNotifications, userTheme, 
                userOrStore, genderSetting, auth.accessToken)

            if(editedSettings){

                setAuth(prev => {
                    return {
                        ...prev,
                        privacySetting: privacySetting,
                        currency: currency,
                        showFXPriceSetting: showFXPriceSetting,
                        lessMotion: lessMotion,
                        pushNotifications: pushNotifications,
                        userTheme: userTheme,
                        gender: genderSetting,
                        genderSet: true
                    }

                });

                setIsLoading(false);
                setSuccess(true);
                toast.success("Success! Saved changes!", {
                    position: "bottom-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                    });
            }

        } catch (err) {
            setIsLoading(false);
            console.error(err);
        }
    };

  
    return (
        
        <>
        <Box
            className={classes.container}
        >

            <div className='flex w-full flex-col items-center content-center'>

                <div className='flex flex-col md:justify-center px-6'>

                    {userOrStore !== 2 && <div className="pt-2 flex flex-col w-[300px]">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Current Profile Privacy</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <CustomSwitch checked={privacyChecked} onChange={handlePrivacySetting} 
                                />
                            } label={`${privacyChecked ? 'Private (Approve Follows)' : 'Public (Open To All)'}`} />        
                        </div>
                    </div>}

                    <div className="pt-2 flex flex-col w-[300px]">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Gender</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <CustomSwitch checked={genderChecked} onChange={handleGender} 
                                />
                            } label={`${genderChecked ? 'Male' : 'Female'}`} />        
                        </div>
                    </div>

                    <div className='w-[300px] flex flex-col pt-4'>
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Home Currency</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <select 
                                disabled={true}
                                onChange={handleCurrency}
                                value={currency}
                                className={`text-sm w-full mr-4 h-10 ${currency === "CAD" ? "text-gray-400" : "text-black" }
                                border border-gray-primary mb-2 rounded focus:outline-[#8BEDF3] pl-3
                                `}
                                >
                                <option value="CAD">$CAD</option>
                                <option value="USD">$USD</option>
                                <option value="EUR">€EUR</option>
                                <option value="GBP">£GBP</option>
                                <option value="INR">₹INR</option>
                                <option value="JPY">¥JPY</option>
                                <option value="CNY">¥CNY</option>
                                <option value="AUD">$AUD</option>
                                <option value="NZD">$NZD</option>
                                <option value="ADA">₳ADA</option>
                                <option value="ETH">ΞETH</option>
                                <option value="DOGE">ƉDOGE</option>

                            </select> 
                        </div>
                    </div>

                    <div className='w-[300px] flex flex-col pt-4'>
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Language</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <select 
                                onChange={handleLanguage}
                                value={language}
                                className={`text-sm w-full mr-4 h-10 ${language === "English" ? "text-gray-400" : "text-black" }
                                border border-gray-primary mb-2 rounded focus:outline-[#8BEDF3] pl-3
                                `}
                                >
                                <option key={"English"} value={"English"}>{"English"}</option>
                                <option key={`French`} value={'French'}>{"Français"}</option>
                                <option disabled={true} key={`Chinese`} value={'Chinese'}>{"中文"}</option>
                                <option disabled={true} key={`Spanish`} value={'Spanish'}>{"Español"}</option>

                            </select> 
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col w-[300px]">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Show Foreign Prices</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <CustomSwitch checked={showFXPriceSettingChecked} onChange={handleShowFXSetting} disabled={true}/>
                            } label={`${showFXPriceSettingChecked ? 'Show Foreign Prices' : 'Show Home Currency Prices'}`} 
                               />        
                        </div>
                    </div>
                
                    <div className="w-full flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Toggle Animations</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <Switch checked={lessMotion} onChange={handleLessMotion} disabled={true}/>
                            } label="Less Motion" />
                        </div>
                    </div>

                    <div className="w-[300px] flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Toggle Push Notifications</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <Switch checked={pushNotifications} onChange={handlePushNotifications} disabled={true} />
                            } label="Push Notifications" />
                        </div>
                    </div>

                    <div className="w-[300px] flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Select Background Style</label>
                        </div>
                        <div className='flex justify-start pl-4 gap-x-2'>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                name="radio-buttons-group"
                                defaultValue={userTheme}
                                value={userTheme}
                                onChange={handleUserTheme}
                                disabled={true}
                            >
                                <FormControlLabel value="light" control={<Radio />} label="&nbsp; Light Theme" disabled={true} />
                                <FormControlLabel value="dark" control={<Radio />} label="&nbsp; Dark Theme" disabled={true}/>
                                <FormControlLabel value="coffee" control={<Radio />} label="&nbsp; Coffee Theme" disabled={true}/>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className='pt-6 flex justify-center'>
                        <button onClick={(e)=>handleSubmit(e)}
                            className={`align-center mb-4 px-3 py-4 text-[#8BEDF3] 
                            border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                            hover:bg-[#8BEDF3] hover:text-white flex justify-center items-center gap-x-3`}
                            disabled={ ( isLoading || success || !validTheme ) ? true : false}
                            >
                                {isLoading && 
                                <div aria-label="Loading..." role="status">
                                    <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                                    <path
                                        className="fill-gray-200"
                                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                                    <path
                                        className="fill-[#00D3E0]"
                                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                                    </svg>
                                </div>
                            }
                                Save Changes
                        </button>
                    </div>
                    
                </div>
            </div>
        </Box>

        <ToastContainer
        toastStyle={{ backgroundColor: "#8BEDF3" }}
            position="bottom-center"
            autoClose={1500}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            />
        </>
    );
}




