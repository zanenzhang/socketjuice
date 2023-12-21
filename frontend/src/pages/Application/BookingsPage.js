import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import MainHeader from '../../components/mainHeader/mainHeader';
import useAuth from '../../hooks/useAuth';
import Tab from "@material-ui/core/Tab";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";  
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import CameraPlug from '../CameraPlug';
import axios from "../../api/axios";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./slider.css";

import evconnectors from "../../images/evconnectors.jpeg";
import evcharger from "../../images/ev_charger.jpeg";
import evplug from "../../images/ev_connector_plug.jpg"

import addDriverCancelApprove from '../../helpers/Appointments/addDriverCancelApprove';
import addDriverCancelSubmit from '../../helpers/Appointments/addDriverCancelSubmit';
import addDriverReject from '../../helpers/Appointments/addDriverReject';

import addHostCancelApprove from '../../helpers/Appointments/addHostCancelApprove';
import addHostCancelSubmit from '../../helpers/Appointments/addHostCancelSubmit';
import addHostReject from '../../helpers/Appointments/addHostReject';

import getUserData from '../../helpers/Userdata/getUserData';
import addHostProfile from '../../helpers/Media/addHostProfile';
import getDriverAppointments from '../../helpers/Appointments/getDriverAppointments';
import getHostAppointments from '../../helpers/Appointments/getHostAppointments';

import addAppointmentApproval from '../../helpers/Appointments/addAppointmentApproval';
import addAppointmentCompletion from '../../helpers/Appointments/addAppointmentCompletion';
import addAppointmentFlag from '../../helpers/Flags/addAppointmentFlag';
import getAppointmentFlags from "../../helpers/Flags/getAppointmentFlags";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ToastContainer, toast } from 'react-toastify';
import dayjs from 'dayjs';
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import 'react-toastify/dist/ReactToastify.css';


const BookingsPage = () => {

  const localizer = dayjsLocalizer(dayjs);
  const DnDCalendar = withDragAndDrop(Calendar);

  const { auth, setAuth, setActiveTab, socket, setSocket, 
      setNewMessages, setNewIndividualChat } = useAuth();

  const navigate = useNavigate();

  const sliderRefPre = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(1);

  const [isLoaded, setIsLoaded] = useState(false)
  const [value, setValue] = useState("0");
  const [waiting, setWaiting] = useState(false);
  const [waitingSubmit, setWaitingSubmit] = useState(false);
  const [waitingCancel, setWaitingCancel] = useState(false);
  const [refreshFlags, setRefreshFlags] = useState(0)
  
  const [openHelpModal, setOpenHelpModal] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [waitingHelp, setWaitingHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [validHelpMessage, setValidHelpMessage] = useState(false);
  
  const [selectedMediaURLs, setSelectedMediaURLs] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const IMAGE_UPLOAD_URL = '/s3/singleimage';
  const MESSAGE_REGEX = /^.{4,100}$/;

  const settings = {
    dots: true,
    infinite: true,
    speed: 450,
    initialSlide: 0,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipeToSlide: true,
    lazyLoad: true,
    slide: true,
    arrows: false,
    afterChange: (index) => {
        setCurrentSlide(index)
    }
  };

  const [scheduleCheck, setScheduleCheck] = useState(false)

  const [pickerDateDriver, setPickerDateDriver] = useState(new Date())
  const [pickerDateHost, setPickerDateHost] = useState(new Date())
  const [currentDateDriver, setCurrentDateDriver] = useState(new Date().toISOString().slice(0,10))
  const [currentDateHost, setCurrentDateHost] = useState(new Date().toISOString().slice(0,10))

  const [hostAppointments, setHostAppointments] = useState([])
  const [driverAppointments, setDriverAppointments] = useState([])
  const [newrequest, setNewrequest] = useState(0);

  const [termscheckedDriver, setTermscheckedDriver] = useState(true);
  const [termscheckedHost, setTermscheckedHost] = useState(true);

  const [hostEvents, setHostEvents] = useState([])
  const [driverEvents, setDriverEvents] = useState([])

  const [verifiedHost, setVerifiedHost] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deactivated, setDeactivated] = useState(false)

  const [chargeRate, setChargeRate] = useState(3.0);
  const [chargeRateFee, setChargeRateFee] = useState(3.5);
  const [chargeTotal, setChargeTotal] = useState(3.5);
  const [currency, setCurrency] = useState("cad");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [connectorType, setConnectorType] = useState("AC-J1772-Type1");
  const [secondaryConnectorType, setSecondaryConnectorType] = useState("None");
  const [chargingLevel, setChargingLevel] = useState("Level 1")

  const [closedOnMonday, setClosedOnMonday] = useState(false);
  const [closedOnTuesday, setClosedOnTuesday] = useState(false);
  const [closedOnWednesday, setClosedOnWednesday] = useState(false);
  const [closedOnThursday, setClosedOnThursday] = useState(false);
  const [closedOnFriday, setClosedOnFriday] = useState(false);
  const [closedOnSaturday, setClosedOnSaturday] = useState(false);
  const [closedOnSunday, setClosedOnSunday] = useState(false);
  const [closedOnHolidays, setClosedOnHolidays] = useState(true);

  const [hoursMondayStart, setHoursMondayStart] = useState('09:00');
  const [validhoursMondayStart, setValidhoursMondayStart] = useState(false);
  const [hoursMondayStartFocus, setHoursMondayStartFocus] = useState(false);

  const [hoursMondayFinish, setHoursMondayFinish] = useState('20:00');
  const [validhoursMondayFinish, setValidhoursMondayFinish] = useState(false);
  const [hoursMondayFinishFocus, setHoursMondayFinishFocus] = useState(false);

  const [hoursTuesdayStart, setHoursTuesdayStart] = useState('09:00');
  const [validhoursTuesdayStart, setValidhoursTuesdayStart] = useState(false);
  const [hoursTuesdayStartFocus, setHoursTuesdayStartFocus] = useState(false);

  const [hoursTuesdayFinish, setHoursTuesdayFinish] = useState('20:00');
  const [validhoursTuesdayFinish, setValidhoursTuesdayFinish] = useState(false);
  const [hoursTuesdayFinishFocus, setHoursTuesdayFinishFocus] = useState(false);

  const [hoursWednesdayStart, setHoursWednesdayStart] = useState('09:00');
  const [validhoursWednesdayStart, setValidhoursWednesdayStart] = useState(false);
  const [hoursWednesdayStartFocus, setHoursWednesdayStartFocus] = useState(false);

  const [hoursWednesdayFinish, setHoursWednesdayFinish] = useState('20:00');
  const [validhoursWednesdayFinish, setValidhoursWednesdayFinish] = useState(false);
  const [hoursWednesdayFinishFocus, setHoursWednesdayFinishFocus] = useState(false);

  const [hoursThursdayStart, setHoursThursdayStart] = useState('09:00');
  const [validhoursThursdayStart, setValidhoursThursdayStart] = useState(false);
  const [hoursThursdayStartFocus, setHoursThursdayStartFocus] = useState(false);

  const [hoursThursdayFinish, setHoursThursdayFinish] = useState('20:00');
  const [validhoursThursdayFinish, setValidhoursThursdayFinish] = useState(false);
  const [hoursThursdayFinishFocus, setHoursThursdayFinishFocus] = useState(false);

  const [hoursFridayStart, setHoursFridayStart] = useState('09:00');
  const [validhoursFridayStart, setValidhoursFridayStart] = useState(false);
  const [hoursFridayStartFocus, setHoursFridayStartFocus] = useState(false);

  const [hoursFridayFinish, setHoursFridayFinish] = useState('20:00');
  const [validhoursFridayFinish, setValidhoursFridayFinish] = useState(false);
  const [hoursFridayFinishFocus, setHoursFridayFinishFocus] = useState(false);

  const [hoursSaturdayStart, setHoursSaturdayStart] = useState('09:00');
  const [validhoursSaturdayStart, setValidhoursSaturdayStart] = useState(false);
  const [hoursSaturdayStartFocus, setHoursSaturdayStartFocus] = useState(false);

  const [hoursSaturdayFinish, setHoursSaturdayFinish] = useState('20:00');
  const [validhoursSaturdayFinish, setValidhoursSaturdayFinish] = useState(false);
  const [hoursSaturdayFinishFocus, setHoursSaturdayFinishFocus] = useState(false);

  const [hoursSundayStart, setHoursSundayStart] = useState('09:00');
  const [validhoursSundayStart, setValidhoursSundayStart] = useState(false);
  const [hoursSundayStartFocus, setHoursSundayStartFocus] = useState(false);

  const [hoursSundayFinish, setHoursSundayFinish] = useState('20:00');
  const [validhoursSundayFinish, setValidhoursSundayFinish] = useState(false);
  const [hoursSundayFinishFocus, setHoursSundayFinishFocus] = useState(false);

  const [holidayHoursStart, setHolidayHoursStart] = useState('09:00');
  const [validHolidayHoursStart, setValidHolidayHoursStart] = useState(false);
  const [holidayHoursStartFocus, setHolidayHoursStartFocus] = useState(false);

  const [holidayHoursFinish, setHolidayHoursFinish] = useState('20:00');
  const [validHolidayHoursFinish, setValidHolidayHoursFinish] = useState(false);
  const [holidayHoursFinishFocus, setHolidayHoursFinishFocus] = useState(false);

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

  const REGULAR_HOURS_REGEX_DAILY = /^.{2,100}$/;
  const HOLIDAY_HOURS_REGEX = /^.{2,100}$/;
  const COMMENTS_REGEX = /^.{2,250}$/;

  useEffect(() => {
    setValidHelpMessage(MESSAGE_REGEX.test(helpMessage))
  }, [helpMessage])
  
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


  useEffect( ()=> {

    if(currency === "cad"){
      setCurrencySymbol("$")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else if(currency === "usd"){
      setCurrencySymbol("$")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else if(currency === "eur"){
      setCurrencySymbol("€")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else if(currency === "gbp"){
      setCurrencySymbol("£")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else if(currency === "inr"){
      setCurrencySymbol("₹")
      setChargeRate(300)
      setChargeRateFee(350)
    } else if(currency === "jpy"){
      setCurrencySymbol("¥")
      setChargeRate(300)
      setChargeRateFee(350)
    } else if(currency === "cny"){
      setCurrencySymbol("¥")
      setChargeRate(9)
      setChargeRateFee(11)
    } else if(currency === "aud"){
      setCurrencySymbol("$")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else if(currency === "nzd"){
      setCurrencySymbol("$")
      setChargeRate(3)
      setChargeRateFee(3.5)
    } else {
      setCurrencySymbol("$")
      setChargeRate(3)
      setChargeRateFee(3.5)
    }
  }, [currency])

  useEffect(() => {
    setValidhoursMondayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursMondayStart));
  }, [hoursMondayStart])

  useEffect(() => {
      setValidhoursMondayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursMondayFinish));
  }, [hoursMondayFinish])

  useEffect(() => {
      setValidhoursTuesdayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursTuesdayStart));
  }, [hoursTuesdayStart])

  useEffect(() => {
      setValidhoursTuesdayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursTuesdayFinish));
  }, [hoursTuesdayFinish])

  useEffect(() => {
      setValidhoursWednesdayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursWednesdayStart));
  }, [hoursWednesdayStart])

  useEffect(() => {
      setValidhoursWednesdayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursWednesdayFinish));
  }, [hoursWednesdayFinish])

  useEffect(() => {
      setValidhoursThursdayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursThursdayStart));
  }, [hoursThursdayStart])

  useEffect(() => {
      setValidhoursThursdayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursThursdayFinish));
  }, [hoursThursdayFinish])

  useEffect(() => {
      setValidhoursFridayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursFridayStart));
  }, [hoursFridayStart])

  useEffect(() => {
      setValidhoursFridayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursFridayFinish));
  }, [hoursFridayFinish])

  useEffect(() => {
      setValidhoursSaturdayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursSaturdayStart));
  }, [hoursSaturdayStart])

  useEffect(() => {
      setValidhoursSaturdayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursSaturdayFinish));
  }, [hoursSaturdayFinish])

  useEffect(() => {
      setValidhoursSundayStart(REGULAR_HOURS_REGEX_DAILY.test(hoursSundayStart));
  }, [hoursSundayStart])

  useEffect(() => {
      setValidhoursSundayFinish(REGULAR_HOURS_REGEX_DAILY.test(hoursSundayFinish));
  }, [hoursSundayFinish])

  useEffect(() => {
      setValidHolidayHoursStart(HOLIDAY_HOURS_REGEX.test(holidayHoursStart));
  }, [holidayHoursStart])

  useEffect(() => {
      setValidHolidayHoursFinish(HOLIDAY_HOURS_REGEX.test(holidayHoursFinish));
  }, [holidayHoursFinish])

  useEffect(() => {
    setValidHostComments(COMMENTS_REGEX.test(hostComments));
}, [hostComments])

