import React, { useState, useEffect, useRef, useMemo } from 'react';
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import axios from '../../../api/axios'
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';

import '../../../pages/AutoCompleteForm.css';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { profanity } from '@2toad/profanity';

import editSettingsHostProfile from '../../../helpers/HostData/editSettingsHostProfile';
import getHostProfile from '../../../helpers/HostData/getHostProfile';

const useStyles = makeStyles({
  appContainer: {
    display: "flex",
    flexDirection: "row",
    width: "93vw",
    height: "100vh",
  },

  container: {
    display: "flex",
    height: "100%",
    width: "100%",
    justifyContent: "center"
  },
  panel: {
    width: "100%"
  }
});


export default function ChangeProfileMainStore({loggedUserId}) {

  const classes = useStyles();
  const { setAuth, auth } = useAuth();
  const logout = useLogout();
  const startRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [closedOnMonday, setClosedOnMonday] = useState(false);
  const [closedOnTuesday, setClosedOnTuesday] = useState(false);
  const [closedOnWednesday, setClosedOnWednesday] = useState(false);
  const [closedOnThursday, setClosedOnThursday] = useState(false);
  const [closedOnFriday, setClosedOnFriday] = useState(false);
  const [closedOnSaturday, setClosedOnSaturday] = useState(false);
  const [closedOnSunday, setClosedOnSunday] = useState(false);
  const [closedOnHolidays, setClosedOnHolidays] = useState(false);

  const [allDayMonday, setAllDayMonday] = useState(false);
  const [allDayTuesday, setAllDayTuesday] = useState(false);
  const [allDayWednesday, setAllDayWednesday] = useState(false);
  const [allDayThursday, setAllDayThursday] = useState(false);
  const [allDayFriday, setAllDayFriday] = useState(false);
  const [allDaySaturday, setAllDaySaturday] = useState(false);
  const [allDaySunday, setAllDaySunday] = useState(false);
  const [allDayHolidays, setAllDayHolidays] = useState(false);

  const [hostComments, setHostComments] = useState("");
  const [validHostComments, setValidHostComments] = useState(false);
  const [hostCommentsFocus, setHostCommentsFocus] = useState(false);

  const [currency, setCurrency] = useState("");
  const [chargeRate, setChargeRate] = useState("");

  const [hoursMondayStart, setHoursMondayStart] = useState('');
  const [validHoursMondayStart, setValidHoursMondayStart] = useState(false);
  const [hoursMondayStartFocus, setHoursMondayStartFocus] = useState(false);

  const [hoursMondayFinish, setHoursMondayFinish] = useState('');
  const [validHoursMondayFinish, setValidHoursMondayFinish] = useState(false);
  const [hoursMondayFinishFocus, setHoursMondayFinishFocus] = useState(false);

  const [hoursTuesdayStart, setHoursTuesdayStart] = useState('');
  const [validHoursTuesdayStart, setValidHoursTuesdayStart] = useState(false);
  const [hoursTuesdayStartFocus, setHoursTuesdayStartFocus] = useState(false);

  const [hoursTuesdayFinish, setHoursTuesdayFinish] = useState('');
  const [validHoursTuesdayFinish, setValidHoursTuesdayFinish] = useState(false);
  const [hoursTuesdayFinishFocus, setHoursTuesdayFinishFocus] = useState(false);

  const [hoursWednesdayStart, setHoursWednesdayStart] = useState('');
  const [validHoursWednesdayStart, setValidHoursWednesdayStart] = useState(false);
  const [hoursWednesdayStartFocus, setHoursWednesdayStartFocus] = useState(false);

  const [hoursWednesdayFinish, setHoursWednesdayFinish] = useState('');
  const [validHoursWednesdayFinish, setValidHoursWednesdayFinish] = useState(false);
  const [hoursWednesdayFinishFocus, setHoursWednesdayFinishFocus] = useState(false);

  const [hoursThursdayStart, setHoursThursdayStart] = useState('');
  const [validHoursThursdayStart, setValidHoursThursdayStart] = useState(false);
  const [hoursThursdayStartFocus, setHoursThursdayStartFocus] = useState(false);

  const [hoursThursdayFinish, setHoursThursdayFinish] = useState('');
  const [validHoursThursdayFinish, setValidHoursThursdayFinish] = useState(false);
  const [hoursThursdayFinishFocus, setHoursThursdayFinishFocus] = useState(false);

  const [hoursFridayStart, setHoursFridayStart] = useState('');
  const [validHoursFridayStart, setValidHoursFridayStart] = useState(false);
  const [hoursFridayStartFocus, setHoursFridayStartFocus] = useState(false);

  const [hoursFridayFinish, setHoursFridayFinish] = useState('');
  const [validHoursFridayFinish, setValidHoursFridayFinish] = useState(false);
  const [hoursFridayFinishFocus, setHoursFridayFinishFocus] = useState(false);

  const [hoursSaturdayStart, setHoursSaturdayStart] = useState('');
  const [validHoursSaturdayStart, setValidHoursSaturdayStart] = useState(false);
  const [hoursSaturdayStartFocus, setHoursSaturdayStartFocus] = useState(false);

  const [hoursSaturdayFinish, setHoursSaturdayFinish] = useState('');
  const [validHoursSaturdayFinish, setValidHoursSaturdayFinish] = useState(false);
  const [hoursSaturdayFinishFocus, setHoursSaturdayFinishFocus] = useState(false);

  const [hoursSundayStart, setHoursSundayStart] = useState('');
  const [validHoursSundayStart, setValidHoursSundayStart] = useState(false);
  const [hoursSundayStartFocus, setHoursSundayStartFocus] = useState(false);

  const [hoursSundayFinish, setHoursSundayFinish] = useState('');
  const [validHoursSundayFinish, setValidHoursSundayFinish] = useState(false);
  const [hoursSundayFinishFocus, setHoursSundayFinishFocus] = useState(false);

  const [holidayHours, setHolidayHours] = useState('');
  const [validHolidayHours, setValidHolidayHours] = useState(false);
  const [holidayHoursFocus, setHolidayHoursFocus] = useState(false);

  const [holidayHoursStart, setHolidayHoursStart] = useState('');
  const [validHolidayHoursStart, setValidHolidayHoursStart] = useState(false);
  const [holidayHoursStartFocus, setHolidayHoursStartFocus] = useState(false);

  const [holidayHoursFinish, setHolidayHoursFinish] = useState('');
  const [validHolidayHoursFinish, setValidHolidayHoursFinish] = useState(false);
  const [holidayHoursFinishFocus, setHolidayHoursFinishFocus] = useState(false);

const COMMENTS_REGEX = /^.{2,450}$/;
const REGULAR_HOURS_REGEX = /^.{2,250}$/;
const HOLIDAY_HOURS_REGEX = /^.{2,250}$/;


  useEffect(() => {
        const ele = startRef.current
        ele.focus();
    }, [])

    useEffect(() => {
        setValidHostComments(COMMENTS_REGEX.test(hostComments));
    }, [hostComments])

    useEffect(() => {
        setValidHoursMondayStart(REGULAR_HOURS_REGEX.test(hoursMondayStart));
    }, [hoursMondayStart])
    
    useEffect(() => {
        setValidHoursMondayFinish(REGULAR_HOURS_REGEX.test(hoursMondayFinish));
    }, [hoursMondayFinish])

    useEffect(() => {
        setValidHoursTuesdayStart(REGULAR_HOURS_REGEX.test(hoursTuesdayStart));
    }, [hoursTuesdayStart])

    useEffect(() => {
        setValidHoursTuesdayFinish(REGULAR_HOURS_REGEX.test(hoursTuesdayFinish));
    }, [hoursTuesdayFinish])

    useEffect(() => {
        setValidHoursWednesdayStart(REGULAR_HOURS_REGEX.test(hoursWednesdayStart));
    }, [hoursWednesdayStart])

    useEffect(() => {
        setValidHoursWednesdayFinish(REGULAR_HOURS_REGEX.test(hoursWednesdayFinish));
    }, [hoursWednesdayFinish])

    useEffect(() => {
        setValidHoursThursdayStart(REGULAR_HOURS_REGEX.test(hoursThursdayStart));
    }, [hoursThursdayStart])

    useEffect(() => {
        setValidHoursThursdayFinish(REGULAR_HOURS_REGEX.test(hoursThursdayFinish));
    }, [hoursThursdayFinish])

    useEffect(() => {
        setValidHoursFridayStart(REGULAR_HOURS_REGEX.test(hoursFridayStart));
    }, [hoursFridayStart])

    useEffect(() => {
        setValidHoursFridayFinish(REGULAR_HOURS_REGEX.test(hoursFridayFinish));
    }, [hoursFridayFinish])

    useEffect(() => {
        setValidHoursSaturdayStart(REGULAR_HOURS_REGEX.test(hoursSaturdayStart));
    }, [hoursSaturdayStart])

    useEffect(() => {
        setValidHoursSaturdayFinish(REGULAR_HOURS_REGEX.test(hoursSaturdayFinish));
    }, [hoursSaturdayFinish])

    useEffect(() => {
        setValidHoursSundayStart(REGULAR_HOURS_REGEX.test(hoursSundayStart));
    }, [hoursSundayStart])

    useEffect(() => {
        setValidHoursSundayFinish(REGULAR_HOURS_REGEX.test(hoursSundayFinish));
    }, [hoursSundayFinish])

    useEffect(() => {
        setValidHolidayHoursStart(HOLIDAY_HOURS_REGEX.test(holidayHoursStart));
    }, [holidayHoursStart])

    useEffect(() => {
        setValidHolidayHoursFinish(HOLIDAY_HOURS_REGEX.test(holidayHoursFinish));
    }, [holidayHoursFinish])


    useEffect( () => {

        async function getData(){
  
          const response = await getHostProfile(auth.userId, auth.accessToken)
  
          if(response && response.hostProfile){
            
            setHoursMondayStart(response.hostProfile.hoursMondayStart)
            setHoursMondayFinish(response.hostProfile.hoursMondayFinish)
            setHoursTuesdayStart(response.hostProfile.hoursTuesdayStart)
            setHoursTuesdayFinish(response.hostProfile.hoursTuesdayFinish)
            setHoursWednesdayStart(response.hostProfile.hoursWednesdayStart)
            setHoursWednesdayFinish(response.hostProfile.hoursWednesdayFinish)
            setHoursThursdayStart(response.hostProfile.hoursThursdayStart)
            setHoursThursdayFinish(response.hostProfile.hoursThursdayFinish)
            setHoursFridayStart(response.hostProfile.hoursFridayStart)
            setHoursFridayFinish(response.hostProfile.hoursFridayFinish)
            setHoursSaturdayStart(response.hostProfile.hoursSaturdayStart)
            setHoursSaturdayFinish(response.hostProfile.hoursSaturdayFinish)
            setHoursSundayStart(response.hostProfile.hoursSundayStart)
            setHoursSundayFinish(response.hostProfile.hoursSundayFinish)
            setHolidayHoursStart(response.hostProfile.holidayHoursStart)
            setHolidayHoursFinish(response.hostProfile.holidayHoursFinish)
            
            setClosedOnMonday(response.hostProfile.closedOnMonday)
            setClosedOnTuesday(response.hostProfile.closedOnTuesday)
            setClosedOnWednesday(response.hostProfile.closedOnWednesday)
            setClosedOnThursday(response.hostProfile.closedOnThursday)
            setClosedOnFriday(response.hostProfile.closedOnFriday)
            setClosedOnSaturday(response.hostProfile.closedOnSaturday)
            setClosedOnSunday(response.hostProfile.closedOnSunday)
            setClosedOnHolidays(response.hostProfile.closedOnHolidays)

            setAllDayMonday(response.hostProfile.allDayMonday)
            setAllDayTuesday(response.hostProfile.allDayTuesday)
            setAllDayWednesday(response.hostProfile.allDayWednesday)
            setAllDayThursday(response.hostProfile.allDayThursday)
            setAllDayFriday(response.hostProfile.allDayFriday)
            setAllDaySaturday(response.hostProfile.allDaySaturday)
            setAllDaySunday(response.hostProfile.allDaySunday)
            setAllDayHolidays(response.hostProfile.allDayHolidays)

            setHostComments(response.hostProfile.hostComments)
            setCurrency(response.hostProfile.currency)
            setChargeRate(response.hostProfile.chargeRatePerHalfHour)
            
          }
        }
  
        if(auth.userId){
            getData()
        }
  
      }, [auth.userId])


    const handleRegularHourChangeBegin = (event, day) => {

        if (day === 'Monday'){

            setHoursMondayStart(event.target.value)

        } else if( day === 'Tuesday'){

            setHoursTuesdayStart(event.target.value)

        } else if (day === 'Wednesday'){

            setHoursWednesdayStart(event.target.value)

        } else if (day === 'Thursday'){

            setHoursThursdayStart(event.target.value)

        } else if (day === 'Friday'){

            setHoursFridayStart(event.target.value)

        } else if (day === 'Saturday'){

            setHoursSaturdayStart(event.target.value)

        } else if (day === 'Sunday'){

            setHoursSundayStart(event.target.value)

        } else if (day === ' Holiday'){

            setHolidayHoursStart(event.target.value)
        }
    }

    const handleRegularHourChangeEnd = (event, day) => {

        if (day === 'Monday'){

            setHoursMondayFinish(event.target.value)

        } else if( day === 'Tuesday'){

            setHoursTuesdayFinish(event.target.value)

        } else if (day === 'Wednesday'){

            setHoursWednesdayFinish(event.target.value)

        } else if (day === 'Thursday'){

            setHoursThursdayFinish(event.target.value)

        } else if (day === 'Friday'){

            setHoursFridayFinish(event.target.value)

        } else if (day === 'Saturday'){

            setHoursSaturdayFinish(event.target.value)

        } else if (day === 'Sunday'){

            setHoursSundayFinish(event.target.value)

        } else if (day === ' Holiday'){

            setHolidayHoursFinish(event.target.value)
        }
    }


  async function onSubmitHandler(e) {

    e.preventDefault();

    if(isLoading){
        return
    }

    setIsLoading(true);

    profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);

    const profanityCheck = profanity.exists(hostComments)
        
    if(!profanityCheck){

        const editedSettings = await editSettingsHostProfile(auth.userId, 
            hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
            hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
            holidayHoursStart, holidayHoursFinish, 
            closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
            allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
            currency, chargeRate, hostComments,
            auth.accessToken)

        if(editedSettings){

            setAuth(prev => {
                return {
                    ...prev,
                    firstName: firstName,
                    lastName: lastName,
                    profilePicURL: profilePicURL,
                    pushNotifications: pushNotifications,
                    emailNotifications: emailNotifications,
                    smsNotifications: smsNotifications,
                }
            });

            toast.success("Success! Changed user profile and settings!", {
              position: "bottom-center",
              autoClose: 1500,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
              });

            setIsLoading(false);
        }
    
    } else {

        setErrorMessage("Failed to save user profile settings. Please check for inappropriate content!");
        const warnUser = await addWarnings(auth.userId, auth.accessToken)
        if(warnUser?.status == 202){
            logout();
        }
    }     
  };

  
  return (
    <>
    <Box
        className={classes.container}
    >
        <div className='flex flex-col content-center items-center w-full'>

            <div className='w-full flex flex-col items-end pt-4 gap-y-4'>

                <div className="flex flex-row justify-center items-center gap-x-2">

                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                    <select onChange={(event)=>setCurrency(event.target.value)}
                    value={currency}
                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                        <option value="usd">$USD</option>
                        <option value="cad">$CAD</option>
                        <option value="eur">€EUR</option>
                        <option value="gbp">£GBP</option>
                        <option value="inr">₹INR</option>
                        <option value="jpy">¥JPY</option>
                        <option value="cny">¥CNY</option>
                        <option value="aud">$AUD</option>
                        <option value="nzd">$NZD</option>

                    </select> 

                </div>

                <div className="flex flex-row justify-center items-center gap-x-2">

                    <div className='flex flex-col p-2'>
                        <p className="flex font-semibold">Charge Rate Per 30 Min:</p>
                    </div>
                    
                    <select className="pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center" 
                    value={chargeRate}
                    onChange={(event) => {
                        setChargeRate(event.target.value);
                    }}>
                    
                    <option value={1.0}>$1.00</option>
                    <option value={2.0}>$2.00</option>
                    <option value={3.0}>$3.00</option>
                    <option value={4.0}>$4.00</option>
                    <option value={5.0}>$5.00</option>
                    <option value={6.0}>$6.00</option>
                    <option value={7.0}>$7.00</option>
                    
                    </select>
                </div>  

                <div className="flex flex-row justify-center items-center gap-x-2">

                    <label className="flex justify-center items-center pr-2 font-semibold">Charging Level:</label>

                    <select onChange={(event)=>setChargingLevel(event.target.value)}
                    value={chargingLevel}
                    className={`text-sm w-30 md:w-40 h-10 text-black justify-center
                    border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

                        <option value="Level 1">Level 1</option>
                        <option value="Level 2">Level 2</option>
                        <option value="Level 3">Level 3</option>

                    </select> 

                </div>

            </div>

            <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] pt-2 md:pt-0'>

                <label className='text-base font-semibold pl-2'>Host Comments:</label>
                <input 
                    aria-label="Host Comments: " 
                    type="text" 
                    id="Hostcomments"
                    autoComplete="hostcomments"
                    placeholder="Host Comments:"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => setHostComments(e.target.value)}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                    }
                    value={hostComments}
                    aria-invalid={validHostComments ? "false" : "true"}
                    onFocus={() => setHostCommentsFocus(true)}
                    onBlur={() => setHostCommentsFocus(false)}
                />

            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Monday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Monday Start: " 
                    type="time" 
                    id="hoursMondayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Monday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursMondayStart}
                    aria-invalid={validHoursMondayStart ? "false" : "true"}
                    onFocus={() => setHoursMondayStartFocus(true)}
                    onBlur={() => setHoursMondayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Monday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Monday Finish: " 
                    type="time" 
                    id="hoursMondayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Monday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursMondayFinish}
                    aria-invalid={validHoursMondayFinish ? "false" : "true"}
                    onFocus={() => setHoursMondayFinishFocus(true)}
                    onBlur={() => setHoursMondayFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Monday?</label>
                    <FormControlLabel
                        value="Closed on Monday?"
                        control={
                        <Checkbox checked={closedOnMonday}
                                onChange={()=>setClosedOnMonday(!closedOnMonday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />
            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Tuesday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Tuesday Start: " 
                    type="time" 
                    id="hoursTuesdayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Tuesday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursTuesdayStart}
                    aria-invalid={validHoursTuesdayStart ? "false" : "true"}
                    onFocus={() => setHoursTuesdayStartFocus(true)}
                    onBlur={() => setHoursTuesdayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Tuesday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Tuesday Finish: " 
                    type="time" 
                    id="hoursTuesdayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Tuesday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursTuesdayFinish}
                    aria-invalid={validHoursTuesdayFinish ? "false" : "true"}
                    onFocus={() => setHoursTuesdayFinishFocus(true)}
                    onBlur={() => setHoursTuesdayFinishFocus(false)}
                />
            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Tuesday?</label>
                    <FormControlLabel
                        value="Closed on Tuesday?"
                        control={
                        <Checkbox checked={closedOnTuesday}
                                onChange={()=>setClosedOnTuesday(!closedOnTuesday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Wednesday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Wednesday Start: " 
                    type="time" 
                    id="hoursWednesdayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Wednesday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursWednesdayStart}
                    aria-invalid={validHoursWednesdayStart ? "false" : "true"}
                    onFocus={() => setHoursWednesdayStartFocus(true)}
                    onBlur={() => setHoursWednesdayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Wednesday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Wednesday Finish: " 
                    type="time" 
                    id="hoursWednesdayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Wednesday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursWednesdayFinish}
                    aria-invalid={validHoursWednesdayFinish ? "false" : "true"}
                    onFocus={() => setHoursWednesdayFinishFocus(true)}
                    onBlur={() => setHoursWednesdayFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Wednesday?</label>
                    <FormControlLabel
                        value="Closed on Wednesday?"
                        control={
                        <Checkbox checked={closedOnWednesday}
                                onChange={()=>setClosedOnWednesday(!closedOnWednesday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Thursday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Thursday Start: " 
                    type="time" 
                    id="hoursThursdayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Thursday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursThursdayStart}
                    aria-invalid={validHoursThursdayStart ? "false" : "true"}
                    onFocus={() => setHoursThursdayStartFocus(true)}
                    onBlur={() => setHoursThursdayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Thursday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Thursday Finish: " 
                    type="time" 
                    id="hoursThursdayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Thursday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursThursdayFinish}
                    aria-invalid={validHoursThursdayFinish ? "false" : "true"}
                    onFocus={() => setHoursThursdayFinishFocus(true)}
                    onBlur={() => setHoursThursdayFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Thursday?</label>
                    <FormControlLabel
                        value="Closed on Thursday?"
                        control={
                        <Checkbox checked={closedOnThursday}
                                onChange={()=>setClosedOnThursday(!closedOnThursday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Friday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Friday Start: " 
                    type="time" 
                    id="hoursFridayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Friday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursFridayStart}
                    aria-invalid={validHoursFridayStart ? "false" : "true"}
                    onFocus={() => setHoursFridayStartFocus(true)}
                    onBlur={() => setHoursFridayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Friday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Friday Finish: " 
                    type="time" 
                    id="hoursFridayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Friday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursFridayFinish}
                    aria-invalid={validHoursFridayFinish ? "false" : "true"}
                    onFocus={() => setHoursFridayFinishFocus(true)}
                    onBlur={() => setHoursFridayFinishFocus(false)}
                />
            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Friday?</label>
                    <FormControlLabel
                        value="Closed on Friday?"
                        control={
                        <Checkbox checked={closedOnFriday}
                                onChange={()=>setClosedOnFriday(!closedOnFriday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Saturday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Saturday Start: " 
                    type="time" 
                    id="hoursSaturdayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Saturday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursSaturdayStart}
                    aria-invalid={validHoursSaturdayStart ? "false" : "true"}
                    onFocus={() => setHoursSaturdayStartFocus(true)}
                    onBlur={() => setHoursSaturdayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Saturday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Saturday Finish: " 
                    type="time" 
                    id="hoursSaturdayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Saturday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursSaturdayFinish}
                    aria-invalid={validHoursSaturdayFinish ? "false" : "true"}
                    onFocus={() => setHoursSaturdayFinishFocus(true)}
                    onBlur={() => setHoursSaturdayFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Saturday?</label>
                    <FormControlLabel
                        value="Closed on Saturday?"
                        control={
                        <Checkbox checked={closedOnSaturday}
                                onChange={()=>setClosedOnSaturday(!closedOnSaturday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />
            </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Sunday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Sunday Start: " 
                    type="time" 
                    id="hoursSundayStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Sunday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursSundayStart}
                    aria-invalid={validHoursSundayStart ? "false" : "true"}
                    onFocus={() => setHoursSundayStartFocus(true)}
                    onBlur={() => setHoursSundayStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Sunday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Sunday Finish: " 
                    type="time" 
                    id="hoursSundayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Sunday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={hoursSundayFinish}
                    aria-invalid={validHoursSundayFinish ? "false" : "true"}
                    onFocus={() => setHoursSundayFinishFocus(true)}
                    onBlur={() => setHoursSundayFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Sunday?</label>
                    <FormControlLabel
                        value="Closed on Sunday?"
                        control={
                        <Checkbox checked={closedOnSunday}
                                onChange={()=>setClosedOnSunday(!closedOnSunday)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

            </div>
            </div>


            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Holiday Hours - Start:</label>

                <input 
                    aria-label="Regular Hours Holiday Start: " 
                    type="time" 
                    id="holidayHoursStart"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Holiday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={holidayHoursStart}
                    aria-invalid={validHolidayHoursStart ? "false" : "true"}
                    onFocus={() => setHolidayHoursStartFocus(true)}
                    onBlur={() => setHolidayHoursStartFocus(false)}
                />

            </div>

            <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                <label className='text-base font-semibold pl-2'>Holiday Hours - Finish:</label>

                <input 
                    aria-label="Regular Hours Holiday Finish: " 
                    type="time" 
                    id="hoursHolidayFinish"
                    autoComplete="off"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Holiday")}
                    onKeyDown={(e) => 
                        e.stopPropagation()
                        }
                    value={holidayHoursFinish}
                    aria-invalid={validHolidayHoursFinish ? "false" : "true"}
                    onFocus={() => setHolidayHoursFinishFocus(true)}
                    onBlur={() => setHolidayHoursFinishFocus(false)}
                />

            </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                md:w-[27vh] mt-4'>

                <label className='pb-4 font-bold'>Closed on Holidays?</label>
                    <FormControlLabel
                        value="Closed on Holidays?"
                        control={
                        <Checkbox checked={closedOnHolidays}
                                onChange={()=>setClosedOnHolidays(!closedOnHolidays)}
                                style ={{
                                color: "#995372",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

                </div>
        </div>           

        <div className='py-6'>
        <button 
            className={`align-center mb-4 px-4 py-4 text-[#995372] 
            border-2 rounded-xl border-[#995372] bg-white text-base font-semibold
            hover:bg-[#995372] hover:text-white flex justify-center items-center gap-x-3`}
          type="submit"
          onClick={(e) => onSubmitHandler(e)}>
            {isLoading && 
                <div aria-label="Loading..." role="status">
                    <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                    <path
                        className="fill-gray-200"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                    <path
                        className="fill-gray-800"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                    </svg>
                </div>
            }
          Save Changes
        </button>
        </div>

        {errorMessage && <div className="justify-center items-center mt-5 mb-5">
        {errorMessage && <div className="error">{errorMessage}</div>}
        </div>}

        </div>
    </Box>

    <ToastContainer
    toastStyle={{ backgroundColor: "#995372" }}
        position="bottom-center"
        autoClose={3000}
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




