import React, { useState, useEffect } from 'react';
import Box from "@material-ui/core/Box";
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';

import '../../../pages/AutoCompleteForm.css';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import editSettingsHostProfile from '../../../helpers/HostData/editSettingsHostProfile';
import getHostProfile from '../../../helpers/HostData/getHostProfile';



export default function ChangeProfileMainHost({loggedUserId}) {

  const { setAuth, auth } = useAuth();
  const logout = useLogout();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [scheduleCheck, setScheduleCheck] = useState(false)
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

  const [currency, setCurrency] = useState("cad");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [chargeRate, setChargeRate] = useState(3);

  const [hoursMondayStart, setHoursMondayStart] = useState('09:00');
  const [validHoursMondayStart, setValidHoursMondayStart] = useState(false);
  const [hoursMondayStartFocus, setHoursMondayStartFocus] = useState(false);

  const [hoursMondayFinish, setHoursMondayFinish] = useState('20:00');
  const [validHoursMondayFinish, setValidHoursMondayFinish] = useState(false);
  const [hoursMondayFinishFocus, setHoursMondayFinishFocus] = useState(false);

  const [hoursTuesdayStart, setHoursTuesdayStart] = useState('09:00');
  const [validHoursTuesdayStart, setValidHoursTuesdayStart] = useState(false);
  const [hoursTuesdayStartFocus, setHoursTuesdayStartFocus] = useState(false);

  const [hoursTuesdayFinish, setHoursTuesdayFinish] = useState('20:00');
  const [validHoursTuesdayFinish, setValidHoursTuesdayFinish] = useState(false);
  const [hoursTuesdayFinishFocus, setHoursTuesdayFinishFocus] = useState(false);

  const [hoursWednesdayStart, setHoursWednesdayStart] = useState('09:00');
  const [validHoursWednesdayStart, setValidHoursWednesdayStart] = useState(false);
  const [hoursWednesdayStartFocus, setHoursWednesdayStartFocus] = useState(false);

  const [hoursWednesdayFinish, setHoursWednesdayFinish] = useState('20:00');
  const [validHoursWednesdayFinish, setValidHoursWednesdayFinish] = useState(false);
  const [hoursWednesdayFinishFocus, setHoursWednesdayFinishFocus] = useState(false);

  const [hoursThursdayStart, setHoursThursdayStart] = useState('09:00');
  const [validHoursThursdayStart, setValidHoursThursdayStart] = useState(false);
  const [hoursThursdayStartFocus, setHoursThursdayStartFocus] = useState(false);

  const [hoursThursdayFinish, setHoursThursdayFinish] = useState('20:00');
  const [validHoursThursdayFinish, setValidHoursThursdayFinish] = useState(false);
  const [hoursThursdayFinishFocus, setHoursThursdayFinishFocus] = useState(false);

  const [hoursFridayStart, setHoursFridayStart] = useState('09:00');
  const [validHoursFridayStart, setValidHoursFridayStart] = useState(false);
  const [hoursFridayStartFocus, setHoursFridayStartFocus] = useState(false);

  const [hoursFridayFinish, setHoursFridayFinish] = useState('20:00');
  const [validHoursFridayFinish, setValidHoursFridayFinish] = useState(false);
  const [hoursFridayFinishFocus, setHoursFridayFinishFocus] = useState(false);

  const [hoursSaturdayStart, setHoursSaturdayStart] = useState('09:00');
  const [validHoursSaturdayStart, setValidHoursSaturdayStart] = useState(false);
  const [hoursSaturdayStartFocus, setHoursSaturdayStartFocus] = useState(false);

  const [hoursSaturdayFinish, setHoursSaturdayFinish] = useState('20:00');
  const [validHoursSaturdayFinish, setValidHoursSaturdayFinish] = useState(false);
  const [hoursSaturdayFinishFocus, setHoursSaturdayFinishFocus] = useState(false);

  const [hoursSundayStart, setHoursSundayStart] = useState('09:00');
  const [validHoursSundayStart, setValidHoursSundayStart] = useState(false);
  const [hoursSundayStartFocus, setHoursSundayStartFocus] = useState(false);

  const [hoursSundayFinish, setHoursSundayFinish] = useState('20:00');
  const [validHoursSundayFinish, setValidHoursSundayFinish] = useState(false);
  const [hoursSundayFinishFocus, setHoursSundayFinishFocus] = useState(false);

  const [holidayHoursStart, setHolidayHoursStart] = useState('09:00');
  const [validHolidayHoursStart, setValidHolidayHoursStart] = useState(false);
  const [holidayHoursStartFocus, setHolidayHoursStartFocus] = useState(false);

  const [holidayHoursFinish, setHolidayHoursFinish] = useState('20:00');
  const [validHolidayHoursFinish, setValidHolidayHoursFinish] = useState(false);
  const [holidayHoursFinishFocus, setHolidayHoursFinishFocus] = useState(false);

const COMMENTS_REGEX = /^.{2,250}$/;
const REGULAR_HOURS_REGEX = /^.{2,250}$/;
const HOLIDAY_HOURS_REGEX = /^.{2,250}$/;

const jpyvalues = [
    {value: 0, text: "Free (¥0)"},{value: 75, text: "¥75"},
    {value: 150, text: "¥150"},{value: 225, text: "¥225"},
    {value: 300, text: "¥300"},{value: 400, text: "¥400"},
    {value: 500, text: "¥500"},{value: 600, text: "¥600"},
    {value: 700, text: "¥700"},{value: 800, text: "¥800"},
    {value: 900, text: "¥900"},{value: 1000, text: "¥1000"},
    {value: 1100, text: "¥1100"},{value: 1200, text: "¥1200"},
    {value: 1300, text: "¥1300"},{value: 1400, text: "¥1400"},
  ]

  const eurvalues = [
    {value: 0.0, text: "Free (€0.00)"},{value: 0.5, text: "€0.50"},
    {value: 1.0, text: "€1.00"},{value: 1.5, text: "€1.50"},
    {value: 2.0, text: "€2.00"},{value: 2.5, text: "€2.50"},
    {value: 3.0, text: "€3.00"},{value: 3.5, text: "€3.50"},
    {value: 4.0, text: "€4.00"},{value: 4.5, text: "€4.50"},
    {value: 5.0, text: "€5.00"},{value: 6.0, text: "€6.00"},
    {value: 7.0, text: "€7.00"},{value: 8.0, text: "€8.00"},
    {value: 9.0, text: "€9.00"},{value: 10.0, text: "€10.00"},
  ]

  const gbpvalues = [
    {value: 0.0, text: "Free (£0.00)"},{value: 0.5, text: "£0.50"},
    {value: 1.0, text: "£1.00"},{value: 1.5, text: "£1.50"},
    {value: 2.0, text: "£2.00"},{value: 2.5, text: "£2.50"},
    {value: 3.0, text: "£3.00"},{value: 3.5, text: "£3.50"},
    {value: 4.0, text: "£4.00"},{value: 4.5, text: "£4.50"},
    {value: 5.0, text: "£5.00"},{value: 6.0, text: "£6.00"},
    {value: 7.0, text: "£7.00"},{value: 8.0, text: "£8.00"},
    {value: 9.0, text: "£9.00"},{value: 10.0, text: "£10.00"},
  ]

  const cnyvalues = [
    {value: 0.0, text: "Free (¥0.0)"},{value: 3.0, text: "¥3.0"},
    {value: 6.0, text: "¥6.0"},{value: 9.0, text: "¥9.0"},
    {value: 12.0, text: "¥12.0"},{value: 15.0, text: "¥15.0"},
    {value: 20.0, text: "¥20.0"},{value: 25.0, text: "¥25.0"},
    {value: 30.0, text: "¥30.0"},{value: 35.0, text: "¥35.0"},
    {value: 40.0, text: "¥40.0"},{value: 45.0, text: "¥45.0"},
    {value: 50.0, text: "¥50.0"},
  ]

  const inrvalues = [
    {value: 0, text: "Free (₹0)"},{value: 50, text: "₹50"},
    {value: 100, text: "₹100"},{value: 150, text: "₹150"},
    {value: 200, text: "₹200"},{value: 250, text: "₹250"},
    {value: 300, text: "₹300"},{value: 350, text: "₹350"},
    {value: 400, text: "₹400"},{value: 450, text: "₹450"},
    {value: 500, text: "₹500"},{value: 550, text: "₹550"},
    {value: 600, text: "₹600"},{value: 650, text: "₹650"},
    {value: 700, text: "₹700"},{value: 750, text: "₹750"},
  ]

  const cadvalues = [
    {value: 0.0, text: "Free ($0.00)"},{value: 0.5, text: "$0.50"},
    {value: 1.0, text: "$1.00"},{value: 1.5, text: "$1.50"},
    {value: 2.0, text: "$2.00"},{value: 2.5, text: "$2.50"},
    {value: 3.0, text: "$3.00"},{value: 3.5, text: "$3.50"},
    {value: 4.0, text: "$4.00"},{value: 4.5, text: "$4.50"},
    {value: 5.0, text: "$5.00"},{value: 6.0, text: "$6.00"},
    {value: 7.0, text: "$7.00"},{value: 8.0, text: "$8.00"},
    {value: 9.0, text: "$9.00"},{value: 10.0, text: "$10.00"},
  ]
  
  const usdvalues = [
    {value: 0.0, text: "Free ($0.00)"},{value: 0.5, text: "$0.50"},
    {value: 1.0, text: "$1.00"},{value: 1.5, text: "$1.50"},
    {value: 2.0, text: "$2.00"},{value: 2.5, text: "$2.50"},
    {value: 3.0, text: "$3.00"},{value: 3.5, text: "$3.50"},
    {value: 4.0, text: "$4.00"},{value: 4.5, text: "$4.50"},
    {value: 5.0, text: "$5.00"},{value: 6.0, text: "$6.00"},
    {value: 7.0, text: "$7.00"},{value: 8.0, text: "$8.00"},
    {value: 9.0, text: "$9.00"},{value: 10.0, text: "$10.00"},
  ]

  const audvalues = [
    {value: 0.0, text: "Free ($0.00)"},{value: 0.5, text: "$0.50"},
    {value: 1.0, text: "$1.00"},{value: 1.5, text: "$1.50"},
    {value: 2.0, text: "$2.00"},{value: 2.5, text: "$2.50"},
    {value: 3.0, text: "$3.00"},{value: 3.5, text: "$3.50"},
    {value: 4.0, text: "$4.00"},{value: 4.5, text: "$4.50"},
    {value: 5.0, text: "$5.00"},{value: 6.0, text: "$6.00"},
    {value: 7.0, text: "$7.00"},{value: 8.0, text: "$8.00"},
    {value: 9.0, text: "$9.00"},{value: 10.0, text: "$10.00"},
  ]

  const nzdvalues = [
    {value: 0.0, text: "Free ($0.00)"},{value: 0.5, text: "$0.50"},
    {value: 1.0, text: "$1.00"},{value: 1.5, text: "$1.50"},
    {value: 2.0, text: "$2.00"},{value: 2.5, text: "$2.50"},
    {value: 3.0, text: "$3.00"},{value: 3.5, text: "$3.50"},
    {value: 4.0, text: "$4.00"},{value: 4.5, text: "$4.50"},
    {value: 5.0, text: "$5.00"},{value: 6.0, text: "$6.00"},
    {value: 7.0, text: "$7.00"},{value: 8.0, text: "$8.00"},
    {value: 9.0, text: "$9.00"},{value: 10.0, text: "$10.00"},
  ]

useEffect(() => {
    setValidHostComments(COMMENTS_REGEX.test(hostComments));
}, [hostComments])

useEffect( () => {

    if( ((!hoursMondayStart || !hoursMondayFinish) && !closedOnMonday && !allDayMonday) ||
        ((!hoursTuesdayStart || !hoursTuesdayFinish) && !closedOnTuesday && !allDayTuesday) ||
        ((!hoursWednesdayStart || !hoursWednesdayFinish) && !closedOnWednesday && !allDayWednesday) ||
        ((!hoursThursdayStart || !hoursThursdayFinish) && !closedOnThursday && !allDayThursday) ||
        ((!hoursMondayStart || !hoursMondayFinish) && !closedOnMonday && !allDayMonday) ||
        ((!hoursMondayStart || !hoursMondayFinish) && !closedOnMonday && !allDayMonday) ||
        ((!hoursMondayStart || !hoursMondayFinish) && !closedOnMonday && !allDayMonday) ||
        ((!hoursMondayStart || !hoursMondayFinish) && !closedOnMonday && !allDayMonday)
    ){
        setScheduleCheck(false)
    } else {
        setScheduleCheck(true)
    }
    
    }, [hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
    hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
    holidayHoursStart, holidayHoursFinish, 
    closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
    allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,])

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
  
          if(response && response.foundHostProfile){
            
            setHoursMondayStart(response.foundHostProfile.hoursMondayStart)
            setHoursMondayFinish(response.foundHostProfile.hoursMondayFinish)
            setHoursTuesdayStart(response.foundHostProfile.hoursTuesdayStart)
            setHoursTuesdayFinish(response.foundHostProfile.hoursTuesdayFinish)
            setHoursWednesdayStart(response.foundHostProfile.hoursWednesdayStart)
            setHoursWednesdayFinish(response.foundHostProfile.hoursWednesdayFinish)
            setHoursThursdayStart(response.foundHostProfile.hoursThursdayStart)
            setHoursThursdayFinish(response.foundHostProfile.hoursThursdayFinish)
            setHoursFridayStart(response.foundHostProfile.hoursFridayStart)
            setHoursFridayFinish(response.foundHostProfile.hoursFridayFinish)
            setHoursSaturdayStart(response.foundHostProfile.hoursSaturdayStart)
            setHoursSaturdayFinish(response.foundHostProfile.hoursSaturdayFinish)
            setHoursSundayStart(response.foundHostProfile.hoursSundayStart)
            setHoursSundayFinish(response.foundHostProfile.hoursSundayFinish)
            setHolidayHoursStart(response.foundHostProfile.holidayHoursStart)
            setHolidayHoursFinish(response.foundHostProfile.holidayHoursFinish)
            
            setClosedOnMonday(response.foundHostProfile.closedOnMonday)
            setClosedOnTuesday(response.foundHostProfile.closedOnTuesday)
            setClosedOnWednesday(response.foundHostProfile.closedOnWednesday)
            setClosedOnThursday(response.foundHostProfile.closedOnThursday)
            setClosedOnFriday(response.foundHostProfile.closedOnFriday)
            setClosedOnSaturday(response.foundHostProfile.closedOnSaturday)
            setClosedOnSunday(response.foundHostProfile.closedOnSunday)
            setClosedOnHolidays(response.foundHostProfile.closedOnHolidays)

            setAllDayMonday(response.foundHostProfile.allDayMonday)
            setAllDayTuesday(response.foundHostProfile.allDayTuesday)
            setAllDayWednesday(response.foundHostProfile.allDayWednesday)
            setAllDayThursday(response.foundHostProfile.allDayThursday)
            setAllDayFriday(response.foundHostProfile.allDayFriday)
            setAllDaySaturday(response.foundHostProfile.allDaySaturday)
            setAllDaySunday(response.foundHostProfile.allDaySunday)
            setAllDayHolidays(response.foundHostProfile.allDayHolidays)

            setHostComments(response.foundHostProfile.hostComments)
            setCurrency(response.foundHostProfile.currency)
            setCurrencySymbol(response.foundHostProfile.currencySymbol)
            setChargeRate(response.foundHostProfile.chargeRatePerHalfHour)
            
          }
        }
  
        if(auth.userId){
            getData()
        }
  
      }, [auth.userId])


    const handleCurrencyChange = (e) => {

        e.preventDefault()
        setCurrency(e.target.value)

        if(e.target.value === "cad"){
            setCurrencySymbol("$")
            setChargeRate(3)
        } else if(e.target.value === "usd"){
            setCurrencySymbol("$")
            setChargeRate(3)
        } else if(e.target.value === "eur"){
            setCurrencySymbol("€")
            setChargeRate(3)
        } else if(e.target.value === "gbp"){
            setCurrencySymbol("£")
            setChargeRate(3)
        } else if(e.target.value === "inr"){
            setCurrencySymbol("₹")
            setChargeRate(300)
        } else if(e.target.value === "jpy"){
            setCurrencySymbol("¥")
            setChargeRate(300)
        } else if(e.target.value === "cny"){
            setCurrencySymbol("¥")
            setChargeRate(9)
        } else if(e.target.value === "aud"){
            setCurrencySymbol("$")
            setChargeRate(3)
        } else if(e.target.value === "nzd"){
            setCurrencySymbol("$")
            setChargeRate(3)
        }
    }

    const handleDayClosed = (event, day) => {

        if (day === 'Monday'){
    
          setClosedOnMonday(event.target.checked)
          setHoursMondayStart("")
          setHoursMondayFinish("")
          if(event.target.checked){
            setAllDayMonday(!event.target.checked)
          }
           
        } else if( day === 'Tuesday'){
    
            setClosedOnTuesday(event.target.checked)
            setHoursTuesdayStart("")
            setHoursTuesdayFinish("")
            if(event.target.checked){
                setAllDayTuesday(!event.target.checked)
            }
    
        } else if (day === 'Wednesday'){
    
            setClosedOnWednesday(event.target.checked)
            setHoursWednesdayStart("")
            setHoursWednesdayFinish("")
            if(event.target.checked){
                setAllDayWednesday(!event.target.checked)
            }
    
        } else if (day === 'Thursday'){
    
            setClosedOnThursday(event.target.checked)
            setHoursThursdayStart("")
            setHoursThursdayFinish("")
            if(event.target.checked){
                setAllDayThursday(!event.target.checked)
            }
    
        } else if (day === 'Friday'){
    
            setClosedOnFriday(event.target.checked)
            setHoursFridayStart("")
            setHoursFridayFinish("")
            if(event.target.checked){
                setAllDayFriday(!event.target.checked)
            }
    
        } else if (day === 'Saturday'){
    
            setClosedOnSaturday(event.target.checked)
            setHoursSaturdayStart("")
            setHoursSaturdayFinish("")
            if(event.target.checked){
                setAllDaySaturday(!event.target.checked)
            }
    
        } else if (day === 'Sunday'){
    
            setClosedOnSunday(event.target.checked)
            setHoursSundayStart("")
            setHoursSundayFinish("")
            if(event.target.checked){
                setAllDaySunday(!event.target.checked)
            }
    
        } else if (day === 'Holidays'){
    
            setClosedOnHolidays(event.target.checked)
            setHolidayHoursStart("")
            setHolidayHoursFinish("")
            if(event.target.checked){
                setAllDayHolidays(!event.target.checked)
            }
        }
      }
    
      const handleAllDay = (event, day) => {
    
        if (day === 'Monday'){
    
            setAllDayMonday(event.target.checked)   
            setHoursMondayStart("")
            setHoursMondayFinish("")
            if(event.target.checked){
                setClosedOnMonday(!event.target.checked)
            }
           
        } else if( day === 'Tuesday'){
    
            setAllDayTuesday(event.target.checked)
            setHoursTuesdayStart("")
            setHoursTuesdayFinish("")
            if(event.target.checked){
                setClosedOnTuesday(!event.target.checked)
            }
    
        } else if (day === 'Wednesday'){
            
            setAllDayWednesday(event.target.checked)
            setHoursWednesdayStart("")
            setHoursWednesdayFinish("")
            if(event.target.checked){
                setClosedOnWednesday(!event.target.checked)
            }
    
        } else if (day === 'Thursday'){
    
            setAllDayThursday(event.target.checked)
            setHoursThursdayStart("")
            setHoursThursdayFinish("")
            if(event.target.checked){
                setClosedOnThursday(!event.target.checked)
            }
    
        } else if (day === 'Friday'){
    
            setAllDayFriday(event.target.checked)
            setHoursFridayStart("")
            setHoursFridayFinish("")
            if(event.target.checked){
                setClosedOnFriday(!event.target.checked)
            }
    
        } else if (day === 'Saturday'){
    
            setAllDaySaturday(event.target.checked)
            setHoursSaturdayStart("")
            setHoursSaturdayFinish("")
            if(event.target.checked){
                setClosedOnSaturday(!event.target.checked)
            }
    
        } else if (day === 'Sunday'){
    
            setAllDaySunday(event.target.checked)
            setHoursSundayStart("")
            setHoursSundayFinish("")
            if(event.target.checked){
                setClosedOnSunday(!event.target.checked)
            }
    
        } else if (day === 'Holidays'){
    
            setAllDayHolidays(event.target.checked)
            setHolidayHoursStart("")
            setHolidayHoursFinish("")
            if(event.target.checked){
                setClosedOnHolidays(!event.target.checked)
            }
        }
      }

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

        } else if (day === 'Holidays'){

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

        } else if (day === 'Holidays'){

            setHolidayHoursFinish(event.target.value)
        }
    }


  async function onSubmitHandler(e) {

    e.preventDefault();

    if(isLoading){
        return
    }

    setIsLoading(true);

    const editedSettings = await editSettingsHostProfile(auth.userId, 
        hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
        hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
        holidayHoursStart, holidayHoursFinish, 
        closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
        allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
        currency, chargeRate, hostComments,
        auth.accessToken)

    if(editedSettings){

        toast.success("Success! Changed host profile and settings!", {
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
  };

  
  return (
    <>
    <Box
        style={{display: "flex",
        height: "100%",
        width: "100%",
        justifyContent: "center"}}
    >
        <div className='flex flex-col content-center items-center w-full'>

            <div className='w-full flex flex-col pt-4 gap-y-4'>

                <div className="flex flex-row justify-center items-center gap-x-2">

                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                    <select onChange={(event)=>handleCurrencyChange(event)}
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

                <div className="flex flex-row justify-center items-center gap-x-2 pb-4">

                    <div className='flex flex-col p-2'>
                        <p className="flex font-semibold">Charge Rate Per 30 Min:</p>
                    </div>
                    
                    <select className="pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center" 
                    value={chargeRate}
                    onChange={(event) => {
                        setChargeRate(event.target.value);
                    }}>
                    
                    {currency === "usd" && usdvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "cad" && cadvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "eur" && eurvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "gbp" && gbpvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "inr" && inrvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "jpy" && jpyvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "cny" && cnyvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "aud" && audvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                      {currency === "nzd" && nzdvalues.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.text}</option>
                      ))}
                    
                    </select>
                </div>  

            </div>

            <div className='flex w-full px-4 md:px-0 pt-2 md:pt-0 pb-4'>

                <label className='text-base font-semibold pl-2'>Any Special Directions or Comments:</label>
                <input 
                    aria-label="Directions or Comments: " 
                    type="text" 
                    id="Hostcomments"
                    autoComplete="hostcomments"
                    placeholder="Host Comments:"
                    className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                {/* <label className='pb-4 font-bold'>Closed on Monday?</label> */}
                    <FormControlLabel
                        label="Closed on Monday?"
                        control={
                        <Checkbox checked={closedOnMonday}
                            onChange={(e)=>handleDayClosed(e, "Monday")}
                            style ={{
                            color: "#00D3E0",
                            transform: "scale(1.5)",
                            paddingBottom: '12pt'
                        }}
                        />
                    }
                    />
            </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Monday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Monday?"
                        control={
                        <Checkbox checked={allDayMonday}
                                onChange={(e)=>handleAllDay(e, "Monday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Tuesday?</label> */}
                    <FormControlLabel
                        label="Closed on Tuesday?"
                        control={
                        <Checkbox checked={closedOnTuesday}
                            onChange={(e)=>handleDayClosed(e, "Tuesday")}
                            style ={{
                            color: "#00D3E0",
                            transform: "scale(1.5)",
                            paddingBottom: '12pt'
                        }}
                        />
                        }
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Tuesday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Tuesday?"
                        control={
                        <Checkbox checked={allDayTuesday}
                                onChange={(e)=>handleAllDay(e, "Tuesday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Wednesday?</label> */}
                    <FormControlLabel
                        label="Closed on Wednesday?"
                        control={
                        <Checkbox checked={closedOnWednesday}
                                onChange={(e)=>handleDayClosed(e, "Wednesday")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                        />
                        }
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Wednesday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Wednesday?"
                        control={
                        <Checkbox checked={allDayWednesday}
                                onChange={(e)=>handleAllDay(e, "Wednesday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Thursday?</label> */}
                    <FormControlLabel
                        label="Closed on Thursday?"
                        control={
                        <Checkbox checked={closedOnThursday}
                                onChange={(e)=>handleDayClosed(e, "Thursday")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                        />
                        }
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Thursday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Thursday?"
                        control={
                        <Checkbox checked={allDayThursday}
                                onChange={(e)=>handleAllDay(e, "Thursday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Friday?</label> */}
                    <FormControlLabel
                        label="Closed on Friday?"
                        control={
                        <Checkbox checked={closedOnFriday}
                                onChange={(e)=>handleDayClosed(e, "Friday")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                        />
                        }
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Friday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Friday?"
                        control={
                        <Checkbox checked={allDayFriday}
                                onChange={(e)=>handleAllDay(e, "Friday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Saturday?</label> */}
                    <FormControlLabel
                        label="Closed on Saturday?"
                        control={
                        <Checkbox checked={closedOnSaturday}
                                onChange={(e)=>handleDayClosed(e, "Saturday")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                        />
                        }
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Saturday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Saturday?"
                        control={
                        <Checkbox checked={allDaySaturday}
                                onChange={(e)=>handleAllDay(e, "Saturday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
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

                    {/* <label className='pb-4 font-bold'>Closed on Sunday?</label> */}
                    <FormControlLabel
                        label="Closed on Sunday?"
                        control={
                        <Checkbox checked={closedOnSunday}
                                onChange={(e)=>handleDayClosed(e, "Sunday")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                        />
                        }
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Sunday?</label> */}
                    <FormControlLabel
                        label="Open 24/7 on Sunday?"
                        control={
                        <Checkbox checked={allDaySunday}
                                onChange={(e)=>handleAllDay(e, "Sunday")}
                                style ={{
                                color: "#00D3E0",
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                    onChange={ ( e ) => handleRegularHourChangeBegin(e, "Holidays")}
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
                        border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                    onChange={ ( e ) => handleRegularHourChangeEnd(e, "Holidays")}
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

                    {/* <label className='pb-4 font-bold'>Closed on Holidays?</label> */}
                    <FormControlLabel
                        label="Closed on Holidays?"
                        control={
                        <Checkbox checked={closedOnHolidays}
                                onChange={(e)=>handleDayClosed(e, "Holidays")}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.5)",
                                paddingBottom: '12pt'
                            }}
                            />
                        }
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    {/* <label className='pb-4 font-bold'>Open 24/7 on Holidays?</label> */}
                    <FormControlLabel
                        label="Closed on Holidays?"
                        control={
                        <Checkbox checked={allDayHolidays}
                                onChange={(e)=>handleAllDay(e, "Holidays")}
                                style ={{
                                color: "#00D3E0",
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
            className={`align-center mb-4 px-4 py-4 text-[#8BEDF3] 
            border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
            ${scheduleCheck ? "hover:cursor-not-allowed " : "hover:bg-[#8BEDF3] hover:text-white "}
             flex justify-center items-center gap-x-3`}
          type="submit"
          disabled={!scheduleCheck}
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
    toastStyle={{ backgroundColor: "#8BEDF3" }}
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

