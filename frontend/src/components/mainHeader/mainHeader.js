import React, {useState, useEffect, useRef, useMemo} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import axios from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import NotificationsDropdown from '../notifications/notificationsDropdown';
import SettingsDropdown from '../settings/settingsDropdown';

import GooglePlacesAutocomplete from "react-google-places-autocomplete";

import ReCAPTCHA from "react-google-recaptcha";
import { regionData } from '../listdata/regions';
import { countryData } from '../listdata/countries';
import debounce from 'lodash.debounce';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Tab from "@material-ui/core/Tab";
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";

import socketjuice_full_logo from "../../images/SocketJuice.png";
import editNewMessagesFill from '../../helpers/Notifications/editNewMessagesFill';
import checkUser from '../../helpers/DriverData/checkUser';


const MainHeader = ({loggedUserId} ) => {
    
    const navigate = useNavigate();

    const { auth, setAuth, persist, setPersist, newMessages, setNewMessages, activeTab  } = useAuth();
    const [openModalLogin, setOpenModalLogin] = useState(false);
    
    const [newMessagesFill, setNewMessagesFill] = useState(false);
    const [waiting, setWaiting] = useState(false);
    
    const [value, setValue] = useState("0");
    const [registerTab, setRegisterTab] = useState(true);
    const [loginTab, setLoginTab] = useState(false);
    const [inputType, setInputType] = useState("password");

    const [lat, setLat] = useState(0);
    const [long, setLong] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingEmail, setIsLoadingMail] = useState(false);
    const [resendActivate, setResendActivate] = useState(false);

    const RESEND_VERIFICATION_URL = '/resendverification/email';
    const LOGIN_URL = '/auth';
    const REGISTER_URL = '/hostregister';

    const EMAIL_REGEX = /^(?=^.{4,48}$)\S+@\S+\.\S+$/;
    const FIRST_NAME_REGEX = /^.{1,48}$/;
    const LAST_NAME_REGEX = /^.{1,48}$/;
    const PWD_REGEX = /^(?=(.*[0-9]))(?=.*[!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,48}$/;
    const BIRTHDATE_REGEX = /^[0-9]{4}[-]{1}[0-9]{2}[-]{1}[0-9]{2}$/;

    const ADDRESS_REGEX = /^.{4,250}$/;
    const CITY_REGEX = /^.{1,48}$/;
    const REGION_REGEX = /^.{2,48}$/;
    const COUNTRY_REGEX = /^.{4,48}$/;

    const [inputTypeLogin, setInputTypeLogin] = useState("password");
    const [emailLogin, setEmailLogin] = useState("");
    const [emailFocusLogin, setEmailFocusLogin] = useState(false);
    const [validEmailLogin, setValidEmailLogin] = useState(false);
    
    const [pwdLogin, setPwdLogin] = useState("");
    const [pwdFocusLogin, setPwdFocusLogin] = useState(false);

    const [errMsg, setErrMsg] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const captchaRef = useRef(null);
    const emailRef = useRef();

    const [recapToken, setRecapToken] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [countrySet, setCountrySet] = useState(false);

    const [emailRegister, setEmailRegister] = useState('');
    const [emailRegisterDisplay, setEmailRegisterDisplay] = useState('');
    const [validEmailRegister, setValidEmailRegister] = useState(false);
    const [emailFocusRegister, setEmailFocusRegister] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [validFirstName, setValidFirstName] = useState(false);
    const [firstNameFocus, setFirstNameFocus] = useState(false);

    const [lastName, setLastName] = useState('');
    const [validLastName, setValidLastName] = useState(false);
    const [lastNameFocus, setLastNameFocus] = useState(false);

    var todaysDate = new Date().toISOString().slice(0, 10)
    var pastDate = new Date()
    pastDate.setFullYear(pastDate.getFullYear() - 16)
    var cutoffDate = pastDate.toISOString().slice(0,10)

    const [birthdate, setBirthdate] = useState(todaysDate);
    const [validBirthdate, setValidBirthdate] = useState(false);
    const [birthdateFocus, setBirthdateFocus] = useState(false);

    const [address, setAddress] = useState('');
    const [validAddress, setValidAddress] = useState(false);
    const [addressFocus, setAddressFocus] = useState(false);

    const [city, setCity] = useState('');
    const [validCity, setValidCity] = useState(false);
    const [cityFocus, setCityFocus] = useState(false);

    const [region, setRegion] = useState("Select Region");
    const [regionCode, setRegionCode] = useState("");
    const [validRegion, setValidRegion] = useState(false);
    const [regionFocus, setRegionFocus] = useState(false);

    const [country, setCountry] = useState('Select Country');
    const [validCountry, setValidCountry] = useState(false);
    const [countryFocus, setCountryFocus] = useState(false);

    const [pwdRegister, setPwdRegister] = useState('');
    const [validPwdRegister, setValidPwdRegister] = useState(false);
    const [pwdFocusRegister, setPwdFocusRegister] = useState(false);
    const [inputTypeRegister, setInputTypeRegister] = useState("password");

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const [success, setSuccess] = useState(false);
    const [isErr, setIsErr] = useState(false);

    const handlePassToggleRegister = () => {
        if (inputTypeRegister==='password'){
           setInputTypeRegister('text')
        } else {
           setInputTypeRegister('password')
        }
     }

     const handleTermsClick = (e) => {

        e.preventDefault()
    
        window.open("/terms", "_blank");
     }

     const handlePrivacyClick = (e) => {

        e.preventDefault()
    
        window.open("/privacy", "_blank");
     }


     const handleAddress = (e) => {

        async function getcoordinates(){
            
            if(e.value?.place_id){

                const latlong = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${e.value.place_id}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`)

                if(latlong && latlong.data.results[0].geometry.location.lat && latlong.data.results[0].geometry.location.lng){

                    setAddress(latlong.data.results[0].formatted_address)
                    setLat(latlong.data.results[0].geometry.location.lat)
                    setLong(latlong.data.results[0].geometry.location.lng)

                    var cityDone = false
                    var regionDone = false

                    var cityMap = {
                        locality: 'locality',
                        sublocality_level_1: "sublocality_level_1",
                    };

                    for(let i=0; i<latlong.data.results[0]?.address_components?.length; i++){
                        
                        var types = latlong.data.results[0].address_components[i].types

                        for(var j = 0; j < types.length; j++){ 

                            var component_type = types[j];
            
                            if(!cityDone && cityMap.hasOwnProperty(component_type)){
                                
                                setCity(latlong.data.results[0].address_components[i].short_name)
                            
                            } else if (!regionDone && component_type === 'administrative_area_level_1'){

                                setRegion(latlong.data.results[0].address_components[i].long_name)

                                for(let x=0; x<regionData?.length; x++){
                                    if(regionData[x].code === latlong.data.results[0].address_components[i].short_name){
                                        setRegionCode(regionData[x].code)
                                        regionDone = true;
                                    }
                                }
                        
                            }
                        }
                    }
                }
            }
        }

        getcoordinates()
     }

     const handleRegionChange = (event) => {
        var saved = false
        setRegion(event.target.value);
        for(let i=0; i<regionData?.length; i++){
            if(regionData[i].region === event.target.value){
                setRegionCode(regionData[i].code)
                saved = true;
                break
            }
        }
        if(!saved){
            setRegionCode(event.target.value)
        }
    }

    const handleRecaptcha = () =>{
        const recaptchaToken = captchaRef.current.getValue();
        
        if(recaptchaToken){
            setRecapToken(recaptchaToken)
        }
    }


    useEffect( ()=> {

        for(let i=0; i< regionData.length; i++){
            
            if(regionData[i].code === regionCode && region !== 'Select Region'){
                setCountry(regionData[i].country);
                setCountrySet(true);
            }
        }

    }, [regionCode])


    useEffect( () => {
        
        if(emailRef.current){
            const ele = emailRef.current
            ele.focus();
        }
        
    }, [emailRef.current])

    useEffect(() => {
        setValidEmailRegister(EMAIL_REGEX.test(emailRegister));
    }, [emailRegister])

    useEffect(() => {
        setValidEmailLogin(EMAIL_REGEX.test(emailLogin));
    }, [emailLogin])

    useEffect(() => {
        setValidBirthdate(BIRTHDATE_REGEX.test(birthdate) && birthdate > '1920-01-01' && birthdate < cutoffDate);
    }, [birthdate])


    useEffect(() => {

        async function checkDuplicate(){

            var regexCheckEmail = EMAIL_REGEX.test(emailRegister)
            
            const response = await checkUser(emailRegister.toLowerCase())

            if(response?.email === 0 && regexCheckEmail){
                setValidEmailRegister(true);
            } else {
                setValidEmailRegister(false);
            }
        }

        if(emailRegister?.length > 4){
            checkDuplicate()
        } else {
            setValidEmailRegister(false);
        }
        
    }, [emailRegister])


    const changeHandler = (event) => {
        setEmailRegister(event.target.value);
    };

    const debouncedChangeHandler = useMemo(
        () => debounce(changeHandler, 500)
    , []);

    const handleEmailRegister = (event) => {

        setEmailRegisterDisplay(event.target.value);
        debouncedChangeHandler(event);
    }

    useEffect(() => {
        setValidFirstName(FIRST_NAME_REGEX.test(firstName));
    }, [firstName])

    useEffect(() => {
        setValidLastName(LAST_NAME_REGEX.test(lastName));
    }, [lastName])

    useEffect(() => {
        setValidAddress(ADDRESS_REGEX.test(address));
    }, [address])

    useEffect(() => {
        setValidCity(CITY_REGEX.test(city) && city !== 'Select City');
    }, [city])

    useEffect(() => {
        setValidRegion((REGION_REGEX.test(region) && region !== 'Select Region'));
    }, [region])

    useEffect(() => {
        setValidCountry((COUNTRY_REGEX.test(country) && country !== 'Select Country'));
    }, [country])

    useEffect(() => {
        setValidPwdRegister(PWD_REGEX.test(pwdRegister));
        setValidMatch((pwdRegister === matchPwd) && (matchPwd !== ''));
    }, [pwdRegister, matchPwd])

    useEffect(() => {
        setErrMsg('');
        setIsErr(false);
    }, [emailRegister, pwdRegister, matchPwd, address, city, region, country])

    const isInvalidLogin = pwdLogin === '' || emailLogin === '';
    const isInvalidRegister = pwdRegister === '' || emailRegister === '' || matchPwd ==='';

    const handleResendLogin = async (e) => {
        
        e.preventDefault();
        setWaiting(true);

        resendCount += 1;

        try {
            const response = await axios.post(RESEND_VERIFICATION_URL,
                JSON.stringify({ email: emailLogin.toLowerCase() }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            
            if(response){
                alert("Resent verification email");
                setWaiting(false);
            }
            
        } catch (err) {
            setErrMsg(true)
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else {
                setErrMsg('Resend Failed')
            }
        }
    }

    const handleResendRegister = async (e) => {
        
        e.preventDefault();
        setWaiting(true);

        resendCount += 1;

        try {
            const response = await axios.post(RESEND_VERIFICATION_URL,
                JSON.stringify({ email: emailRegister.toLowerCase() }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            
            if(response){
                alert("Resent verification email");
                setWaiting(false);
            }
            
        } catch (err) {
            setErrMsg(true)
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else {
                setErrMsg('Resend Failed')
            }
        }
    }

    const handleSubmitRegister = async (e) => {
        e.preventDefault();
        
        if(waiting){
            return
        }
        
        alert("Please hold, we're checking your information and will send you a verification link. This may take a minute or two.")
        setWaiting(true);
        
        const v1 = EMAIL_REGEX.test(emailRegister);
        const v2 = FIRST_NAME_REGEX.test(firstName);
        const v3 = LAST_NAME_REGEX.test(lastName);
        const v4 = PWD_REGEX.test(pwdRegister);
        
        if (!v1 || !v2 || !v3 || !v4) {
            setErrMsg("Invalid Entry");
            return;
        }

        if(city?.length > 0){
            setCity(city.charAt(0).toUpperCase() + city.slice(1).toLowerCase());
        }

        try {

            const response = await axios.post(REGISTER_URL,
                JSON.stringify({ email: emailRegister.toLowerCase(), pwd: pwdRegister, firstName, lastName, long, lat,
                    address, city, region, regionCode, country, birthdate, recapToken }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            if(response && response?.status === 201){
                
                setSuccess(true);
                setPwdRegister('');
                setMatchPwd('');
                alert("Registered! Please check your email inbox to activate the account!")

            } else if(response?.status === 402){

                alert("Inappropriate content detected, please try again")
                setSuccess(false);
                setWaiting(false);
            
            } else {
                alert("Account creation failed, please try again")
                setSuccess(false);
                setWaiting(false);
            }
            
        } catch (err) {
            
            if (err.response?.status === 409) {
                setErrMsg('Sorry, email already in use!');
                setWaiting(false)
            } else {
                setErrMsg('Registration Failed')
            }
        }
    }

    var resendCount = 0;

    const togglePersist = () => {
        setPersist(prev => !prev);
    }

    const handlePassToggleLogin = () => {
        if (inputTypeLogin==='password'){
           setInputTypeLogin('text')
        } else {
           setInputTypeLogin('password')
        }
     }

     const toggleAcceptTerms = () => {
        setAcceptTerms(prev => !prev);
    }

    const toggleAcceptPrivacy = () => {
        setAcceptPrivacy(prev => !prev);
    }

     const onEnterPress = (event) => {
        if(event.key === 'Enter' && event.shiftKey === false) {  
          event.preventDefault();
          handleLogin(event);
        }
      }

    const handleLogin = async (event) => {
        event.preventDefault();
        setSubmitted(true);

        try {
            const response = await axios.post(LOGIN_URL,
                JSON.stringify({ email: emailLogin.toLowerCase(), pwd: pwdLogin }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            if(response && response.status === 200){

                console.log(response)

                const firstName = response?.data?.firstName;
                const lastName = response?.data?.lastName;
                const accessToken = response?.data?.accessToken;
                
                const roles = response?.data?.roles;
                const userId = response?.data?.userId
                const profilePicURL = response?.data?.profilePicURL
                const currency = response?.data?.currency
                const currencySymbol = response?.data?.currencySymbol
                const phoneNumber = response?.data?.phoneNumber
                const appointmentFlags = response?.data?.appointmentFlags
                
                const pushNotifications = response?.data?.pushNotifications
                const emailNotifications = response?.data?.emailNotifications
                const smsNotifications = response?.data?.smsNotifications

                const credits = response?.data?.credits
                
                const requestedPayout = response?.data?.requestedPayout;
                const requestedPayoutCurrency = response?.data?.requestedPayoutCurrency;
                const requestedPayoutOption = response?.data?.requestedPayoutOption;

                const j1772ACChecked = response?.data?.j1772ACChecked
                const ccs1DCChecked = response?.data?.ccs1DCChecked
                const mennekesACChecked = response?.data?.mennekesACChecked
                const ccs2DCChecked = response?.data?.ccs2DCChecked
                const chademoDCChecked = response?.data?.chademoDCChecked
                const gbtACChecked = response?.data?.gbtACChecked
                const gbtDCChecked = response?.data?.gbtDCChecked
                const teslaChecked = response?.data?.teslaChecked

                setAuth({ firstName, lastName, userId, roles, accessToken, profilePicURL, phoneNumber,
                    currency, currencySymbol, credits, smsNotifications, pushNotifications, emailNotifications,
                    j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, chademoDCChecked, gbtACChecked, 
                    gbtDCChecked, teslaChecked, requestedPayout, requestedPayoutCurrency, requestedPayoutOption,
                    appointmentFlags });

                localStorage.setItem("socketjuice-persist", persist)

                setEmailRegister('');
                setPwdRegister('');
                setOpenModalLogin(false);

            } else if(response && response.status === 202) {

                //Resend verification link with token
                setErrMsg('Please check your email to activate and verify your phone number!');

            } else {

                setSubmitted(false);
            }
            
        } catch (err) {
            
            setSubmitted(false);
            
            if (!err?.response) {
                setErrMsg('No Server Response');
            
            } else if (err.response?.status === 400) {
                setErrMsg('Please activate your account!');
                setResendActivate(true);
            
            } else if (err.response?.status === 401) {
                setErrMsg('Login unsuccessful, please try again!');

            } else {
                setErrMsg('Login unsuccessful, please try again!');
            }
        }
    };


    const mainstyle = {
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 360,
        bgcolor: 'background.paper',
        border: '2px solid #00D3E0',
        display: "flex",
        flexDirection: "column",
        height: '550px',
        overflow: "hidden",
        overflowY: "scroll",
        borderRadius: "10px"
      };
    
    const [size, setSize] = useState({
        x: 0,
        y: 0
      });

    const updateSize = () =>
        setSize({
          x: window.innerWidth,
          y: window.innerHeight
    });

    useEffect ( () => {

        if(!auth.userId && activeTab === 'map'){

            const currentpath = window.location.pathname;
            if(currentpath.startsWith("/map")){
                setOpenModalLogin(true)
            }
        }

    }, [auth, activeTab])

    const handleChange = (event, newValue) => {

        if(waiting){
            return
        }

        setWaiting(true);
        
        if(newValue === "1"){
            setLoginTab(false)
            setRegisterTab(true)

        } else if (newValue === "0"){
            setLoginTab(true)
            setRegisterTab(false)
        }

        setValue(newValue);

        setWaiting(false);
    };

    const handleLoginItemClick = () => {

        if(!auth.userId){
            
            setOpenModalLogin(true)
        }
    }
    
      const handleCloseModalLogin = (event) => {

        if(auth?.userId){
            setOpenModalLogin(false);
        }
    }


    const handleMessagesClick =  async (event) => {

        if(!auth.userId){
            navigate('/map');
            return
        }

        event.preventDefault();

        const openedMsgs = await editNewMessagesFill(loggedUserId, auth.accessToken)
        if(openedMsgs){
            setNewMessages(false);
            setNewMessagesFill(false);
            navigate('/messages');
        }
    }

    useEffect( ()=> {

        if(newMessages){
            setNewMessagesFill(true);
        }

    }, [newMessages])


    return (
        <>
        <div className="h-[7vh] sm:h-[8vh] md:h-[9vh] max-w-full overflow-x-hidden flex flex-row justify-center items-center
            opacity-100 border-b w-full z-[1500] bg-[#00D3E0] shadow-sm shadow-[#FFE142] fixed">

            <div className="flex flex-row justify-evenly md:justify-between items-center max-w-full w-full h-full 
                gap-y-1 gap-x-4 sm:gap-x-6 pt-1 overflow-x-hidden flex-shrink-0" >

                <div className='flex flex-row w-1/2 justify-center'>
                    <Link reloadDocument to={ROUTES.MAP} >
                        <img className='h-[7vh] flex-shrink-0' src={socketjuice_full_logo} />
                    </Link>
                </div>

                <div className='flex flex-row w-full justify-center gap-x-6 pr-2'>

                    <Link reloadDocument to={ROUTES.MAP} aria-label="StoreDashboard"
                        className={`flex justify-center flex-row items-center hover:bg-[#FFE142]
                        ${activeTab === 'map' ? 'border-2 border-black bg-[#FFE142] ' 
                        : 'bg-[#8BEDF3]'} rounded-lg p-1 px-3 md:px-2`}>

                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                            strokeWidth="1" stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>

                        <p className='hidden md:flex mx-1 sm:text-sm md:text-base '>Mapping</p>

                    </Link>

                    <Link reloadDocument to={ROUTES.BOOKINGS} aria-label="ActiveTab" 
                        className={`flex justify-center flex-row items-center hover:bg-[#FFE142]
                        ${activeTab === 'bookings' ? 'border-2 border-black bg-[#FFE142] ' 
                        : 'bg-[#8BEDF3]'} rounded-lg p-1 px-3 md:px-2`}>

                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                            strokeWidth="1" stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                        </svg>

                        <p className='hidden md:flex mx-1 sm:text-sm md:text-base text-black'>Bookings</p>

                    </Link>

                    <div className='flex flex-row'>
                                        
                        {newMessagesFill ? (
                        
                        <button onClick={(event)=>handleMessagesClick(event)}
                        className={`flex justify-center flex-row items-center hover:bg-[#FFE142]
                        ${activeTab === 'chat' ? 'border-2 border-black bg-[#FFE142] ' 
                        : 'bg-[#8BEDF3]'} rounded-lg p-1 px-3 md:px-2`}>

                            <svg xmlns="http://www.w3.org/2000/svg" fill="#00D3E0" viewBox="0 0 24 24" 
                                strokeWidth="1" stroke="#00D3E0" className="w-6 h-6 md:w-7 md:h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" 
                                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>

                            <p className='hidden md:flex mx-1 sm:text-sm md:text-base text-black'>Messages</p>

                        </button>
                        ) 
                        
                        : 
                        (
                        
                        <button onClick={(event)=>handleMessagesClick(event)}
                        className={`flex justify-center flex-row items-center hover:bg-[#FFE142]
                            ${activeTab === 'chat' ? 'border-2 border-black bg-[#FFE142] ' 
                            : 'bg-[#8BEDF3]'} rounded-lg p-1 px-3 md:px-2`}>

                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                                strokeWidth="1" stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" 
                                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>

                            <p className='hidden md:flex mx-1 sm:text-sm md:text-base text-black'>Messages</p>

                        </button>
                        )}
                    </div>

                    
                    {auth?.userId ? 
                    
                        <div className='flex flex-row items-center justify-center'>
                            <NotificationsDropdown />
                            <SettingsDropdown /> 
                        </div>

                    :
                    
                    <div className='flex flex-row'>

                        <button onClick={(e)=>handleLoginItemClick(e)} 
                        className={`flex justify-center flex-row items-center hover:bg-[#FFE142]
                        ${activeTab === 'profile' ? 'border-2 border-black bg-[#FFE142] ' 
                        : 'bg-[#8BEDF3]'} rounded-lg p-1 px-3 md:px-2`}>

                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                                strokeWidth="1" stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>

                            <p className='hidden md:flex mx-1 sm:text-sm md:text-base text-black'>Account</p>
                        </button>
                    </div>}

                </div>
            </div>
        
        </div>

        <Modal
          open={openModalLogin}
          disableAutoFocus={true}
          onClose={handleCloseModalLogin}
          onClick={(event)=>{event.stopPropagation()}}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          style={{zIndex: '10004'}}
        >
        <Box sx={mainstyle}>

            

        <TabContext value={value}>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <div className='flex justify-center'>
            <TabList onChange={handleChange} 
                aria-label="lab API tabs example"
                TabIndicatorProps={{style: {background:'#00D3E0'}}}
                >
            <Tab label="Login" value="0" />
            <Tab label="Register" value="1" />
            </TabList>
            </div>
        </Box>

        <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '0px',
            display:'flex', flexDirection: 'column'}} value="0">

                <div className='flex flex-col items-center justify-center p-2'>

                <div className='w-full max-w-[350px] py-10
                    rounded-xl md:rounded-none shadow-inner md:shadow-none'>

                    <div className='flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 lg:px-10 pb-6 flex-shrink-0'>
                        <img className='w-[250px]' src={socketjuice_full_logo} />
                        <p className='text-base text-center'>Share your electric vehicle charger to earn extra income!</p>
                    </div>

                    <div className='py-4 flex flex-col justify-center items-center'>
                        <p className='text-4xl'> Login Below:</p>
                    </div>
                    
                    <div className='flex flex-col mt-6'>
                        <label className='text-lg md:text-xl'>Email</label>
                        <input 
                            className='w-full border-2 rounded-xl p-4 mt-1 text-base hover:scale-[1.01] ease-in-out
                                bg-white focus:outline-[#00D3E0] border-[#00D3E0]/10'
                            placeholder="Enter your email"
                            aria-label="Enter your email address" 
                            type="text" 
                            onChange={ ( {target} ) => setEmailLogin(target.value)}
                            onFocus={()=> setEmailFocusLogin(true)}
                            onBlur={()=> setEmailFocusLogin(false)}
                            value={emailLogin}
                            required
                        />
                    </div>
                    <div className='flex flex-col mt-4'>
                        <label className='text-lg md:text-xl'>Password</label>
                        <div className='flex flex-row w-full'>
                            <input 
                                className={`w-full border-2 rounded-xl p-4 mt-1 text-base hover:scale-[1.01] ease-in-out
                                    bg-white focus:outline-[#00D3E0] border-[#00D3E0]/10`}
                                placeholder="Enter your password"
                                aria-label="Enter your password" 
                                type={inputTypeLogin}
                                onKeyDown={(event)=>onEnterPress(event)}
                                onChange={ ( {target} ) => setPwdLogin(target.value)}
                                onFocus={()=> setPwdFocusLogin(true)}
                                onBlur={()=> setPwdFocusLogin(false)}
                                value={pwdLogin}
                                required
                            />

                            <span className='relative flex cursor-pointer justify-around items-center'
                                onClick={handlePassToggleLogin}>
                                
                                <span className='absolute mr-16'>
                                {inputTypeLogin === 'text' ? 
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 16.3299C9.61004 16.3299 7.67004 14.3899 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C14.39 7.66992 16.33 9.60992 16.33 11.9999C16.33 14.3899 14.39 16.3299 12 16.3299ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 13.5599 10.44 14.8299 12 14.8299C13.56 14.8299 14.83 13.5599 14.83 11.9999C14.83 10.4399 13.56 9.16992 12 9.16992Z" fill="#00D3E0"/>
                                        <path d="M12 21.02C8.23996 21.02 4.68996 18.82 2.24996 15C1.18996 13.35 1.18996 10.66 2.24996 8.99998C4.69996 5.17998 8.24996 2.97998 12 2.97998C15.75 2.97998 19.3 5.17998 21.74 8.99998C22.8 10.65 22.8 13.34 21.74 15C19.3 18.82 15.75 21.02 12 21.02ZM12 4.47998C8.76996 4.47998 5.67996 6.41998 3.51996 9.80998C2.76996 10.98 2.76996 13.02 3.51996 14.19C5.67996 17.58 8.76996 19.52 12 19.52C15.23 19.52 18.32 17.58 20.48 14.19C21.23 13.02 21.23 10.98 20.48 9.80998C18.32 6.41998 15.23 4.47998 12 4.47998Z" fill="#00D3E0"/>
                                    </svg>
                                        : 
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9.47004 15.2799C9.28004 15.2799 9.09004 15.2099 8.94004 15.0599C8.12004 14.2399 7.67004 13.1499 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C13.15 7.66992 14.24 8.11992 15.06 8.93992C15.2 9.07992 15.28 9.26992 15.28 9.46992C15.28 9.66992 15.2 9.85992 15.06 9.99992L10 15.0599C9.85004 15.2099 9.66004 15.2799 9.47004 15.2799ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 12.4999 9.30004 12.9799 9.54004 13.3999L13.4 9.53992C12.98 9.29992 12.5 9.16992 12 9.16992Z" fill="#00D3E0"/>
                                        <path d="M5.59997 18.51C5.42997 18.51 5.24997 18.45 5.10997 18.33C4.03997 17.42 3.07997 16.3 2.25997 15C1.19997 13.35 1.19997 10.66 2.25997 8.99998C4.69997 5.17998 8.24997 2.97998 12 2.97998C14.2 2.97998 16.37 3.73998 18.27 5.16998C18.6 5.41998 18.67 5.88998 18.42 6.21998C18.17 6.54998 17.7 6.61998 17.37 6.36998C15.73 5.12998 13.87 4.47998 12 4.47998C8.76997 4.47998 5.67997 6.41998 3.51997 9.80998C2.76997 10.98 2.76997 13.02 3.51997 14.19C4.26997 15.36 5.12997 16.37 6.07997 17.19C6.38997 17.46 6.42997 17.93 6.15997 18.25C6.01997 18.42 5.80997 18.51 5.59997 18.51Z" fill="#00D3E0"/>
                                        <path d="M11.9999 21.02C10.6699 21.02 9.36994 20.75 8.11994 20.22C7.73994 20.06 7.55994 19.62 7.71994 19.24C7.87994 18.86 8.31994 18.68 8.69994 18.84C9.75994 19.29 10.8699 19.52 11.9899 19.52C15.2199 19.52 18.3099 17.58 20.4699 14.19C21.2199 13.02 21.2199 10.98 20.4699 9.81C20.1599 9.32 19.8199 8.85 19.4599 8.41C19.1999 8.09 19.2499 7.62 19.5699 7.35C19.8899 7.09 20.3599 7.13 20.6299 7.46C21.0199 7.94 21.3999 8.46 21.7399 9C22.7999 10.65 22.7999 13.34 21.7399 15C19.2999 18.82 15.7499 21.02 11.9999 21.02Z" fill="#00D3E0"/>
                                        <path d="M12.69 16.2699C12.34 16.2699 12.02 16.0199 11.95 15.6599C11.87 15.2499 12.14 14.8599 12.55 14.7899C13.65 14.5899 14.57 13.6699 14.77 12.5699C14.85 12.1599 15.24 11.8999 15.65 11.9699C16.06 12.0499 16.33 12.4399 16.25 12.8499C15.93 14.5799 14.55 15.9499 12.83 16.2699C12.78 16.2599 12.74 16.2699 12.69 16.2699Z" fill="#00D3E0"/>
                                        <path d="M1.99994 22.7502C1.80994 22.7502 1.61994 22.6802 1.46994 22.5302C1.17994 22.2402 1.17994 21.7602 1.46994 21.4702L8.93994 14.0002C9.22994 13.7102 9.70994 13.7102 9.99994 14.0002C10.2899 14.2902 10.2899 14.7702 9.99994 15.0602L2.52994 22.5302C2.37994 22.6802 2.18994 22.7502 1.99994 22.7502Z" fill="#00D3E0"/>
                                        <path d="M14.53 10.2199C14.34 10.2199 14.15 10.1499 14 9.99994C13.71 9.70994 13.71 9.22994 14 8.93994L21.47 1.46994C21.76 1.17994 22.24 1.17994 22.53 1.46994C22.82 1.75994 22.82 2.23994 22.53 2.52994L15.06 9.99994C14.91 10.1499 14.72 10.2199 14.53 10.2199Z" fill="#00D3E0"/>
                                    </svg>          
                                }
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className='mt-4 flex justify-between items-center'>
                        <div className='flex flex-row ml-2'>
                            <input  
                                type="checkbox" 
                                id='persist'
                                onChange={togglePersist}
                                checked={persist}
                            />
                            <p className='ml-2 text-sm md:text-base' htmlFor="persist">Trust This Device</p>
                        </div>
                    </div>

                    {errMsg && <p className='font-medium text-md md:text-lg text-center text-red-500 mt-4 md:mt-8'>{errMsg}</p>}
                    
                    {resendActivate && 
                        <div className='mt-2 flex flex-col gap-y-4'>
                            <button 
                                className='flex items-center justify-center gap-2 active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01] ease-in-out 
                                transform rounded-3xl
                                text-base md:text-lg border-2 border-[#00D3E0] text-blue-500 bg-white'
                                onClick={(event)=>handleResendLogin(event)} >
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" 
                                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                Resend confirmation email
                            </button>
                        </div>
                    }

                </div>

                <div className='flex flex-col gap-y-4 pb-10'>

                    <div className='flex flex-col justify-center items-center'>
                        <Link to={ROUTES.RESET_PASS} >
                            <button className='text-lg md:text-xl text-[#00D3E0]'>
                                    {' Forgot Password?'}
                            </button>
                        </Link>
                    </div>
                    
                    <button className={`active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  
                        ease-in-out transform py-4 px-8 sm:px-12 rounded-3xl text-base md:text-lg
                        ${isInvalidLogin ? ' bg-[#C0C0C0] text-[#565656] ' : ' bg-[#00D3E0] text-white ' } flex justify-center items-center gap-x-2`}
                        disabled={isInvalidLogin || submitted}
                        onClick={handleLogin}
                    >
                        {submitted && 
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
                        
                        {!submitted && 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                            strokeWidth="1.5" stroke={`${isInvalidLogin ? '#565656' : 'white'}`} className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>}

                        Sign In
                    </button>

                    
                    <button 
                        className='flex items-center justify-center gap-x-2 active:scale-[.98] active:duration-75 transition-all 
                        hover:scale-[1.01] ease-in-out transform py-4 px-8 sm:px-12 rounded-3xl text-gray-700 
                        border-2 border-[#00D3E0] text-base md:text-lg bg-white'
                        onClick={()=>setValue("1")}>

                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#00D3E0" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>

                            <div className='flex items-center justify-center gap-x-1' >        

                            No account?
                            <p className='text-[#00D3E0]'>Sign Up</p>
                            </div>        
                    </button>

                </div>
                </div>

                <div className='w-full flex flex-col pt-16 justify-center pb-4 gap-y-2'>

                <div className='w-full flex flex-col pt-16 justify-center pb-4 gap-y-2'>
                        <div className='flex flex-row justify-center gap-x-6'>
                            <Link to={"/terms"} className='flex flex-col text-[#00D3E0] 
                                text-[12px] sm:text-sm md:text-base underline'> Terms of Service </Link>
                            <Link to={"/privacy"} className='flex flex-col text-[#00D3E0] 
                                text-[12px] sm:text-sm md:text-base underline'> Privacy Policy </Link>
                        </div>
                        <div className='flex justify-center flex-row'>
                            <p className='text-xs text-gray-500'>Copyright © 2023 SocketJuice</p>
                        </div>
                    </div>
            </div>
            
        </TabPanel>

        <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '0px', paddingBottom: '0px',
            display:'flex', flexDirection: 'column'}} value="1">
    
        <div className='flex flex-col items-center justify-center p-2'>

        <div className='w-full max-w-[350px] py-10
                    rounded-xl md:rounded-none shadow-inner md:shadow-none'>
        
            <div className='flex items-center justify-center px-10 pb-6'>
                <img className='w-[250px]' src={socketjuice_full_logo} />
            </div>

            <div className='py-4 flex flex-col justify-center items-center'>
                <span className='text-4xl text-center w-full'> Let's create an account!</span> 
            </div>
        
            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Email</label>
                <input 
                    className='w-full border-2  rounded-xl p-4 mt-1 hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        bg-white focus:outline-[#00D3E0] placeholder:text-sm md:placeholder:text-base'
                    placeholder="Enter your email"
                    aria-label="Enter your email" 
                    ref={emailRef}
                    autoComplete="off"
                    type="text" 
                    onChange={ ( e ) => handleEmailRegister(e)}
                    value={emailRegisterDisplay}
                    onFocus={() => setEmailFocusRegister(true)}
                    onBlur={() => setEmailFocusRegister(false)}
                    aria-invalid={validEmailRegister ? "false" : "true"}
                    aria-describedby="emailnote"
                    required
                />
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validEmailRegister ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter a valid email address</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter a valid email address</span>
                        </div>
                        </>
                    )
                }
            </div> 
                
            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>First Name</label>
                <input 
                    className='w-full border-2 rounded-xl p-4 mt-1 hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        bg-white focus:outline-[#00D3E0] placeholder:text-sm md:placeholder:text-base'
                    placeholder="Enter your first name"
                    aria-label="Enter your first name" 
                    type="text"
                    id="firstname"
                    autoComplete="off"
                    onChange={ ( event ) => setFirstName(event.target.value)}
                    value={firstName}
                    aria-invalid={validFirstName ? "false" : "true"}
                    aria-describedby="firstnamenote"
                    onFocus={() => setFirstNameFocus(true)}
                    onBlur={() => setFirstNameFocus(false)}
                    required
                />
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validFirstName ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter your first name</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter your first name</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Last Name</label>
                <input 
                    className='w-full border-2 rounded-xl p-4 mt-1 hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        bg-white focus:outline-[#00D3E0] placeholder:text-sm md:placeholder:text-base'
                    placeholder="Enter your last name"
                    aria-label="Enter your last name" 
                    type="text"
                    id="lastname"
                    autoComplete="off"
                    onChange={ ( event ) => setLastName(event.target.value)}
                    value={lastName}
                    aria-invalid={validLastName ? "false" : "true"}
                    aria-describedby="lastnamenote"
                    onFocus={() => setLastNameFocus(true)}
                    onBlur={() => setLastNameFocus(false)}
                    required
                />
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validLastName ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter your last name</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter your last name</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Password</label>
                <div className='flex flex-row w-full'>
                <input 
                    className='w-full border-2 rounded-xl p-4 mt-1 hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        bg-white focus:outline-[#00D3E0] placeholder:text-sm md:placeholder:text-base'
                    placeholder="Enter your password"
                    aria-label="Enter your password" 
                    type={inputTypeRegister}
                    id="password"

                    onChange={ ( e ) => setPwdRegister(e.target.value)}
                    value={pwdRegister}
                    aria-invalid={validPwdRegister ? "false" : "true"}
                    aria-describedby="pwdnote"
                    onFocus={() => setPwdFocusRegister(true)}
                    onBlur={() => setPwdFocusRegister(false)}
                    required
                />
                <span className='relative flex cursor-pointer justify-around items-center'
                    onClick={handlePassToggleRegister}>
                    
                    <span className='absolute mr-16'>
                    {inputTypeRegister === 'text' ? 
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16.3299C9.61004 16.3299 7.67004 14.3899 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C14.39 7.66992 16.33 9.60992 16.33 11.9999C16.33 14.3899 14.39 16.3299 12 16.3299ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 13.5599 10.44 14.8299 12 14.8299C13.56 14.8299 14.83 13.5599 14.83 11.9999C14.83 10.4399 13.56 9.16992 12 9.16992Z" fill="#00D3E0"/>
                            <path d="M12 21.02C8.23996 21.02 4.68996 18.82 2.24996 15C1.18996 13.35 1.18996 10.66 2.24996 8.99998C4.69996 5.17998 8.24996 2.97998 12 2.97998C15.75 2.97998 19.3 5.17998 21.74 8.99998C22.8 10.65 22.8 13.34 21.74 15C19.3 18.82 15.75 21.02 12 21.02ZM12 4.47998C8.76996 4.47998 5.67996 6.41998 3.51996 9.80998C2.76996 10.98 2.76996 13.02 3.51996 14.19C5.67996 17.58 8.76996 19.52 12 19.52C15.23 19.52 18.32 17.58 20.48 14.19C21.23 13.02 21.23 10.98 20.48 9.80998C18.32 6.41998 15.23 4.47998 12 4.47998Z" fill="#00D3E0"/>
                        </svg>
                            : 
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.47004 15.2799C9.28004 15.2799 9.09004 15.2099 8.94004 15.0599C8.12004 14.2399 7.67004 13.1499 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C13.15 7.66992 14.24 8.11992 15.06 8.93992C15.2 9.07992 15.28 9.26992 15.28 9.46992C15.28 9.66992 15.2 9.85992 15.06 9.99992L10 15.0599C9.85004 15.2099 9.66004 15.2799 9.47004 15.2799ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 12.4999 9.30004 12.9799 9.54004 13.3999L13.4 9.53992C12.98 9.29992 12.5 9.16992 12 9.16992Z" fill="#00D3E0"/>
                            <path d="M5.59997 18.51C5.42997 18.51 5.24997 18.45 5.10997 18.33C4.03997 17.42 3.07997 16.3 2.25997 15C1.19997 13.35 1.19997 10.66 2.25997 8.99998C4.69997 5.17998 8.24997 2.97998 12 2.97998C14.2 2.97998 16.37 3.73998 18.27 5.16998C18.6 5.41998 18.67 5.88998 18.42 6.21998C18.17 6.54998 17.7 6.61998 17.37 6.36998C15.73 5.12998 13.87 4.47998 12 4.47998C8.76997 4.47998 5.67997 6.41998 3.51997 9.80998C2.76997 10.98 2.76997 13.02 3.51997 14.19C4.26997 15.36 5.12997 16.37 6.07997 17.19C6.38997 17.46 6.42997 17.93 6.15997 18.25C6.01997 18.42 5.80997 18.51 5.59997 18.51Z" fill="#00D3E0"/>
                            <path d="M11.9999 21.02C10.6699 21.02 9.36994 20.75 8.11994 20.22C7.73994 20.06 7.55994 19.62 7.71994 19.24C7.87994 18.86 8.31994 18.68 8.69994 18.84C9.75994 19.29 10.8699 19.52 11.9899 19.52C15.2199 19.52 18.3099 17.58 20.4699 14.19C21.2199 13.02 21.2199 10.98 20.4699 9.81C20.1599 9.32 19.8199 8.85 19.4599 8.41C19.1999 8.09 19.2499 7.62 19.5699 7.35C19.8899 7.09 20.3599 7.13 20.6299 7.46C21.0199 7.94 21.3999 8.46 21.7399 9C22.7999 10.65 22.7999 13.34 21.7399 15C19.2999 18.82 15.7499 21.02 11.9999 21.02Z" fill="#00D3E0"/>
                            <path d="M12.69 16.2699C12.34 16.2699 12.02 16.0199 11.95 15.6599C11.87 15.2499 12.14 14.8599 12.55 14.7899C13.65 14.5899 14.57 13.6699 14.77 12.5699C14.85 12.1599 15.24 11.8999 15.65 11.9699C16.06 12.0499 16.33 12.4399 16.25 12.8499C15.93 14.5799 14.55 15.9499 12.83 16.2699C12.78 16.2599 12.74 16.2699 12.69 16.2699Z" fill="#00D3E0"/>
                            <path d="M1.99994 22.7502C1.80994 22.7502 1.61994 22.6802 1.46994 22.5302C1.17994 22.2402 1.17994 21.7602 1.46994 21.4702L8.93994 14.0002C9.22994 13.7102 9.70994 13.7102 9.99994 14.0002C10.2899 14.2902 10.2899 14.7702 9.99994 15.0602L2.52994 22.5302C2.37994 22.6802 2.18994 22.7502 1.99994 22.7502Z" fill="#00D3E0"/>
                            <path d="M14.53 10.2199C14.34 10.2199 14.15 10.1499 14 9.99994C13.71 9.70994 13.71 9.22994 14 8.93994L21.47 1.46994C21.76 1.17994 22.24 1.17994 22.53 1.46994C22.82 1.75994 22.82 2.23994 22.53 2.52994L15.06 9.99994C14.91 10.1499 14.72 10.2199 14.53 10.2199Z" fill="#00D3E0"/>
                        </svg>          
                            
                    }
                    </span>
                </span>
                </div>
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validPwdRegister ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                        </div>
                        </>
                    )
                }
            </div>

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Confirm Password</label>
                <div className='flex flex-row w-full'>
                <input 
                    className='w-full border-2 rounded-xl p-4 mt-1 hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        bg-white focus:outline-[#00D3E0] placeholder:text-sm md:placeholder:text-base'
                    placeholder="Confirm your password"
                    aria-label="Confirm your password" 
                    type={inputTypeRegister}
                    id="confirmpwd"

                    onChange={ ( e ) => setMatchPwd(e.target.value)}
                    value={matchPwd}
                    aria-invalid={validMatch ? "false" : "true"}
                    aria-describedby="confirmnote"
                    onFocus={() => setMatchFocus(true)}
                    onBlur={() => setMatchFocus(false)}
                    required
                />
                <span className='relative flex cursor-pointer justify-around items-center'
                    onClick={handlePassToggleRegister}>
                    
                    <span className='absolute mr-16'>
                    {inputTypeRegister === 'text' ? 
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16.3299C9.61004 16.3299 7.67004 14.3899 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C14.39 7.66992 16.33 9.60992 16.33 11.9999C16.33 14.3899 14.39 16.3299 12 16.3299ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 13.5599 10.44 14.8299 12 14.8299C13.56 14.8299 14.83 13.5599 14.83 11.9999C14.83 10.4399 13.56 9.16992 12 9.16992Z" fill="#00D3E0"/>
                            <path d="M12 21.02C8.23996 21.02 4.68996 18.82 2.24996 15C1.18996 13.35 1.18996 10.66 2.24996 8.99998C4.69996 5.17998 8.24996 2.97998 12 2.97998C15.75 2.97998 19.3 5.17998 21.74 8.99998C22.8 10.65 22.8 13.34 21.74 15C19.3 18.82 15.75 21.02 12 21.02ZM12 4.47998C8.76996 4.47998 5.67996 6.41998 3.51996 9.80998C2.76996 10.98 2.76996 13.02 3.51996 14.19C5.67996 17.58 8.76996 19.52 12 19.52C15.23 19.52 18.32 17.58 20.48 14.19C21.23 13.02 21.23 10.98 20.48 9.80998C18.32 6.41998 15.23 4.47998 12 4.47998Z" fill="#00D3E0"/>
                        </svg>
                            : 
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.47004 15.2799C9.28004 15.2799 9.09004 15.2099 8.94004 15.0599C8.12004 14.2399 7.67004 13.1499 7.67004 11.9999C7.67004 9.60992 9.61004 7.66992 12 7.66992C13.15 7.66992 14.24 8.11992 15.06 8.93992C15.2 9.07992 15.28 9.26992 15.28 9.46992C15.28 9.66992 15.2 9.85992 15.06 9.99992L10 15.0599C9.85004 15.2099 9.66004 15.2799 9.47004 15.2799ZM12 9.16992C10.44 9.16992 9.17004 10.4399 9.17004 11.9999C9.17004 12.4999 9.30004 12.9799 9.54004 13.3999L13.4 9.53992C12.98 9.29992 12.5 9.16992 12 9.16992Z" fill="#00D3E0"/>
                            <path d="M5.59997 18.51C5.42997 18.51 5.24997 18.45 5.10997 18.33C4.03997 17.42 3.07997 16.3 2.25997 15C1.19997 13.35 1.19997 10.66 2.25997 8.99998C4.69997 5.17998 8.24997 2.97998 12 2.97998C14.2 2.97998 16.37 3.73998 18.27 5.16998C18.6 5.41998 18.67 5.88998 18.42 6.21998C18.17 6.54998 17.7 6.61998 17.37 6.36998C15.73 5.12998 13.87 4.47998 12 4.47998C8.76997 4.47998 5.67997 6.41998 3.51997 9.80998C2.76997 10.98 2.76997 13.02 3.51997 14.19C4.26997 15.36 5.12997 16.37 6.07997 17.19C6.38997 17.46 6.42997 17.93 6.15997 18.25C6.01997 18.42 5.80997 18.51 5.59997 18.51Z" fill="#00D3E0"/>
                            <path d="M11.9999 21.02C10.6699 21.02 9.36994 20.75 8.11994 20.22C7.73994 20.06 7.55994 19.62 7.71994 19.24C7.87994 18.86 8.31994 18.68 8.69994 18.84C9.75994 19.29 10.8699 19.52 11.9899 19.52C15.2199 19.52 18.3099 17.58 20.4699 14.19C21.2199 13.02 21.2199 10.98 20.4699 9.81C20.1599 9.32 19.8199 8.85 19.4599 8.41C19.1999 8.09 19.2499 7.62 19.5699 7.35C19.8899 7.09 20.3599 7.13 20.6299 7.46C21.0199 7.94 21.3999 8.46 21.7399 9C22.7999 10.65 22.7999 13.34 21.7399 15C19.2999 18.82 15.7499 21.02 11.9999 21.02Z" fill="#00D3E0"/>
                            <path d="M12.69 16.2699C12.34 16.2699 12.02 16.0199 11.95 15.6599C11.87 15.2499 12.14 14.8599 12.55 14.7899C13.65 14.5899 14.57 13.6699 14.77 12.5699C14.85 12.1599 15.24 11.8999 15.65 11.9699C16.06 12.0499 16.33 12.4399 16.25 12.8499C15.93 14.5799 14.55 15.9499 12.83 16.2699C12.78 16.2599 12.74 16.2699 12.69 16.2699Z" fill="#00D3E0"/>
                            <path d="M1.99994 22.7502C1.80994 22.7502 1.61994 22.6802 1.46994 22.5302C1.17994 22.2402 1.17994 21.7602 1.46994 21.4702L8.93994 14.0002C9.22994 13.7102 9.70994 13.7102 9.99994 14.0002C10.2899 14.2902 10.2899 14.7702 9.99994 15.0602L2.52994 22.5302C2.37994 22.6802 2.18994 22.7502 1.99994 22.7502Z" fill="#00D3E0"/>
                            <path d="M14.53 10.2199C14.34 10.2199 14.15 10.1499 14 9.99994C13.71 9.70994 13.71 9.22994 14 8.93994L21.47 1.46994C21.76 1.17994 22.24 1.17994 22.53 1.46994C22.82 1.75994 22.82 2.23994 22.53 2.52994L15.06 9.99994C14.91 10.1499 14.72 10.2199 14.53 10.2199Z" fill="#00D3E0"/>
                        </svg>          
                            
                    }
                    </span>
                </span>
                </div>
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validMatch ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please re-enter your password</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please re-enter your password</span>
                        </div>
                        </>
                    )
                }
            </div>

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Date of Birth </label>
                <input 
                    aria-label="dateOfBirth" 
                    type="date" 
                    id="birthdate"
                    placeholder="Birthdate"
                    className='text-sm text-gray-base w-full mr-3 py-6 px-4 h-10
                    border border-[#00D3E0]/10 rounded focus:outline-[#00D3E0]' 
                    onChange={ ( e ) => setBirthdate(e.target.value)}
                    value={birthdate}
                    aria-invalid={validBirthdate ? "false" : "true"}
                    onFocus={() => setBirthdateFocus(true)}
                    onBlur={() => setBirthdateFocus(false)}
                    required
                />
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validBirthdate ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter your date of birth</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter your date of birth</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Street Address</label>
                
                <div >
                <GooglePlacesAutocomplete

                    apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                    debounce={400}
                    // autocompletionRequest={{
                    //     componentRestrictions: {
                    //       country: ["ca", "us"] //to set the specific country
                    //     }
                    //   }}
                    selectProps={{
                        defaultInputValue: address,
                        onChange: handleAddress, //save the value gotten from google
                        placeholder: "Street address of your charger",
                        styles: {
                            control: (provided, state) => ({
                                ...provided,
                                boxShadow: "#00D3E0",
                               paddingTop: "8px",
                               paddingBottom: "8px",
                               border: state.isFocused
                                ? "2px solid #00D3E0"
                                : "0.5px solid #00D3E0",
                               '&:focus': {
                                    border: "4px solid #00D3E0"
                                },
                                '&:hover': {
                                    
                                },
                                '&:select': {
                                    border: "4px solid #00D3E0"
                                },
                                borderColor: "#00d3e080",
                                outlineColor: "#00D3E0",
                                "--tw-ring-color": "#00D3E0"
                            }),
                            menu: (provided) => ({
                                ...provided,
                            }),
                            option: (provided) => ({
                              ...provided,
                            }),
                          },
                    }}
                />
                </div>
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validAddress ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter the street address where your charger is located</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter the street address where your charger is located</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>City </label>
                <input 
                    className={`w-full border-2 rounded-xl placeholder:text-sm md:placeholder:text-base hover:scale-[1.01] ease-in-out border-[#00D3E0]/10
                        p-4 mt-1 bg-white focus:outline-[#00D3E0] ${city === 'Select City' ? 'text-gray-400' : 'text-black'}`}
                    placeholder="Enter the city/town of your charger"
                    aria-label="Store Address - City" 
                    type="text"
                    id="city"
                    autoComplete="off"
                    onChange={ ( e ) => setCity(e.target.value)}
                    value={city}
                    aria-invalid={validCity ? "false" : "true"}
                    aria-describedby="citynamenote"
                    onFocus={() => setCityFocus(true)}
                    onBlur={() => setCityFocus(false)}
                    required
                />
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validCity ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="flex flex-col text-green-600">Please enter your city</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter your city</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium '>State/Province/Region </label>
                <select onChange={(event) => handleRegionChange(event)}
                    value={region}
                    placeholder="Store Address - State/Province/Region"
                    aria-label="Store Address - State/Province/Region" 
                    required
                    className={`w-full border-2 rounded-xl placeholder:text-sm md:placeholder:text-base text-sm md:text-base h-16 pl-4 sm:h-auto
                    p-4 mt-1 bg-white focus:outline-[#00D3E0] ${region === 'Select Region' ? 'text-gray-400 text-sm' : 'text-black text-base'}
                    hover:scale-[1.01] ease-in-out border-[#00D3E0]/10`}
                    >
                        {regionData?.length > 0 ? regionData
                        .filter(region => (region.region !== "Select All"))
                        .map((item, index) => (

                            <option className='text-sm md:text-base' key={`${item.region} ${index}`} value={item.region}>{item.region}</option>
                        
                        )) : null}

                    </select> 
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validRegion ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter your state/province/region</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please enter your state/province/region</span>
                        </div>
                        </>
                    )
                }
            </div>  

            <div className='flex flex-col mt-6'>
                <label className='text-base md:text-lg font-medium'>Country </label>
                <div>
                <select onChange={(event) => setCountry(event.target.value)}
                    value={country} 
                    placeholder="Store Address - Country"
                    aria-label="Store Address - Country" 
                    required
                    disabled={countrySet}
                    className={`w-full border-2 rounded-xl placeholder:text-sm md:placeholder:text-base text-sm md:text-base h-16 pl-4 sm:h-auto
                    p-4 mt-1 bg-white focus:outline-[#00D3E0] ${country === 'Select Country' ? 'text-gray-400 text-sm' : 'text-black text-base'}
                    hover:scale-[1.01] ease-in-out border-[#00D3E0]/10`}
                    >
                    {countryData?.length > 0 ? countryData
                    .filter(country => (country !== "Select All"))
                    .map((item, index) => (

                        <option key={`${item} ${index}`} value={item}>{item}</option>
                    
                    )) : null}

                </select> 
                </div>
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
                
                {validCountry ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please enter your country</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                    <>
                    <div className='flex flex-col justify-center'>
                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    </div>
                    <div className='flex flex-col justify-center'>
                        <span className="text-sm md:text-base text-red-600">Please enter your country</span>
                    </div>
                    </>
                )}
            </div>  

            <div className='pl-2 mt-6 flex items-start'>
                <div className='flex flex-row items-center py-2'>
                    <input  
                        className="w-5 h-5"
                        type="checkbox" 
                        id='termsagree'
                        onChange={toggleAcceptTerms}
                        checked={acceptTerms}
                    />
                    <label className='ml-2 text-sm font-medium md:text-base' htmlFor="termsagree">{`I agree to the `}
                    <button className='text-blue-900 underline' onClick={(e)=>handleTermsClick(e)}> 
                        Terms of Service</button></label>
                </div>
            </div>

            <div className='pl-2 mt-2 flex items-start'>
                <div className='flex flex-row items-center pb-2'>
                    <input  
                        className="w-5 h-5"
                        type="checkbox" 
                        id='privacyagree'
                        onChange={toggleAcceptPrivacy}
                        checked={acceptPrivacy}
                    />
                    <label className='ml-2 font-medium text-sm md:text-base' htmlFor="privacyagree">{`I agree to the `}
                    <button className='text-blue-900 underline' onClick={(e)=>handlePrivacyClick(e)}> 
                        Privacy Policy</button></label>
                </div>
            </div>

            <div className='flex flex-row mx-2 gap-x-2 mt-1'>
            {(acceptTerms && acceptPrivacy) ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-green-600">Please review the Terms of Service and Privacy Policy</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-sm md:text-base text-red-600">Please review the Terms of Service and Privacy Policy</span>
                        </div>
                        </>
                    )
                }
            </div> 

            {errMsg && <p className='font-medium text-base md:text-lg text-center text-red-500 mt-8'>{errMsg}</p>}

            {success && <p className='font-medium text-base md:text-lg text-center text-green-600 mt-8'>Please check your email to activate!</p>}
        </div>

        <div className='py-8 flex flex-col gap-y-4 w-full'>

            <button className={`active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  
                ease-in-out transform py-4 px-8 sm:px-12 bg-[#00D3E0] rounded-3xl text-white 
                text-base md:text-lg
                flex justify-center items-center gap-x-2
                ${(!validEmailRegister || !validPwdRegister || !validMatch || isInvalidRegister || !acceptTerms 
                    || !acceptPrivacy || !validAddress || !validCity || !validRegion 
                    || !validCountry || !recapToken || waiting) && ' opacity-60' }`}
                
                disabled={!validEmailRegister || !validPwdRegister || !validMatch || isInvalidRegister || !acceptTerms 
                    || !acceptPrivacy || !validAddress || !validCity || !validRegion 
                    || !validCountry || success || !recapToken || waiting ? true : false}
                onClick={(event) => handleSubmitRegister(event)}
            >
                {waiting && 
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

                    {!waiting && 

                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="white" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>

                    }

                Register
            </button>

            <div className={`${!validEmailRegister || !validPwdRegister || !validMatch || isInvalidRegister || !acceptTerms 
                    || !acceptPrivacy ? 'hidden' : 'flex justify-center' }`}>
                <ReCAPTCHA
                    sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY} 
                    ref={captchaRef}
                    onChange={handleRecaptcha}
                />
            </div>
            
            <button 
                className='flex items-center justify-center gap-2 active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]
                 ease-in-out transform py-4 rounded-3xl text-gray-700 gap-x-2
                 text-base md:text-lg border-2 border-[#00D3E0] bg-white'
                 onClick={()=>setValue("0")}>

                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="#00D3E0" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>

                    <div className='flex items-center justify-center gap-x-1'>        

                    Have an account?
                    <p className='text-[#00D3E0]'>Login</p>
                    </div>        
            </button>

            {(success && resendCount <= 2) ? ( 
                <>
            <div className='flex flex-col'>
                <button 
                    className='flex items-center justify-center gap-x-2 active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  
                    ease-in-out transform py-4 rounded-3xl
                    text-base md:text-lg border-2 border-[#00D3E0] text-blue-500 cursor-pointer bg-white'
                    onClick={(event)=>handleResendRegister(event)} >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>

                    Resend confirmation email</button>
                    
                    </div>
                    </>
                    ) : null }

            </div>

            <div className='w-full flex flex-col pt-16 justify-center pb-4 gap-y-2'>
                <div className='flex justify-center flex-row'>
                    <p className='text-xs text-gray-500'>Copyright © 2023 SocketJuice</p>
                </div>
            </div>
        </div>

        </TabPanel>
        
        </TabContext>

            
            </Box>
        </Modal>

        </>
    )
}

export default MainHeader;
