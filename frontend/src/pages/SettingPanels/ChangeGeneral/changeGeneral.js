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
    
    const [currency, setCurrency] = useState("CAD")
    const [language, setLanguage] = useState("English");

    const [pushNotifications, setPushNotifications] = useState(null)
    const [emailNotifications, setEmailNotifications] = useState(null)
    const [smsNotifications, setSmsNotifications] = useState(null)


    useEffect( ()=> {

        if(auth.pushNotifications){
            setPushNotifications(true);
        } else {
            setPushNotifications(false);
        }

    }, [auth.pushNotifications])


    useEffect( ()=> {

        if(auth.emailNotifications){
            setEmailNotifications(true);
        } else {
            setEmailNotifications(false);
        }

    }, [auth.emailNotifications])


    useEffect( ()=> {

        if(auth.smsNotifications){
            setSmsNotifications(true);
        } else {
            setSmsNotifications(false);
        }

    }, [auth.smsNotifications])


    const handleLanguage = (e) => {
        setLanguage(e.target.value)
    }

    const handlePushNotifications = (e) => {
        setPushNotifications(e.target.checked)
    }

    const handleEmailNotifications = (e) => {
        setEmailNotifications(e.target.checked)
    }

    const handleSmsNotifications = (e) => {
        setSmsNotifications(e.target.checked)
    }

    const handleCurrency = (e) => {
        setCurrency(e.target.value)
    }

    async function handleSubmit(e) {

        e.preventDefault();
        if(isLoading){
            return
        }
        setIsLoading(true);

        try {
            
            const editedSettings = await editSettingsGeneral( privacySetting, currency, language, 
                pushNotifications, emailNotifications, smsNotifications, auth.accessToken)

            if(editedSettings){

                setAuth(prev => {
                    return {
                        ...prev,
                        pushNotifications: pushNotifications,
                        emailNotifications: emailNotifications,
                        smsNotifications: smsNotifications,
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

                    <div className="w-[300px] flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Toggle Email Notifications</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <Switch checked={emailNotifications} onChange={handleEmailNotifications} />
                            } label="Push Notifications" />
                        </div>
                    </div>

                    <div className="w-[300px] flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Toggle Push Notifications</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <Switch checked={pushNotifications} onChange={handlePushNotifications} />
                            } label="Push Notifications" />
                        </div>
                    </div>

                    <div className="w-[300px] flex flex-col pt-4">
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>SMS(Text Message) Notifications</label>
                        </div>
                        <div className='flex justify-start pl-2'>
                            <FormControlLabel control={
                                <Switch checked={smsNotifications} onChange={handleSmsNotifications} />
                            } label="Push Notifications" />
                        </div>
                    </div>


                    <div className='w-[300px] flex flex-col pt-4'>
                        <div className='flex justify-start'>
                            <label className='text-lg font-medium'>Currency</label>
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

                    {/* <div className='w-[300px] flex flex-col pt-4'>
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
                    </div> */}

                
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