useEffect( () => {

  if( ((!hoursMondayStart || !hoursMondayFinish) && (!closedOnMonday && !allDayMonday)) ||
      ((!hoursTuesdayStart || !hoursTuesdayFinish) && (!closedOnTuesday && !allDayTuesday)) ||
      ((!hoursWednesdayStart || !hoursWednesdayFinish) && (!closedOnWednesday && !allDayWednesday)) ||
      ((!hoursThursdayStart || !hoursThursdayFinish) && (!closedOnThursday && !allDayThursday)) ||
      ((!hoursFridayStart || !hoursFridayFinish) && (!closedOnFriday && !allDayFriday)) ||
      ((!hoursSaturdayStart || !hoursSaturdayFinish) && (!closedOnSaturday && !allDaySaturday)) ||
      ((!hoursSundayStart || !hoursSundayFinish) && (!closedOnSunday && !allDaySunday)) ||
      ((!holidayHoursStart || !holidayHoursFinish) && (!closedOnHolidays && !allDayHolidays))
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

  const [croppedImageURL, setCroppedImageURL] = useState([]);
  const [croppedImage, setCroppedImage] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [videoArray, setVideoArray] = useState([]);
  const [videoURLArray, setVideoURLArray] = useState([]);
  const [videoThumbnails, setVideoThumbnails] = useState([]);
  const [oldMediaTrack, setOldMediaTrack] = useState([]);

  const [specialComments, setSpecialComments] = useState("")
  const [directionsURL, setDirectionsURL] = useState("")

  const [openDetailsModalDriver, setOpenDetailsModalDriver] = useState(false);
  const [openDetailsModalHost, setOpenDetailsModalHost] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("")
  
  const [selectedHostUserId, setSelectedHostUserId] = useState("")
  const [selectedDriverUserId, setSelectedDriverUserId] = useState("")
  const [selectedHostFirstName, setSelectedHostFirstName] = useState("")
  const [selectedDriverFirstName, setSelectedDriverFirstName] = useState("")

  const [selectedAddress, setSelectedAddress] = useState("")
  const [selectedEventStatus, setSelectedEventStatus] = useState("")
  const [selectedEventStart, setSelectedEventStart] = useState("")
  const [selectedEventEnd, setSelectedEventEnd] = useState("")
  const [selectedPlateURL, setSelectedPlateURL] = useState("")
  const [driverRequestedCancel, setDriverRequestedCancel] = useState(false)
  const [hostRequestedCancel, setHostRequestedCancel] = useState(false)
  
  const [selectedCurrency, setSelectedCurrency] = useState("")
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState("")
  const [selectedTotalCharge, setSelectedTotalCharge] = useState(0)

  const [selectedLat, setSelectedLat] = useState("")
  const [selectedLng, setSelectedLng] = useState("")

  const handleChargeRate = (e) => {

    setChargeRate(Number(e.target.value))

    if(Number(e.target.value) === 0){

      setChargeRateFee(Number(e.target.value))

    } else {

      if(currency === "cad"){

        setChargeRateFee(Number(e.target.value) + 0.50)
  
      } else if(currency === "usd"){
  
        setChargeRateFee(Number(e.target.value) + 0.50)
  
      } else if(currency === "eur"){
  
        setChargeRateFee(Number(e.target.value) + 0.50)
  
      } else if(currency === "gbp"){
  
        setChargeRateFee(Number(e.target.value) + 0.50)
      
      } else if(currency === "inr"){
  
        setChargeRateFee(Number(e.target.value) + 50)
  
      } else if(currency === "jpy"){
  
        setChargeRateFee(Number(e.target.value) + 50)
  
      } else if(currency === "cny"){
  
        setChargeRateFee(Number(e.target.value) + 2)
  
      } else if(currency === "aud"){
        setChargeRateFee(Number(e.target.value) + 0.50)
  
      } else if(currency === "nzd"){
  
        setChargeRateFee(Number(e.target.value) + 0.50)
      }
    }
  }

  const toggleTermsDriver = () => {
    setTermscheckedDriver(prev => !prev);
  }

  const toggleTermsHost = () => {
    setTermscheckedHost(prev => !prev);
  }

  const handleMessageDriver = async () => {

    if(!auth.userId){
        return
    }

    setNewIndividualChat({userId: selectedHostUserId, firstName: selectedHostFirstName});
    setTimeout( () => {
      navigate(`/messages`);
    }, 300)
  }

  const boxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 350,
    height: 500,
    overflow: 'auto',
    bgcolor: 'background.paper',
    border: '2px solid #00D3E0',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
    borderRadius: '10px',
  };

  const handleTermsClick = (event) => {

    event.preventDefault()

    window.open("/terms", "_blank");
  }

  const handleMessageHost = async () => {

    if(!auth.userId){
        return
    }

    setNewIndividualChat({userId: selectedDriverUserId, firstName: selectedDriverFirstName});
    setTimeout( () => {
      navigate(`/messages`);
    }, 300)
  }

  useEffect ( () => {

    async function getFlags(){

      const appointmentFlags = await getAppointmentFlags(auth.userId, auth.accessToken)

      if(appointmentFlags){

        setAuth( prev => {

          return {
            ...prev,
            appointmentFlags: appointmentFlags?.appointmentFlags
          }
        })
      }
    }

    if(refreshFlags > 0){
      getFlags()
    }

  }, [refreshFlags])


  const handleHostEventListClick = (event, hostevent) => {

    event.preventDefault()

    setSelectedDriverUserId(hostevent.requesterId)
    setSelectedHostUserId(hostevent.hostId)
    setSelectedDriverFirstName(hostevent.driverFirstName)
    setSelectedHostFirstName(hostevent.hostFirstName)

    setSelectedEventId(hostevent.appointmentId)
    setSelectedAddress(hostevent.address)
    setSpecialComments(hostevent.hostComments)
    setSelectedEventStart(hostevent.start.toLocaleTimeString())
    setSelectedEventEnd(hostevent.end.toLocaleTimeString())
    setSelectedPlateURL(hostevent.driverPlateMediaURL)
    setSelectedEventStatus(hostevent.status)
    
    setDriverRequestedCancel(hostevent.driverRequestedCancel)
    setHostRequestedCancel(hostevent.hostRequestedCancel)

    setSelectedLat(hostevent.location[0])
    setSelectedLng(hostevent.location[1])

    setSelectedCurrency(hostevent.currency)
    setSelectedCurrencySymbol(hostevent.currencySymbol)
    setSelectedTotalCharge(hostevent.chargeAmount)

    if(auth.appointmentFlags?.length > 0){
      if(auth.appointmentFlags.some(flag => flag._appointmentId.toString() === hostevent?.appointmentId?.toString())){
        setFlagged(true)
      } else {
        setFlagged(false)
      }
    }
    
    setOpenDetailsModalHost(true)
  }

  const handleDriverEventListClick = (event, driverevent) => {

    event.preventDefault()

    setSelectedDriverUserId(driverevent.requesterId)
    setSelectedHostUserId(driverevent.hostId)
    
    setSelectedDriverFirstName(driverevent.driverFirstName)
    setSelectedHostFirstName(driverevent.hostFirstName)

    setSelectedEventId(driverevent.appointmentId)
    setSelectedAddress(driverevent.address)
    setSpecialComments(driverevent.hostComments)
    setSelectedMediaURLs(driverevent.mediaCarouselURLs)
    setSelectedEventStart(driverevent.start.toLocaleTimeString())
    setSelectedEventEnd(driverevent.end.toLocaleTimeString())
    setSelectedPlateURL(driverevent.driverPlateMediaURL)
    setSelectedEventStatus(driverevent.status)
    
    setDriverRequestedCancel(driverevent.driverRequestedCancel)
    setHostRequestedCancel(driverevent.hostRequestedCancel)

    setSelectedLat(driverevent.location[0])
    setSelectedLng(driverevent.location[1])

    setSelectedCurrency(driverevent.currency)
    setSelectedCurrencySymbol(driverevent.currencySymbol)
    setSelectedTotalCharge(driverevent.chargeAmountFee)

    if(auth.appointmentFlags?.length > 0){
      if(auth.appointmentFlags.some(flag => flag._appointmentId.toString() === driverevent?.appointmentId?.toString())){
        setFlagged(true)
      } else {
        setFlagged(false)
      }
    }
    
    setOpenDetailsModalDriver(true)

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

useEffect( () => {

  if(selectedAddress){
    var destinationString = encodeURIComponent(selectedAddress)
    var finalAddressEncoding = `https://www.google.com/maps/dir/?api=1&destination=${destinationString}&travelmode=driving`
    if(finalAddressEncoding?.length > 150){
      finalAddressEncoding = finalAddressEncoding.slice(150)
    }
    setDirectionsURL(finalAddressEncoding)
  }

}, [selectedAddress])

const handleSendHelp = (e) => {

  e.preventDefault()
  setWaitingHelp(true)

  async function sentFlag(){

    const addedflag = await addAppointmentFlag(auth.userId, selectedEventId, helpMessage, auth.accessToken)

    if(addedflag){
      setRefreshFlags(refreshFlags + 1)
      setWaitingHelp(false)
      alert("Sent request for help!")
    }
  }

  if(auth.userId){
    sentFlag()
  }
}

const handleHelpOpen = (e) => {

  e.preventDefault()

  setOpenHelpModal(true)
}

const handleHelpClose = (e) => {

  e.preventDefault()

  setOpenHelpModal(false)
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

  const profileStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 375,
    bgcolor: 'background.paper',
    border: '2px solid #00D3E0',
    boxShadow: 24,
    pt: 2,
    px: 2,
    pb: 3,
    borderRadius: '10px',
    display: "flex",
    flexDirection: "column",
    height: 500,
    zIndex: 10001,
};

    useEffect( ()=> {

      async function getUser() {

        const userdata = await getUserData(auth.accessToken, auth.userId)

        if(userdata && userdata?.foundHost){

          setVerifiedHost(userdata?.foundHost?.verifiedHostCharging)
          setSubmitted(userdata?.foundHost?.submittedChargingForReview)
          setDeactivated(userdata?.foundHost?.deactivated)

          setCurrency(userdata?.foundUser?.currency.toLowerCase())
          setCurrencySymbol(userdata.foundUser?.currencySymbol)
          setIsLoaded(true)
        }
      }

      if(auth.userId){

        getUser()

      }

      setActiveTab("bookings")

    }, [auth])


    const handleEventRejectHost = async (e) => {

      if(waitingCancel){
        return
      }

      setWaitingCancel(true)

      const submitted = await addHostReject(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

      if(submitted){
        alert("Rejected booking request")
        setOpenDetailsModalHost(false)
        setNewrequest(newrequest + 1)
        setWaitingCancel(false)
      }
    }

    const handleEventCancelHost = async (e) => {

      if(waitingCancel){
        return
      }
      setWaitingCancel(true)

      const submitted = await addHostCancelSubmit(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

      if(submitted){
        alert("Cancelled booking")
        setNewrequest(newrequest + 1)
        setWaitingCancel(false)
        setOpenDetailsModalHost(false)
      }
    }


    const handleEventRejectDriver = async (e) => {

      if(waitingCancel){
        return
      }
      setWaitingCancel(true)

      const submitted = await addDriverReject(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

      if(submitted){
        alert("Cancelled booking request")
        setOpenDetailsModalDriver(false)
        setWaitingCancel(false)
        setNewrequest(newrequest + 1)
      }
    }

    const handleEventCancelDriver = async (e) => {

      if(waitingCancel){
        return
      }
      setWaitingCancel(true)

      const submitted = await addDriverCancelSubmit(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

      if(submitted){
        alert("Cancellation request sent to host")
        setOpenDetailsModalDriver(false)
        setWaitingCancel(false)
        setNewrequest(newrequest + 1)
      }
    }
    
    const handleEventActionHost = async (e) => {

      e.preventDefault()

      if(hostRequestedCancel){
        return
      }

      setWaitingSubmit(true)

      if(driverRequestedCancel){

        const approvedCancel = await addHostCancelApprove(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

        if(approvedCancel){
          alert("Cancelled booking")
          setOpenDetailsModalHost(false)
          setNewrequest(newrequest + 1)
          setWaitingSubmit(false)
        }

      } else if (selectedEventStatus === "Requested"){

        const bookingApproved = await addAppointmentApproval(selectedDriverUserId, directionsURL, auth.userId, selectedEventId, auth.accessToken)

        if(bookingApproved){
          alert("Booking approved")
          setOpenDetailsModalHost(false)
          setNewrequest(newrequest + 1)
          setWaitingSubmit(false)
        }

      } else if (selectedEventStatus === "Approved"){

        const bookingCompleted = await addAppointmentCompletion(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

        if(bookingCompleted){
          alert("Booking finished")
          setOpenDetailsModalHost(false)
          setNewrequest(newrequest + 1)
          setWaitingSubmit(false)
        } else {
          alert("Please hold, appointment has not yet been completed")
        }
      }
    }

    const handleEventActionDriver = async (e) => {

      e.preventDefault()

      if(driverRequestedCancel){
        return
      }

      setWaitingSubmit(true)

      if(hostRequestedCancel){

        const approvedCancel = await addDriverCancelApprove(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

        if(approvedCancel){
          alert("Approved cancellation")
          setOpenDetailsModalDriver(false)
          setNewrequest(newrequest + 1)
          setWaitingSubmit(false)
        }
      } 
    }


    const handleTabSwitch = (event, newValue) => {

        if(waiting){
            return
        }

        setWaiting(true);

        setValue(newValue);

        setWaiting(false);
    };

    const handleNavigateHost = (e) => {
      
      setCurrentDateHost(new Date().toISOString().slice(0,10))
      setPickerDateHost(dayjs(new Date(e)))
    }

    const handleNavigateDriver = (e) => {
      
      setCurrentDateDriver(new Date().toISOString().slice(0,10))
      setPickerDateDriver(dayjs(new Date(e)))
    }


    const handleCloseDetailsModalDriver = (e) => {

      e.preventDefault()
  
      setSelectedEventId("")
      setFlagged(false);
      setOpenDetailsModalDriver(false)
    }


    const handleCloseDetailsModalHost = (e) => {

      e.preventDefault()
  
      setSelectedEventId("")
      setFlagged(false)
      setOpenDetailsModalHost(false)
    }

    const handleHostPhotosUpload = async (event) => {

      event.preventDefault();
      
      if(waiting || (croppedImage?.length < 2) || (croppedImage?.length !== croppedImageURL?.length) || (croppedImage?.length === 0) ){
        return
      }

        toast.info("Checking for inappropriate content, please wait...", {
          position: "bottom-center",
          autoClose: 7000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });

        setWaiting(true);

        let currentIndex = 0;
        let mediaLength = 0;
        let finalImageObjArray = [];
        let finalVideoObjArray = [];

        mediaLength = croppedImage?.length

        while (mediaLength > 0 && currentIndex < mediaLength){

            if(croppedImageURL?.length > 0 && croppedImage[currentIndex] !== undefined){
        
                const formData = new FormData();
                const file = new File([croppedImage[currentIndex]], `${auth.userId}.jpeg`, { type: "image/jpeg" })
                formData.append("image", file);
                console.log("FORM1", formData)
                
                const nsfwResults = await axios.post("/nsfw/check", 
                    formData,
                    {
                      headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
                      'Content-Type': 'multipart/form-data'},
                        withCredentials: true
                    }
                );

                if (nsfwResults?.status !== 413){

                    var check1 = null;
                    var check2 = null;

                    for(let i=0; i<nsfwResults.data.length; i++){

                    if(nsfwResults.data[i].className === 'Hentai' && nsfwResults.data[i].probability < 0.2){
                        check1 = true
                    }
                    if(nsfwResults.data[i].className === 'Porn' && nsfwResults.data[i].probability < 0.2){
                        check2 = true
                    }
                }            

                if(check1 && check2){

                  console.log("FORM1", formData)

                    try {
                        const response = await axios.post(IMAGE_UPLOAD_URL, 
                            formData,
                            {
                              headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
                              'Content-Type': 'application/json'},
                                withCredentials: true
                            }
                        );

                        if(response?.status === 200){

                            const returnedObjId = response.data.key

                            finalImageObjArray.push(returnedObjId)
                            finalVideoObjArray.push("image")

                            currentIndex += 1
                        };

                    } catch (err) {
                        
                        setWaiting(false);
                        setErrorMessage("Failed to upload photo! Please try again!");

                        if(finalImageObjArray?.length > 0){

                            const deleted = await axios.delete("/s3/deletemany", 
                                {
                                    data: {
                                        userId: auth.userId,
                                        finalImageObjArray
                                    },
                                    headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
                                    'Content-Type': 'application/json'},
                                      withCredentials: true
                                }
                            );

                            if(deleted){
                                setWaiting(false)
                                return
                            }
                        }
                    }
                
                } else {

                    if(finalImageObjArray?.length > 0){

                        const deleted = await axios.delete("/s3/deletemany", 
                            {
                                data: {
                                    userId: auth.userId,
                                    finalImageObjArray
                                },
                                headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
                                'Content-Type': 'application/json'},
                                  withCredentials: true
                            }
                        );

                        if(deleted){
                            
                            setWaiting(false)
                            
                            return
                        }
                    }
                }
            
            } else {

                toast.error("The photo is too large, please upload a new photo!", {
                position: "bottom-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
                });
                setWaiting(false)
                break
            }

        } else {
            toast.error("This submission does not have an attached photo", {
                position: "bottom-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
            setWaiting(false)
            break
        }

        if(finalImageObjArray?.length === mediaLength){

          const previewMediaObjectId = finalImageObjArray[coverIndex]
          const previewMediaType = mediaTypes[coverIndex]
    
            try {

                const uploadedHostPhotos = await addHostProfile(
                  auth?.userId, previewMediaObjectId, finalImageObjArray, finalVideoObjArray,
                  mediaTypes, previewMediaType, coverIndex, 
                  chargeRate, chargeRateFee, currency, connectorType, secondaryConnectorType, chargingLevel,
                  hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
                  hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
                  holidayHoursStart, holidayHoursFinish, 
                  closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
                  allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
                  hostComments,
                  auth.accessToken)

                if(uploadedHostPhotos && uploadedHostPhotos.status === 200){

                    setSubmitted(true);

                    console.log("Success, photos have been uploaded. We will review and approve shortly.")
                    toast.info("Awesome, your charger details have been saved! We will review and approve shortly", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });

                    setWaiting(false)
                
                } else if(uploadedHostPhotos && uploadedHostPhotos.status === 402){

                  console.log("Unfortunately, inappropriate content has been detected, please try again")
                    toast.info("Unfortunately, inappropriate content has been detected, please try again", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });

                    setWaiting(false)

                } else {
                  console.log("Unfortunately, inappropriate content has been detected, please try again")
                    toast.info("Unfortunately, inappropriate content has been detected, please try again", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });

                    setWaiting(false)
                }

            } catch(err){

                console.log(err)
            }
        }
      }
    }

    const handleSelectEventHost = (e) => {
      
      setSelectedDriverUserId(e.requesterId)
      setSelectedHostUserId(e.hostId)
      setSelectedEventId(e.appointmentId)
      setSelectedAddress(e.address)
      setSpecialComments(e.hostComments)
      setSelectedEventStart(e.start.toLocaleTimeString())
      setSelectedEventEnd(e.end.toLocaleTimeString())
      setSelectedPlateURL(e.driverPlateMediaURL)
      setSelectedEventStatus(e.status)
      
      setDriverRequestedCancel(e.driverRequestedCancel)
      setHostRequestedCancel(e.hostRequestedCancel)
  
      setSelectedLat(e.location[0])
      setSelectedLng(e.location[1])

      if(auth.appointmentFlags?.length > 0){
        if(auth.appointmentFlags.some(flag => flag._appointmentId.toString() === e.appointmentId?.toString())){
          setFlagged(true)
        } else {
          setFlagged(false)
        }
      }
      
      setOpenDetailsModalHost(true)
    }


    const handleSelectEventDriver = (e) => {
      
      setSelectedDriverUserId(e.requesterId)
      setSelectedHostUserId(e.hostId)
      setSelectedEventId(e.appointmentId)
      setSelectedAddress(e.address)
      setSpecialComments(e.hostComments)
      setSelectedMediaURLs(e.mediaCarouselURLs)

      setSelectedEventStart(e.start.toLocaleTimeString())
      setSelectedEventEnd(e.end.toLocaleTimeString())
      setSelectedPlateURL(e.driverPlateMediaURL)
      setSelectedEventStatus(e.status)
      
      setDriverRequestedCancel(e.driverRequestedCancel)
      setHostRequestedCancel(e.hostRequestedCancel)
  
      setSelectedLat(e.location[0])
      setSelectedLng(e.location[1])

      if(auth.appointmentFlags?.length > 0){
        if(auth.appointmentFlags.some(flag => flag._appointmentId.toString() === e?.appointmentId?.toString())){
          setFlagged(true)
        } else {
          setFlagged(false)
        }
      }
      
      setOpenDetailsModalDriver(true)
    }


    useEffect( ()=> {
  
      async function hostAppointments() {
  
        const hostresults = await getHostAppointments(auth.userId, currentDateHost, auth.accessToken, auth.userId)
  
        if(hostresults){
  
          var newevents = [];
          var hostprofiledata = {};
          var hostuserdata = {};
  
          for (let i=0; i<hostresults.foundHostProfiles?.length; i++){
            if(hostprofiledata[hostresults.foundHostProfiles[i]._userId] === undefined){
              hostprofiledata[hostresults.foundHostProfiles[i]._userId] = hostresults.foundHostProfiles[i]
            }
          }
  
          for (let i=0; i<hostresults.userData?.length; i++){
            if(hostuserdata[hostresults.userData[i]._id] === undefined){
              hostuserdata[hostresults.userData[i]._id] = hostresults.userData[i]
            }
          }
  
          for (let i=0; i<hostresults?.hostAppointments.length; i++){
  
            if(hostprofiledata[hostresults?.hostAppointments[i]._hostUserId] !== undefined){
              hostresults.hostAppointments[i].address = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.address
              hostresults.hostAppointments[i].locationlat = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[1]
              hostresults.hostAppointments[i].locationlng = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[0]
              hostresults.hostAppointments[i].currency = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.currency
              hostresults.hostAppointments[i].currencySymbol = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.currencySymbol
              hostresults.hostAppointments[i].hostComments = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.hostComments
            }

            if(hostuserdata[hostresults.hostAppointments[i]._hostUserId] !== undefined){
              hostresults.hostAppointments[i].hostProfilePicURL = hostuserdata[hostresults.hostAppointments[i]._hostUserId].profilePicURL
              hostresults.hostAppointments[i].hostPlateMediaURL = hostuserdata[hostresults.hostAppointments[i]._hostUserId].plateMediaURL
              hostresults.hostAppointments[i].hostFirstName = hostuserdata[hostresults.hostAppointments[i]._hostUserId].firstName
              hostresults.hostAppointments[i].hostLastName = hostuserdata[hostresults.hostAppointments[i]._hostUserId].lastName
              hostresults.hostAppointments[i].phonePrimary = hostuserdata[hostresults.hostAppointments[i]._hostUserId].phonePrimary
            }

            if(hostuserdata[hostresults.hostAppointments[i]._requestUserId] !== undefined){
              hostresults.hostAppointments[i].driverProfilePicURL = hostuserdata[hostresults.hostAppointments[i]._requestUserId].profilePicURL
              hostresults.hostAppointments[i].driverPlateMediaURL = hostuserdata[hostresults.hostAppointments[i]._requestUserId].plateMediaURL
              hostresults.hostAppointments[i].driverFirstName = hostuserdata[hostresults.hostAppointments[i]._requestUserId].firstName
              hostresults.hostAppointments[i].driverLastName = hostuserdata[hostresults.hostAppointments[i]._requestUserId].lastName
              hostresults.hostAppointments[i].phonePrimary = hostuserdata[hostresults.hostAppointments[i]._requestUserId].phonePrimary
            }
            
            var instance = {
              id: `booking_${hostresults.hostAppointments[i]._id}`,
              appointmentId: hostresults.hostAppointments[i]._id, 
              title: `Booked Time - ${hostresults.hostAppointments[i].firstName}`,
              address: hostresults.hostAppointments[i].address,
              location: [hostresults.hostAppointments[i].locationlat, hostresults.hostAppointments[i].locationlng],
              status: hostresults.hostAppointments[i].status,
              start: new Date(hostresults.hostAppointments[i].start),
              end: new Date(hostresults.hostAppointments[i].end),
              hostId: hostresults.hostAppointments[i]._hostUserId,
              requesterId: hostresults.hostAppointments[i]._requestUserId,
              driverRequestedCancel: hostresults.hostAppointments[i].cancelRequestDriverSubmit,
              hostRequestedCancel: hostresults.hostAppointments[i].cancelRequestHostSubmit,
              
              hostProfilePicURL: hostresults.hostAppointments[i].hostProfilePicURL,
              hostPlateMediaURL: hostresults.hostAppointments[i].hostPlateMediaURL,
              hostFirstName: hostresults.hostAppointments[i].hostFirstName,
              hostLastName: hostresults.hostAppointments[i].hostLastName,

              driverProfilePicURL: hostresults.hostAppointments[i].driverProfilePicURL,
              driverPlateMediaURL: hostresults.hostAppointments[i].driverPlateMediaURL,
              driverFirstName: hostresults.hostAppointments[i].driverFirstName,
              driverLastName: hostresults.hostAppointments[i].driverLastName,

              chargeAmount: hostresults.hostAppointments[i].chargeAmount,
              chargeAmountFee: hostresults.hostAppointments[i].chargeAmountFee,
              currency: hostresults.hostAppointments[i].currency,
              currencySymbol: hostresults.hostAppointments[i].currencySymbol,
              hostComments: hostresults.hostAppointments[i].hostComments,

              isDraggable: true
            }
  
            newevents.push(instance)
          }
  
          newevents.sort(function(a,b){
            return new Date(b.start) - new Date(a.start);
          })

          setHostAppointments([...hostresults.hostAppointments])
          setHostEvents(newevents)
        }
      }
  
      if((currentDateHost && auth.userId && value === "0") || (newrequest > 0) ){
        hostAppointments()
      }
  
    }, [currentDateHost, auth, value, newrequest])


    const handleLinkURLDirections = (e) => {

      e.preventDefault()
        
      if (!selectedAddress) {
        return
      } 

      window.open(directionsURL, "_blank", "noreferrer");
    }

    const {scrollToTime} = useMemo(
      () => ({
        scrollToTime: new Date(),
      }),
      []
    )

    useEffect( () => {
  
      async function driverAppointments() {
  
        const driverresults = await getDriverAppointments(auth.userId, currentDateDriver, auth.accessToken, auth.userId)
  
        if(driverresults){
  
          var newevents = [];
          var hostprofiledata = {};
          var hostuserdata = {};
  
          for (let i=0; i<driverresults.foundHostProfiles?.length; i++){
            if(hostprofiledata[driverresults.foundHostProfiles[i]._userId] === undefined){
              hostprofiledata[driverresults.foundHostProfiles[i]._userId] = driverresults.foundHostProfiles[i]
            }
          }
  
          for (let i=0; i<driverresults.userData?.length; i++){
            if(hostuserdata[driverresults.userData[i]._id] === undefined){
              hostuserdata[driverresults.userData[i]._id] = driverresults.userData[i]
            }
          }
  
          for (let i=0; i<driverresults?.userAppointments.length; i++){
  
            if(hostprofiledata[driverresults?.userAppointments[i]._hostUserId]){
              driverresults.userAppointments[i].address = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.address
              driverresults.userAppointments[i].locationlat = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.location?.coordinates[1]
              driverresults.userAppointments[i].locationlng = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.location?.coordinates[0]
              driverresults.userAppointments[i].currency = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.currency
              driverresults.userAppointments[i].currencySymbol = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.currencySymbol
              driverresults.userAppointments[i].hostComments = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.hostComments
              driverresults.userAppointments[i].mediaCarouselURLs = hostprofiledata[driverresults.userAppointments[i]._hostUserId]?.mediaCarouselURLs
            }

            if(hostuserdata[driverresults.userAppointments[i]._hostUserId]){
              driverresults.userAppointments[i].hostProfilePicURL = hostuserdata[driverresults.userAppointments[i]._hostUserId].profilePicURL
              driverresults.userAppointments[i].hostPlateMediaURL = hostuserdata[driverresults.userAppointments[i]._hostUserId].plateMediaURL
              driverresults.userAppointments[i].hostFirstName = hostuserdata[driverresults.userAppointments[i]._hostUserId].firstName
              driverresults.userAppointments[i].hostLastName = hostuserdata[driverresults.userAppointments[i]._hostUserId].lastName
              driverresults.userAppointments[i].phonePrimary = hostuserdata[driverresults.userAppointments[i]._hostUserId].phonePrimary
            }

            if(hostuserdata[driverresults.userAppointments[i]._requestUserId]){
              driverresults.userAppointments[i].driverProfilePicURL = hostuserdata[driverresults.userAppointments[i]._requestUserId].profilePicURL
              driverresults.userAppointments[i].driverPlateMediaURL = hostuserdata[driverresults.userAppointments[i]._requestUserId].plateMediaURL
              driverresults.userAppointments[i].driverFirstName = hostuserdata[driverresults.userAppointments[i]._requestUserId].firstName
              driverresults.userAppointments[i].driverLastName = hostuserdata[driverresults.userAppointments[i]._requestUserId].lastName
              driverresults.userAppointments[i].phonePrimary = hostuserdata[driverresults.userAppointments[i]._requestUserId].phonePrimary
            }
            
            var instance = {
              id: `booking_${driverresults.userAppointments[i]._id}`,
              appointmentId: driverresults.userAppointments[i]._id, 
              title: `Booked Time - ${driverresults.userAppointments[i].driverFirstName}`,
              address: driverresults.userAppointments[i].address,
              location: [driverresults.userAppointments[i].locationlat, driverresults.userAppointments[i].locationlng],
              status: driverresults.userAppointments[i].status,
              start: new Date(driverresults.userAppointments[i].start),
              end: new Date(driverresults.userAppointments[i].end),
              hostId: driverresults.userAppointments[i]._hostUserId,
              requesterId: driverresults.userAppointments[i]._requestUserId,
              driverRequestedCancel: driverresults.userAppointments[i].cancelRequestDriverSubmit,
              hostRequestedCancel: driverresults.userAppointments[i].cancelRequestHostSubmit,
              
              hostProfilePicURL: driverresults.userAppointments[i].hostProfilePicURL,
              hostPlateMediaURL: driverresults.userAppointments[i].hostPlateMediaURL,
              hostFirstName: driverresults.userAppointments[i].hostFirstName,
              hostLastName: driverresults.userAppointments[i].hostLastName,

              driverProfilePicURL: driverresults.userAppointments[i].driverProfilePicURL,
              driverPlateMediaURL: driverresults.userAppointments[i].driverPlateMediaURL,
              driverFirstName: driverresults.userAppointments[i].driverFirstName,
              driverLastName: driverresults.userAppointments[i].driverLastName,

              chargeAmount: driverresults.userAppointments[i].chargeAmount,
              chargeAmountFee: driverresults.userAppointments[i].chargeAmountFee,
              currency: driverresults.userAppointments[i].currency,
              currencySymbol: driverresults.userAppointments[i].currencySymbol,
              hostComments: driverresults.userAppointments[i].hostComments,
              mediaCarouselURLs: driverresults.userAppointments[i].mediaCarouselURLs,

              isDraggable: true
            }

            newevents.push(instance)
          }

          newevents.sort(function(a,b){
            return new Date(b.start) - new Date(a.start);
          })

          setDriverAppointments(driverresults.userAppointments)
          setDriverEvents([...newevents])
        }
      }
  
      if ( (currentDateDriver && auth.userId && value === "1") || (newrequest > 0) ){
        driverAppointments()
      }
  
    }, [currentDateDriver, auth, value, newrequest])


    
  return (

    <>

    <div style={{height:'100svh', width:'100svw'}} 
                className="bg-white bg-center max-w-full
                    flex flex-col fixed w-full">

    <MainHeader 
        loggedUserId={auth.userId}  />

      
      <div className='flex relative flex-col items-center pt-[7vh] sm:pt-[8vh] 
              md:pt-[9vh] h-[100svh] w-[100svw] overflow-y-scroll'>

          <TabContext value={value}>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <div className='flex justify-center'>
              <TabList onChange={handleTabSwitch} 
                  aria-label="lab API tabs example"
                  TabIndicatorProps={{style: {background:'#00D3E0'}}}
                  >
              <Tab label="Received Bookings" value="0" />
              <Tab label="Outgoing Requests" value="1" />
              </TabList>
              </div>
          </Box>

          <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '0px',
              display:'flex', flexDirection: 'column', width: '100%'}} value="0">        

        {(verifiedHost && isLoaded ) && 

          <div className='pt-1 pb-4 flex flex-col gap-y-3 w-full justify-center items-center'>

          <p>Recent Bookings From Other EV Drivers</p>
          {deactivated && <p className='py-2 font-semibold font-lg'>Please note: Your host location is currently turned off. To turn back on, please go to the settings panel.</p>}

            <div className='flex flex-col w-[350px] max-h-[400px] overflow-y-auto mx-2 my-2 
              hover:cursor-pointer border-y border-gray-500'>

              {hostEvents.map((event) => (
                
                <div key={event.id} className='flex flex-row w-full border border-[#00D3E0] justify-center 
                  items-center py-2 px-3 mt-2'
                  onClick={(e)=>{handleHostEventListClick(e, event)}}>

                  <div className='flex flex-col flex-shrink-0'>
                    <img className='w-[70px] rounded-full border border-gray-400' 
                    src={event.driverProfilePicURL} />
                  </div>

                  <div className='flex flex-col gap-y-1 pl-6'>
                    <p>Booked By: {event.driverFirstName}</p>
                    <p>Date: {event.start.toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'})}</p>
                    <p>Start: {event.start.toLocaleTimeString()}</p>
                    <p>End: {event.end.toLocaleTimeString()}</p>
                    <p>Host Message: {event.hostComments}</p>
                    <p>Status: {event.status === "CancelSubmitted" ? "Asked to Cancel" : event.status}</p>
                  </div>

                </div>
              ))}

            </div>

              <div className='flex flex-col w-[250px] pt-4'>
                <LocalizationProvider dateAdapter={AdapterDayjs}>

                    <DatePicker
                      value={dayjs(pickerDateHost)}
                      onChange={(date) => setPickerDateHost(dayjs(new Date(date)))}
                      />

                </LocalizationProvider>
              </div>

            <div className='flex flex-col w-full max-w-[400px] overflow-y-scroll justify-center'>

                <div className='pt-4 pb-4 flex flex-col gap-y-3'>

                    <div className='flex flex-row justify-center py-2'>
                      <span className='bg-[#8BEDF3] h-[50px] w-[100px] flex justify-center items-center p-2'>Incoming Bookings</span>
                      <span className='bg-[#FFE142] h-[50px] w-[100px] flex justify-center items-center p-2'>Your Bookings</span>
                    </div>

                    <DnDCalendar

                      style={{ height: "500px" }}

                      date={pickerDateHost}
                      defaultView="day"
                      events={hostEvents}
                      localizer={localizer}
                      
                      startAccessor="start"
                      endAccessor="end"
                      draggableAccessor="isDraggable"

                      views={['day']}

                      onSelectEvent={(e)=>handleSelectEventHost(e)}
                      scrollToTime={scrollToTime}
                      onNavigate={date=>handleNavigateHost(date)}

                      eventPropGetter={
                        (event) => {
                          let newStyle = {
                            backgroundColor: "#8BEDF3",
                            color: 'black',
                            borderRadius: "0px",
                            border: "none"
                          };
                    
                          return {
                            className: "",
                            style: newStyle
                          };
                        }
                      }

                      selectable
                  />
                  </div>
              </div>
            </div>}

            {(!verifiedHost && submitted && isLoaded) && 
        
            <div className='flex relative flex-col items-center h-[100svh] w-[100svw] overflow-y-scroll py-3'>
                    
              <div className='flex flex-row bg-[#FFE142] py-4 px-6 rounded-xl'>
                <p>We are currently reviewing your charging location, please hold!</p>
              </div>
            
            </div> }


        {(!verifiedHost && !submitted && isLoaded) && 
        
        <div className='flex relative flex-col items-center h-[100svh] w-full overflow-y-scroll px-4 gap-y-2'>
            
          <div className='bg-[#FFE142] rounded-xl p-3 mt-3'>
            <p className=''>Please submit the information below for review. This is so drivers book and pay for the correct equipment.</p>
            <p >After we approve your information, drivers will be able to request bookings and you will be able to earn income.</p>
          </div>

          <p className='text-base md:text-lg font-bold pt-4'>Step 1) Upload at least 1 photo of your charging equipment and 1 photo of the plug connection. </p>
          <p className='text-base md:text-lg font-bold pb-2'>Here is our example: </p>

          <div className='flex flex-col md:flex-row'>

              <img className='w-[375px] py-2' src={evcharger} />
              <img className='w-[375px] py-2' src={evplug} />

          </div>

          <div className="w-full flex flex-col items-center justify-center">

          <p className='text-base md:text-lg font-bold pb-2'>Attach your charging equipment photos (max 5): </p>
            
            <CameraPlug croppedImage={croppedImage} setCroppedImage={setCroppedImage} croppedImageURL={croppedImageURL} setCroppedImageURL={setCroppedImageURL} 
              coverIndex={coverIndex} setCoverIndex={setCoverIndex} mediaTypes={mediaTypes} setMediaTypes={setMediaTypes} videoArray={videoArray} setVideoArray={setVideoArray} 
              videoURLArray={videoURLArray} setVideoURLArray={setVideoURLArray}  videoThumbnails={videoThumbnails} setVideoThumbnails={setVideoThumbnails} 
              oldMediaTrack={oldMediaTrack} setOldMediaTrack={setOldMediaTrack} limit={5} />
            
          </div>

              <div className='w-full flex flex-col justify-center items-center gap-y-4 pt-4 '>

                <p className='text-base md:text-lg font-bold pt-4'>Step 2) Select how much for drivers to pay you per 30 min charge (you can change this later too) </p>

                  <div className="flex flex-row justify-center items-center gap-x-2">

                      <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                      <select onChange={(event)=>setCurrency(event.target.value)}
                      value={currency}
                      className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                          <option value="usd">$USD</option>
                          <option value="cad">$CAD</option>
                          {/* <option value="eur">€EUR</option>
                          <option value="gbp">£GBP</option>
                          <option value="inr">₹INR</option>
                          <option value="jpy">¥JPY</option>
                          <option value="cny">¥CNY</option>
                          <option value="aud">$AUD</option>
                          <option value="nzd">$NZD</option> */}

                      </select> 

                  </div>

                  <div className="flex flex-row justify-center items-center gap-x-2">

                      <div className='flex flex-col p-2'>
                          <p className="flex font-semibold">Charge Rate Per 30 Min:</p>
                      </div>
                      
                      <select className="pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center" 
                      value={chargeRate}
                      onChange={(event) => {
                          handleChargeRate(event);
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

                  <p className='py-2'>Note: The charge rate amount is what you will receive (net of all service fees).</p>

                  <div className='flex flex-col justify-center items-center gap-y-3'>

                  <p className='text-base md:text-lg font-bold pt-4'>Step 3) Select the connector type for your main plug and if you have an adapter. (We will check against your photos but please match carefully!) </p>

                      <img className='border-2 border-[#00D3E0] mx-4 px-4 min-w-[375px] w-[600px] py-4' 
                      src={evconnectors} />

                      <div className='flex flex-row justify-center items-center'>
                      <label className="font-semibold pr-2">Connector Type:</label>

                      <select onChange={(event)=>setConnectorType(event.target.value)}
                      value={connectorType}
                      className={`text-sm w-30 md:w-40 h-10 text-black justify-center
                      border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

                          <option value="AC-J1772-Type1">AC-J1772-Type1</option>
                          <option value="AC-Mennekes-Type2">AC-Mennekes-Type2</option>
                          <option value="AC-GB/T">AC-GB/T</option>
                          <option value="DC-CCS1">DC-CCS1</option>
                          <option value="DC-CCS2">DC-CCS2</option>
                          <option value="DC-CHAdeMO">DC-CHAdeMO</option>
                          <option value="DC-GB/T">DC-GB/T</option>
                          <option value="Tesla">Tesla</option>

                      </select> 
                      </div>

                      <div className='flex flex-row justify-center items-center'>
                      <label className="pr-2 font-semibold">If you have any connector adaptors:</label>
                      <select onChange={(event)=>setSecondaryConnectorType(event.target.value)}
                      value={secondaryConnectorType}
                      className={`text-sm w-30 md:w-40 h-10 text-black justify-center
                      border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

                          <option value="None">None</option>
                          <option value="AC-J1772-Type1">AC-J1772-Type1</option>
                          <option value="AC-Mennekes-Type2">AC-Mennekes-Type2</option>
                          <option value="AC-GB/T">AC-GB/T</option>
                          <option value="DC-CCS1">DC-CCS1</option>
                          <option value="DC-CCS2">DC-CCS2</option>
                          <option value="DC-CHAdeMO">DC-CHAdeMO</option>
                          <option value="DC-GB/T">DC-GB/T</option>
                          <option value="Tesla">Tesla</option>

                      </select> 
                      </div>

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

              <p className='text-base md:text-lg font-bold pt-6'>Final Step) Select your time availabilities during the week for charging (you can change this later) </p>

              <div className='flex flex-row w-full md:w-[45vw] px-4 md:px-0 pt-4'>

                <label className='text-base font-semibold pl-2'>Any Special Directions or Comments for Drivers:</label>
                <input 
                    aria-label="Directions or Comments: " 
                    type="text" 
                    id="Hostcomments"
                    autoComplete="hostcomments"
                    placeholder="(e.g. Please don't honk upon arrival)"
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
                        aria-invalid={validhoursMondayStart ? "false" : "true"}
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
                        aria-invalid={validhoursMondayFinish ? "false" : "true"}
                        onFocus={() => setHoursMondayFinishFocus(true)}
                        onBlur={() => setHoursMondayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Monday?</label>
                        <FormControlLabel
                            label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Monday?</label>
                      <FormControlLabel
                          label=""
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
                        aria-invalid={validhoursTuesdayStart ? "false" : "true"}
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
                        aria-invalid={validhoursTuesdayFinish ? "false" : "true"}
                        onFocus={() => setHoursTuesdayFinishFocus(true)}
                        onBlur={() => setHoursTuesdayFinishFocus(false)}
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Tuesday?</label>
                    <FormControlLabel
                        label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Tuesday?</label>
                    <FormControlLabel
                        label=""
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
                        aria-invalid={validhoursWednesdayStart ? "false" : "true"}
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
                        aria-invalid={validhoursWednesdayFinish ? "false" : "true"}
                        onFocus={() => setHoursWednesdayFinishFocus(true)}
                        onBlur={() => setHoursWednesdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Wednesday?</label>
                        <FormControlLabel
                            label=""
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

                <div className='flex flex-col justify-center items-center px-4 md:px-0 md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Open 24/7 Wednesday?</label>
                        <FormControlLabel
                            label=""
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
                        aria-invalid={validhoursThursdayStart ? "false" : "true"}
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
                        aria-invalid={validhoursThursdayFinish ? "false" : "true"}
                        onFocus={() => setHoursThursdayFinishFocus(true)}
                        onBlur={() => setHoursThursdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Thursday?</label>
                    <FormControlLabel
                      label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Thursday?</label>
                    <FormControlLabel
                      label=""
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
                        aria-invalid={validhoursFridayStart ? "false" : "true"}
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
                        aria-invalid={validhoursFridayFinish ? "false" : "true"}
                        onFocus={() => setHoursFridayFinishFocus(true)}
                        onBlur={() => setHoursFridayFinishFocus(false)}
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Friday?</label>
                        <FormControlLabel
                            label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Friday</label>
                        <FormControlLabel
                            label=""
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
                        aria-invalid={validhoursSaturdayStart ? "false" : "true"}
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
                        aria-invalid={validhoursSaturdayFinish ? "false" : "true"}
                        onFocus={() => setHoursSaturdayFinishFocus(true)}
                        onBlur={() => setHoursSaturdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Saturday?</label>
                        <FormControlLabel
                            label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Saturday?</label>
                        <FormControlLabel
                            label=""
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
                        aria-invalid={validhoursSundayStart ? "false" : "true"}
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
                        aria-invalid={validhoursSundayFinish ? "false" : "true"}
                        onFocus={() => setHoursSundayFinishFocus(true)}
                        onBlur={() => setHoursSundayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Sunday?</label>
                        <FormControlLabel
                          label=""
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

                    <label className='pb-4 font-bold'>Open 24/7 Sunday</label>
                        <FormControlLabel
                          label=""
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

            {/* <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

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

                  <label className='pb-4 font-bold'>Closed on Holidays?</label>
                    <FormControlLabel
                      label=""
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

                  <label className='pb-4 font-bold'>Open 24/7 Holidays</label>
                    <FormControlLabel
                      label=""
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
          </div>            */}

          <div className='flex flex-row justify-center items-center 
            w-full md:w-[45vw] px-4 md:px-0 py-4'>

            <button className={`border bg-gray-300 
                  ${ (!scheduleCheck || croppedImage.length < 2) ? "hover:cursor-not-allowed" : "hover:bg-[#8BEDF3] "}
                  px-5 py-3 rounded-xl`}
              disabled={!scheduleCheck || croppedImage.length < 2}
              onClick={(e)=>handleHostPhotosUpload(e)}>
              Submit For Review
            </button>
          </div>
        
        </div> }

        </TabPanel>

        <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '0px', paddingBottom: '0px',
              display:'flex', flexDirection: 'column', width: '100%'}} value="1"> 

            <div className='pt-1 pb-4 flex flex-col gap-y-3 w-full justify-center items-center'>

              <p>Your Outgoing Bookings</p>

              <div className='flex flex-col w-[350px] max-h-[400px] overflow-y-auto mx-2 my-2 hover:cursor-pointer
                border-y border-gray-500'>

              {driverEvents.map((event) => (
                
                <div key={event.id} className='flex flex-row w-full border border-[#00D3E0] justify-center 
                  items-center py-2 mt-2 px-3'
                  onClick={(e)=>{handleDriverEventListClick(e, event)}}>

                  <div className='flex flex-col flex-shrink-0'>
                    <img className='w-[70px] rounded-full border border-gray-400' src={event.hostProfilePicURL} />
                  </div>

                  <div className='flex flex-col gap-y-1 pl-6'>
                    <p>Booked With: {event.hostFirstName}</p>
                    <p>Date: {event.start.toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'})}</p>
                    {event.status === "Approved" && <p>Address: {event.address.slice(0, (event.address.lastIndexOf(',', (event.address).lastIndexOf(',')-1))) }</p>}
                    <p>Start: {event.start.toLocaleTimeString()}</p>
                    <p>End: {event.end.toLocaleTimeString()}</p>
                    {event.status === "Approved" && <p>Host Message: {event.hostComments}</p>}
                    <p>Status: {event.status === "CancelSubmitted" ? "Asked to Cancel" : event.status}</p>
                  </div>

                </div>

              ))}

            </div>

              <div className='flex flex-col w-[250px] pt-4'>

                <LocalizationProvider dateAdapter={AdapterDayjs}>

                    <DatePicker
                      value={dayjs(pickerDateDriver)}
                      onChange={(date) => setPickerDateDriver(dayjs(new Date(date)))}
                    />

                </LocalizationProvider>
              
              </div>

                <div className='flex flex-col w-full max-w-[400px] overflow-y-scroll justify-center'>

                    <div className='pt-4 pb-4 flex flex-col gap-y-3'>

                        <div className='flex flex-row justify-center py-2'>
                          <span className='bg-[#8BEDF3] h-[50px] w-[100px] flex justify-center items-center p-2'>Incoming Bookings</span>
                          <span className='bg-[#FFE142] h-[50px] w-[100px] flex justify-center items-center p-2'>Your Bookings</span>
                        </div>

                        <DnDCalendar

                          style={{ height: "500px" }}

                          date={pickerDateDriver}
                          defaultView="day"
                          events={driverEvents}
                          localizer={localizer}
                          
                          startAccessor="start"
                          endAccessor="end"
                          draggableAccessor="isDraggable"

                          views={['day']}

                          onSelectEvent={(e)=>handleSelectEventDriver(e)}
                          scrollToTime={scrollToTime}
                          onNavigate={date=>handleNavigateDriver(date)}

                          eventPropGetter={
                            (event) => {
                              let newStyle = {
                                backgroundColor: "#FFE142",
                                color: 'black',
                                borderRadius: "0px",
                                border: "none"
                              };
                        
                              return {
                                className: "",
                                style: newStyle
                              };
                            }
                          }

                          selectable
                      />
                      </div>
                  </div>
              </div>

          </TabPanel>

          </TabContext>
        </div>

      </div>

        <Modal
            open={openDetailsModalDriver}
            disableAutoFocus={true}
            onClose={handleCloseDetailsModalDriver}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...profileStyle, height: "450px" }}>

              <div className='flex flex-col w-full overflow-y-scroll'>

                <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                  <div className='w-full flex flex-col justify-center items-center gap-y-2'>

                      <p className='text-center text-lg font-semibold'>Details of Outgoing Booking Request</p>

                      {(selectedAddress && selectedHostUserId !== auth.userId && !driverRequestedCancel
                     && selectedEventStatus !== "Requested" && selectedEventStatus !== "Cancelled"  && selectedEventStatus !== "Completed") && 
                    <button className='border border-gray-300 font-semibold font-lg px-3 py-3 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]'
                      onClick={(e)=>handleLinkURLDirections(e)}>
                        Get Directions (Opens Map)
                    </button>}

                      <img className='w-[350px] h-[350px] rounded-lg' src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />

                      <div className='flex flex-col w-full' key={"slidercontainer"}>

                      <Slider {...settings} ref={sliderRefPre}>
            
                      {selectedMediaURLs?.length > 0 && 
                        
                        selectedMediaURLs.map((image, index) => (

                            <div key={`hostmediapre_${index}`}> 
                                
                                <div>
                                    
                                    <div className='flex justify-center'>
                                    <Box
                                    style={{
                                        display:'flex',
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "column",
                                        height: 'auto',
                                        width: 360,
                                        maxHeight: { xs: 360, sm:400, md: 450 },
                                        maxWidth: { xs: 360, sm:400, md: 450 }
                                        }}
                                    >
                                    
                                    <div className='flex flex-col justify-center items-center'>

                                        <img 
                                            className={`w-[300px] rounded-t-lg border border-gray-200 z-0`}
                                            src={selectedMediaURLs[index]} 
                                        />
                                    
                                    </div>

                                    </Box>
                                    </div>
                              </div>         
                          </div>
                        ))}

                      </Slider>

                      </div>
                      
                      <div className='w-full py-3 gap-y-2 flex flex-col justify-center items-center'>
                        <p>Booking With: {selectedHostFirstName}</p>
                        <p>Start Time: {selectedEventStart}</p>
                        <p>End Time: {selectedEventEnd}</p>
                        <p>Status: {(driverRequestedCancel && selectedEventStatus !== "Cancelled") ? "You Asked To Cancel" : ( (hostRequestedCancel && selectedEventStatus !== "Cancelled" ) ? "You Asked to Cancel" : (selectedEventStatus === "Requested" ? "Booking Requested" : (selectedEventStatus === "Approved" ? "Approved" : (selectedEventStatus === "Cancelled" ? "Cancelled" : (selectedEventStatus === "Completed" ? "Completed" : "Waiting") )))) }</p>
                        <p className='text-xl font-semibold'>Total Cost: {selectedCurrency?.toUpperCase()}{selectedCurrencySymbol}{Number(selectedTotalCharge).toFixed(2)}</p>
                      </div>

                    </div>

                    {(selectedEventStatus !== "Cancelled" && selectedEventStatus !== "CancelSubmitted") && 
                    <div className='flex flex-row ml-2 py-2'>
                        <input  
                            className='w-5 h-5'
                            type="checkbox" 
                            id='termsagree'
                            onChange={toggleTermsDriver}
                            checked={termscheckedDriver}
                        />
                        <label className='ml-2 text-sm font-medium md:text-base' htmlFor="termsagree">{`I agree to the `}
                            <button className='text-blue-900 underline' onClick={(e)=>handleTermsClick(e)}> 
                              Terms of Service</button></label>
                    </div>}

                    {(selectedEventStatus !== "Requested" && selectedEventStatus !== "Approved") &&
                    
                    <button 
                    disabled={selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" || driverRequestedCancel 
                    || !termscheckedDriver || waitingSubmit || waitingCancel} 
                      className={`border border-gray-300 px-3 py-2 rounded-xl gap-x-2 flex flex-row justify-center items-center
                      ${ (selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" || driverRequestedCancel || !termscheckedDriver || waitingSubmit || waitingCancel) 
                      ? "bg-[#c1f2f5] cursor-not-allowed" : "bg-[#c1f2f5] hover:bg-[#00D3E0] " } `}
                      onClick={(e)=>handleEventActionDriver(e)}>

                    {waitingSubmit && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>}

                        {(selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) && <p>You Asked To Cancel - Waiting For Cancellation and Refund</p> }
                        {(selectedEventStatus === "CancelSubmitted" && hostRequestedCancel) && <p>Host Asked To Cancel</p> }
                        {(selectedEventStatus === "Cancelled") && <p>Booking Cancelled</p> }
                        {(selectedEventStatus === "Completed") && <p>Booking Completed</p> }
                    </button>}

                    {selectedEventStatus === "Requested" && 
                      <button 
                      className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] 
                      ${(!termscheckedDriver || waitingSubmit || waitingCancel) ? "hover:bg-gray-300 cursor-not-allowed" 
                      : "hover:bg-[#00D3E0] cursor-pointer" } 
                        gap-x-2 flex flex-row justify-center items-center`}
                        disabled={!termscheckedDriver || waitingSubmit || waitingCancel}
                      onClick={(e)=>handleEventRejectDriver(e)}>

                      {waitingCancel && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>}

                        Cancel Booking Request
                      </button>}

                    {(selectedEventStatus === "Approved" && !driverRequestedCancel) && 
                      <button className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] 
                      ${!termscheckedDriver || waitingSubmit || waitingCancel ? " cursor-not-allowed hover:bg-gray-400" : " hover:bg-[#00D3E0] "} 
                        gap-x-2 flex flex-row justify-center items-center`}
                        disabled={!termscheckedDriver || waitingSubmit || waitingCancel}
                      onClick={(e)=>handleEventCancelDriver(e)}>

                      {waitingCancel && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>}

                        Approved - Request to Cancel
                    </button>}

                    {(selectedEventStatus !== "Requested" && selectedEventStatus !== "Cancelled" && selectedEventStatus !== "Completed" ) && 
                    <p className='text-xl font-semibold pt-3 text-center w-full'>
                      Communications</p>}

                    {(selectedEventStatus !== "Requested" && selectedEventStatus !== "Cancelled" && selectedEventStatus !== "Completed" ) 
                      && 
                    <button className='border border-gray-300 px-3 py-2  gap-x-2
                      rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0] flex flex-row justify-center items-center'
                    onClick={(e)=>handleMessageDriver(e)}>

                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="currentColor" 
                        className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>

                      Send Message to {selectedHostFirstName}
                    </button>}

                    {(selectedEventStatus !== "Requested") && 
                    
                    <button className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] ${flagged ? " bg-gray-400 " : " hover:bg-[#00D3E0] "} 
                      gap-x-2 flex flex-row justify-center items-center`}
                      disabled={flagged}
                      onClick={(e)=>handleHelpOpen(e)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>

                      <p>{!flagged ? "Help! Contact SocketJuice" : "Already requested help!"}</p>

                    </button>}

                </div>
              </div>
            </Box>
        </Modal>


        <Modal
            open={openDetailsModalHost}
            disableAutoFocus={true}
            onClose={handleCloseDetailsModalHost}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...profileStyle, height: "450px" }}>

              <div className='flex flex-col w-full overflow-y-scroll'>

                <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                    <div className='w-full flex flex-col justify-center items-center gap-y-2'>

                      <p className='text-center text-lg font-semibold'>Details of Incoming Booking Request</p>

                      <img className='w-[350px] h-[350px] rounded-xl' src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />

                      <img className='w-[350px] h-[350px] rounded-xl' src={selectedPlateURL} />
                      
                      <p>Booked By: {selectedDriverFirstName}</p>
                      <p>Start Time: {selectedEventStart}</p>
                      <p>End Time: {selectedEventEnd}</p>
                      <p>Status: {(driverRequestedCancel && selectedEventStatus === "CancelSubmitted") ? "Driver Requested To Cancel" : ((selectedEventStatus === "Requested" ? "Booking Requested" : (selectedEventStatus === "Approved" ? "Approved" : (selectedEventStatus === "Cancelled" ? "Cancelled" : "Completed")))) }</p>
                      <p className='text-xl font-semibold'>Total: {selectedCurrency?.toUpperCase()}{selectedCurrencySymbol}{Number(selectedTotalCharge).toFixed(2)}</p>

                    </div>

                    <div className='flex flex-row ml-2 py-2'>
                        <input  
                            className='w-5 h-5'
                            type="checkbox" 
                            id='termsagree'
                            onChange={toggleTermsHost}
                            checked={termscheckedHost}
                        />
                        <label className='ml-2 text-sm font-medium md:text-base' htmlFor="termsagree">{`I agree to the `}
                            <button className='text-blue-900 underline' onClick={(e)=>handleTermsClick(e)}> 
                              Terms of Service</button></label>
                    </div>

                    <button   
                      disabled={( selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" 
                      || hostRequestedCancel || !termscheckedHost || waitingSubmit || waitingCancel )} 
                      
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${(selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" 
                      || hostRequestedCancel || !termscheckedHost) ? "bg-[#c1f2f5] cursor-not-allowed" : "cursor-pointer bg-[#c1f2f5] hover:bg-[#00D3E0] " } 
                        gap-x-2 flex flex-row justify-center items-center`}

                      onClick={(e)=>handleEventActionHost(e)}>

                      {waitingSubmit && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>}

                        {(selectedEventStatus === "Requested" && !driverRequestedCancel && !hostRequestedCancel) && <p>Booking Requested - Approve</p> }
                        {(selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) && <p>Driver Asked To Cancel - Refund and Approve Cancellation</p> }
                        {(selectedEventStatus === "CancelSubmitted" && hostRequestedCancel) && <p>Host Asked To Cancel</p> }
                        {(selectedEventStatus === "Cancelled") && <p>Booking Cancelled</p> }
                        {(selectedEventStatus === "Approved") && <p>Approved - Mark as Completed</p> }
                        {(selectedEventStatus === "Completed") && <p>Booking Completed</p> }

                    </button>

                    {selectedEventStatus === "Requested" && 
                    <button 

                    className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${( selectedEventStatus === "Cancelled" || !termscheckedHost || waitingSubmit || waitingCancel ) 
                      ? "bg-[#c1f2f5] cursor-not-allowed" : "cursor-pointer bg-[#c1f2f5] hover:bg-[#00D3E0] " } 
                        gap-x-2 flex flex-row justify-center items-center`}
                    
                      disabled={(selectedEventStatus === "Cancelled" || !termscheckedHost || waitingSubmit || waitingCancel )} 
                      onClick={(e)=>handleEventRejectHost(e)}>

                    {waitingCancel && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>}

                        Reject Booking Request
                    </button>}

                    {(selectedEventStatus === "Approved" && !driverRequestedCancel && !hostRequestedCancel) && 
                    <button 
                    className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] 
                    ${(!termscheckedHost || waitingSubmit || waitingCancel) ? "bg-[#c1f2f5] cursor-not-allowed" : "cursor-pointer bg-[#c1f2f5] hover:bg-[#00D3E0] " } 
                      gap-x-2 flex flex-row justify-center items-center`}
                    disabled={!termscheckedHost || waitingSubmit || waitingCancel}
                    onClick={(e)=>handleEventCancelHost(e)}>

                    {waitingCancel && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>
                      }

                      Cancel and Issue Refund
                    </button> }

                    {(selectedEventStatus !== "Requested" && selectedEventStatus !== "Cancelled" && selectedEventStatus !== "Completed" ) && 
                    <p className='text-xl font-semibold pt-3 text-center w-full'>
                      Communications</p>}

                    {(selectedEventStatus !== "Requested" && selectedEventStatus !== "Cancelled" 
                      && selectedEventStatus !== "Completed" ) && 
                    <button className='border border-gray-300 px-3 py-2 rounded-xl gap-x-2
                    bg-[#c1f2f5] hover:bg-[#00D3E0] flex flex-row justify-center items-center'
                    onClick={(e)=>handleMessageHost(e)}>
  
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="currentColor" 
                        className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>

                      Send Message to {selectedDriverFirstName}
                    </button>}

                    {(selectedEventStatus !== "Requested") && 
                    
                    <button 
                    disabled={flagged}
                    className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] ${flagged ? " bg-gray-400 " : " hover:bg-[#00D3E0] "} 
                        gap-x-2 flex flex-row justify-center items-center`}
                      onClick={(e)=>handleHelpOpen(e)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <p>{!flagged ? "Help! Contact SocketJuice" : "Already requested help!"}</p>
                    </button>}


                </div>
              </div>
            </Box>
        </Modal>

        <Modal
            open={openHelpModal}
            onClose={handleHelpClose}
            onClick={(event)=>{event.stopPropagation()}}
            onKeyDown={(event)=>{
              if (event.key === "Tab") {
                event.stopPropagation();
              }
            }}
            style={{zIndex: 10001}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...boxStyle, width: 350, height: 400 }}>

            <div className='flex flex-col items-center justify-center'>
              <p className='text-center pt-4 text-xl font-semibold pb-2 text-black'>What happened?</p>

              <div className="flex flex-col w-full">

              <div className='py-2'>
                <p className='font-semibold'>Help Message:</p>
                  <textarea
                    aria-label="helpmessage" 
                    type="text" 
                    id="helpmessage"
                    autoComplete="off"
                    placeholder="Message (100 character limit):"
                    className='inline-block text-sm text-gray-base focus:outline-[#8BEDF3]
                    w-full mr-3 h-40 py-3 px-3 border border-gray-primary rounded mb-2' 
                    onChange={ ( e ) => setHelpMessage(e.target.value)}
                    value={helpMessage}
                  />
                </div>
                  
                <div className='flex flex-row gap-x-8 py-4'>
                  
              <button 
                  className={`${ (flagged || waitingHelp || !validHelpMessage )
                      ? "bg-gray-100 text-gray-400 cursor-notallowed" : "bg-[#8BEDF3] text-black cursor-pointer"}  
                      hover:bg-[#FFE142] w-full rounded-xl py-3 font-bold border-solid border-2 flex justify-center 
                      items-center gap-x-3`}
                  disabled={ (flagged || waitingHelp || !validHelpMessage ) 
                      ? true : false}
                  onClick={(event)=>handleSendHelp(event)}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleSendHelp(event);
                    }
                  }}
                  >
                  {waitingHelp && 
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
                  
                  Send
              </button>
              <button 
                  className={`align-center px-4 py-4 text-black
                  border-2 rounded-xl border-black bg-white text-base font-semibold
                  hover:bg-orange-200 hover:text-black`}
                  onClick={handleHelpClose}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleHelpClose();
                    }
                  }}
                  >
                      Close
              </button>
              </div>

          </div>

        </div>

        </Box>
        
      </Modal>

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
    )
  }

  export default BookingsPage