import React, { useMemo, useState, useEffect } from 'react';

import MainHeader from '../../components/mainHeader/mainHeader';
import useAuth from '../../hooks/useAuth';
import Tab from "@material-ui/core/Tab";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";  
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import CameraId from '../CameraId';

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

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";


const BookingsPage = () => {

  const localizer = dayjsLocalizer(dayjs);
  const DnDCalendar = withDragAndDrop(Calendar);

  const { auth, setActiveTab, socket, setSocket, setNewMessages, 
    setNewRequests, setNewIndividualChat } = useAuth();

  const [value, setValue] = useState("0");
  const [waiting, setWaiting] = useState(false);
  const IMAGE_UPLOAD_URL = '/s3/singleimage';

  const [pickerDateDriver, setPickerDateDriver] = useState(new Date())
  const [pickerDateHost, setPickerDateHost] = useState(new Date())
  const [currentDateDriver, setCurrentDateDriver] = useState(new Date().toISOString().slice(0,10))
  const [currentDateHost, setCurrentDateHost] = useState(new Date().toISOString().slice(0,10))

  const [hostAppointments, setHostAppointments] = useState([])
  const [driverAppointments, setDriverAppointments] = useState([])
  const [newrequest, setNewrequest] = useState(false);

  const [hostEvents, setHostEvents] = useState([])
  const [driverEvents, setDriverEvents] = useState([])

  const [verifiedHost, setVerifiedHost] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [chargeRate, setChargeRate] = useState(3.0);
  const [currency, setCurrency] = useState("cad");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [connectorType, setConnectorType] = useState("AC-J1772-Type1");
  const [secondaryConnectorType, setSecondaryConnectorType] = useState("AC-J1772-Type1");
  const [chargingLevel, setChargingLevel] = useState("Level 1")

  const [closedOnMonday, setClosedOnMonday] = useState(false);
  const [closedOnTuesday, setClosedOnTuesday] = useState(false);
  const [closedOnWednesday, setClosedOnWednesday] = useState(false);
  const [closedOnThursday, setClosedOnThursday] = useState(false);
  const [closedOnFriday, setClosedOnFriday] = useState(false);
  const [closedOnSaturday, setClosedOnSaturday] = useState(false);
  const [closedOnSunday, setClosedOnSunday] = useState(false);
  const [closedOnHolidays, setClosedOnHolidays] = useState(false);

  const [hoursMondayStart, setHoursMondayStart] = useState('');
  const [validhoursMondayStart, setValidhoursMondayStart] = useState(false);
  const [hoursMondayStartFocus, setHoursMondayStartFocus] = useState(false);

  const [hoursMondayFinish, setHoursMondayFinish] = useState('');
  const [validhoursMondayFinish, setValidhoursMondayFinish] = useState(false);
  const [hoursMondayFinishFocus, setHoursMondayFinishFocus] = useState(false);

  const [hoursTuesdayStart, setHoursTuesdayStart] = useState('');
  const [validhoursTuesdayStart, setValidhoursTuesdayStart] = useState(false);
  const [hoursTuesdayStartFocus, setHoursTuesdayStartFocus] = useState(false);

  const [hoursTuesdayFinish, setHoursTuesdayFinish] = useState('');
  const [validhoursTuesdayFinish, setValidhoursTuesdayFinish] = useState(false);
  const [hoursTuesdayFinishFocus, setHoursTuesdayFinishFocus] = useState(false);

  const [hoursWednesdayStart, setHoursWednesdayStart] = useState('');
  const [validhoursWednesdayStart, setValidhoursWednesdayStart] = useState(false);
  const [hoursWednesdayStartFocus, setHoursWednesdayStartFocus] = useState(false);

  const [hoursWednesdayFinish, setHoursWednesdayFinish] = useState('');
  const [validhoursWednesdayFinish, setValidhoursWednesdayFinish] = useState(false);
  const [hoursWednesdayFinishFocus, setHoursWednesdayFinishFocus] = useState(false);

  const [hoursThursdayStart, setHoursThursdayStart] = useState('');
  const [validhoursThursdayStart, setValidhoursThursdayStart] = useState(false);
  const [hoursThursdayStartFocus, setHoursThursdayStartFocus] = useState(false);

  const [hoursThursdayFinish, setHoursThursdayFinish] = useState('');
  const [validhoursThursdayFinish, setValidhoursThursdayFinish] = useState(false);
  const [hoursThursdayFinishFocus, setHoursThursdayFinishFocus] = useState(false);

  const [hoursFridayStart, setHoursFridayStart] = useState('');
  const [validhoursFridayStart, setValidhoursFridayStart] = useState(false);
  const [hoursFridayStartFocus, setHoursFridayStartFocus] = useState(false);

  const [hoursFridayFinish, setHoursFridayFinish] = useState('');
  const [validhoursFridayFinish, setValidhoursFridayFinish] = useState(false);
  const [hoursFridayFinishFocus, setHoursFridayFinishFocus] = useState(false);

  const [hoursSaturdayStart, setHoursSaturdayStart] = useState('');
  const [validhoursSaturdayStart, setValidhoursSaturdayStart] = useState(false);
  const [hoursSaturdayStartFocus, setHoursSaturdayStartFocus] = useState(false);

  const [hoursSaturdayFinish, setHoursSaturdayFinish] = useState('');
  const [validhoursSaturdayFinish, setValidhoursSaturdayFinish] = useState(false);
  const [hoursSaturdayFinishFocus, setHoursSaturdayFinishFocus] = useState(false);

  const [hoursSundayStart, setHoursSundayStart] = useState('');
  const [validhoursSundayStart, setValidhoursSundayStart] = useState(false);
  const [hoursSundayStartFocus, setHoursSundayStartFocus] = useState(false);

  const [hoursSundayFinish, setHoursSundayFinish] = useState('');
  const [validhoursSundayFinish, setValidhoursSundayFinish] = useState(false);
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

  const [croppedImageURL, setCroppedImageURL] = useState([]);
  const [croppedImage, setCroppedImage] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [videoArray, setVideoArray] = useState([]);
  const [videoURLArray, setVideoURLArray] = useState([]);
  const [videoThumbnails, setVideoThumbnails] = useState([]);
  const [oldMediaTrack, setOldMediaTrack] = useState([]);

  const [openDetailsModalDriver, setOpenDetailsModalDriver] = useState(false);
  const [openDetailsModalHost, setOpenDetailsModalHost] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("")
  
  const [selectedHostUserId, setSelectedHostUserId] = useState("")
  const [selectedDriverUserId, setSelectedDriverUserId] = useState("")
  const [selectedAddress, setSelectedAddress] = useState("")
  const [selectedEventStatus, setSelectedEventStatus] = useState("")
  const [selectedEventStart, setSelectedEventStart] = useState("")
  const [selectedEventEnd, setSelectedEventEnd] = useState("")
  const [driverRequestedCancel, setDriverRequestedCancel] = useState(false)
  const [hostRequestedCancel, setHostRequestedCancel] = useState(false)
  
  const [selectedLat, setSelectedLat] = useState("")
  const [selectedLng, setSelectedLng] = useState("")
  const [selectProfilePic, setSelectProfilePic] = useState("")


  const handleMessage = async () => {

    if(!auth.userId){
        navigate('/map');
        return
    }

    setNewIndividualChat({userId: profileUserId});
    navigate(`/messages`);
  }

  const handleRegularHourChangeBegin = (event, day) => {

    if (day === 'Monday'){

        if(event.target.value < hoursMondayFinish){
            setHoursMondayStart(event.target.value)
        } else {
            setHoursMondayStart(hoursMondayFinish)
            setClosedOnMonday(true);
        }

    } else if( day === 'Tuesday'){

        if(event.target.value < hoursMondayFinish){
            setHoursTuesdayStart(event.target.value)
        } else {
            setHoursTuesdayStart(hoursTuesdayFinish)
            setClosedOnTuesday(true);
        }

    } else if (day === 'Wednesday'){

        if(event.target.value < hoursWednesdayFinish){
            setHoursWednesdayStart(event.target.value)
        } else {
            setHoursWednesdayStart(hoursWednesdayFinish)
            setClosedOnWednesday(true);
        }

    } else if (day === 'Thursday'){

        if(event.target.value < hoursThursdayFinish){
            setHoursThursdayStart(event.target.value)
        } else {
            setHoursThursdayStart(hoursThursdayFinish)
            setClosedOnThursday(true);
        }

    } else if (day === 'Friday'){

        if(event.target.value < hoursFridayFinish){
            setHoursFridayStart(event.target.value)
        } else {
            setHoursFridayStart(hoursFridayFinish)
            setClosedOnFriday(true);
        }

    } else if (day === 'Saturday'){

        if(event.target.value < hoursSaturdayFinish){
            setHoursSaturdayStart(event.target.value)
        } else {
            setHoursSaturdayStart(hoursSaturdayFinish)
            setClosedOnSaturday(true);
        }

    } else if (day === 'Sunday'){

        if(event.target.value < hoursSundayFinish){
            setHoursSundayStart(event.target.value)
        } else {
            setHoursSundayStart(hoursSundayFinish)
            setClosedOnSunday(true);
        }

    } else if (day === ' Holiday'){

        if(event.target.value < holidayHoursFinish){
            setHolidayHoursStart(event.target.value)
        } else {
            setHolidayHoursStart(holidayHoursFinish)
            setClosedOnHolidays(true);
        }      
    }
}

const handleRegularHourChangeEnd = (event, day) => {

    if (day === 'Monday'){

        if(event.target.value > hoursMondayStart){
            setHoursMondayFinish(event.target.value)
        } else {
            setHoursMondayFinish(hoursMondayStart)
            setClosedOnMonday(true);
        }

    } else if( day === 'Tuesday'){

        if(event.target.value > hoursMondayStart){
            setHoursTuesdayFinish(event.target.value)
        } else {
            setHoursTuesdayFinish(hoursMondayStart)
            setClosedOnTuesday(true);
        }

    } else if (day === 'Wednesday'){

        if(event.target.value > hoursWednesdayStart){
            setHoursWednesdayFinish(event.target.value)
        } else {
            setHoursWednesdayFinish(hoursWednesdayStart)
            setClosedOnWednesday(true);
        }

    } else if (day === 'Thursday'){

        if(event.target.value > hoursThursdayStart){
            setHoursThursdayFinish(event.target.value)
        } else {
            setHoursThursdayFinish(hoursThursdayStart)
            setClosedOnThursday(true);
        }

    } else if (day === 'Friday'){

        if(event.target.value > hoursFridayStart){
            setHoursFridayFinish(event.target.value)
        } else {
            setHoursFridayFinish(hoursFridayStart)
            setClosedOnFriday(true);
        }

    } else if (day === 'Saturday'){

        if(event.target.value > hoursSaturdayStart){
            setHoursSaturdayFinish(event.target.value)
        } else {
            setHoursSaturdayFinish(hoursSaturdayStart)
            setClosedOnSaturday(true);
        }

    } else if (day === 'Sunday'){

        if(event.target.value > hoursSundayStart){
            setHoursSundayFinish(event.target.value)
        } else {
            setHoursSundayFinish(hoursSundayStart)
        }

    } else if (day === ' Holiday'){

        if(event.target.value > holidayHoursStart){
            setHolidayHoursFinish(event.target.value)
        } else {
            setHolidayHoursFinish(holidayHoursStart)
        }
        
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
        
        const userdata = await getUserData()

        if(userdata){
          console.log(userdata)

          //Set verified and submitted
          //check submittedChargingForReview and verifiedHostCharging
          // setCurrency(userdata.currency)
          // setCurrencySymbol(userdata.currencySymbol)
        }
      }

      if(auth){

        getUser()

      } else {
        
        setActiveTab("bookings")
      }

    }, [auth])


    const handleEventRejectHost = async (e) => {

      console.log(e)

      const submitted = await addHostReject(e.userId, auth.userId, e.appointmentId, auth.userId, auth.accessToken)

      if(submitted){
        console.log("Cancel submitted")
        setNewrequest(!newrequest)
      }
    }

    const handleEventCancelHost = async (e) => {

      console.log(e)

      const submitted = await addHostCancelSubmit(e.userId, auth.userId, e.appointmentId, auth.userId, auth.accessToken)

      if(submitted){
        console.log("Cancel submitted")
        setNewrequest(!newrequest)
      }
    }


    const handleEventRejectDriver = async (e) => {

      console.log(e)

      const submitted = await addDriverReject(e.userId, auth.userId, e.appointmentId, auth.userId, auth.accessToken)

      if(submitted){
        console.log("Cancel submitted")
        setNewrequest(!newrequest)
      }
    }

    const handleEventCancelDriver = async (e) => {

      console.log(e)

      const submitted = await addDriverCancelSubmit(e.userId, auth.userId, e.appointmentId, auth.userId, auth.accessToken)

      if(submitted){
        console.log("Cancel submitted")
        setNewrequest(!newrequest)
      }
    }
    
    const handleEventActionHost = async (e) => {

      console.log(e)

      if(hostRequestedCancel){
        return
      }

      if(driverRequestedCancel){

        const approvedCancel = await addHostCancelApprove(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

        if(approvedCancel){
          console.log("Cancelled booking")
          setNewrequest(!newrequest)
        }

      } else if (selectedEventStatus === "Requested"){

        const bookingApproved = await addAppointmentApproval(e._userId, auth.userId, e.start, e.end, auth.accessToken)

        if(bookingApproved){
          console.log("Booking approved")
          setNewrequest(!newrequest)
        }

      } else if (selectedEventStatus === "Approved"){

        const bookingCompleted = await addAppointmentCompletion(e._userId, auth.userId, e.start, e.end, auth.accessToken)

        if(bookingCompleted){
          console.log("Booking completed")
          setNewrequest(!newrequest)
        }
      }
    }

    const handleEventActionDriver = async (e) => {

      console.log(e)

      if(driverRequestedCancel){
        return
      }

      if(hostRequestedCancel){

        const approvedCancel = await addDriverCancelApprove(auth.userId, e.hostId, selectedEventId, auth.userId, auth.accessToken)

        if(approvedCancel){
          console.log("Booking completed")
          setNewrequest(!newrequest)
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
      console.log(e)
      
      setCurrentDateHost(new Date().toISOString().slice(0,10))
      setPickerDateHost(dayjs(new Date(e)))
    }

    const handleNavigateDriver = (e) => {
      console.log(e)
      
      setCurrentDateDriver(new Date().toISOString().slice(0,10))
      setPickerDateDriver(dayjs(new Date(e)))
    }


    const handleCloseDetailsModalDriver = (e) => {

      e.preventDefault()
  
      setSelectedEventId("")
      setOpenDetailsModalDriver(false)
    }


    const handleCloseDetailsModalHost = (e) => {

      e.preventDefault()
  
      setSelectedEventId("")
      setOpenDetailsModalHost(false)
    }

    const handleHostPhotosUpload = async (event) => {

      event.preventDefault();
      
      if(waiting || (croppedImage?.length !== croppedImageURL?.length) || (croppedImage?.length === 0) ){
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
                                        userId,
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
                                    userId,
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
                break
            }

        } else {
            toast.error("This post does not have an attached photo", {
                position: "bottom-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
            break
        }

        if(finalImageObjArray?.length === mediaLength){

          const previewMediaObjectId = finalImageObjArray[coverIndex]
          const previewMediaType = mediaTypes[coverIndex]
    
            try {

                const uploadedHostPhotos = await addHostProfile(
                  auth.userId, previewMediaObjectId, finalImageObjArray, finalVideoObjArray,
                  mediaTypes, previewMediaType, coverIndex, 
                  chargeRate, currency, connectorType, secondaryConnectorType, chargingLevel,
                  hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
                  hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
                  holidayHoursStart, holidayHoursFinish, 
                  closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,

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
                }

            } catch(err){

                console.log(err)
            }
        }
      }
    }

    const handleSelectEventHost = (e) => {

      console.log(e)
      console.log("Details here host")
      console.log(auth.userId)
      
      setSelectedDriverUserId(e.requesterId)
      setSelectedHostUserId(e.hostId)
      setSelectedEventId(e.appointmentId)
      setSelectedAddress(e.address)
      setSelectedEventStart(e.start.toLocaleTimeString())
      setSelectedEventEnd(e.end.toLocaleTimeString())
      setSelectedEventStatus(e.status)
      
      setDriverRequestedCancel(e.driverRequestedCancel)
      setHostRequestedCancel(e.hostRequestedCancel)
  
      setSelectedLat(e.location[0])
      setSelectedLng(e.location[1])
      setSelectProfilePic(e.profilePicURL)
      
      setOpenDetailsModalHost(true)
    }


    const handleSelectEventDriver = (e) => {

      console.log(e)
      console.log("Details here driver")
      console.log(auth.userId)
      
      setSelectedDriverUserId(e.requesterId)
      setSelectedHostUserId(e.hostId)
      setSelectedEventId(e.appointmentId)
      setSelectedAddress(e.address)
      setSelectedEventStart(e.start.toLocaleTimeString())
      setSelectedEventEnd(e.end.toLocaleTimeString())
      setSelectedEventStatus(e.status)
      
      setDriverRequestedCancel(e.driverRequestedCancel)
      setHostRequestedCancel(e.hostRequestedCancel)
  
      setSelectedLat(e.location[0])
      setSelectedLng(e.location[1])
      setSelectProfilePic(e.profilePicURL)
      
      setOpenDetailsModalDriver(true)
    }


    useEffect( ()=> {

      if(auth){
        console.log("User is logged in")
      }
  
      async function hostAppointments() {
  
        const hostresults = await getHostAppointments(auth.userId, currentDateHost, auth.accessToken, auth.userId)
  
        if(hostresults){
  
          console.log(hostresults)
  
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
  
            if(hostprofiledata[hostresults?.hostAppointments[i]._hostUserId]){
              hostresults.hostAppointments[i].address = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.address
              hostresults.hostAppointments[i].locationlat = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[1]
              hostresults.hostAppointments[i].locationlng = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[0]
            }

            if(hostuserdata[hostresults.hostAppointments[i]._hostUserId]){
              hostresults.hostAppointments[i].profilePicURL = hostuserdata[hostresults.hostAppointments[i]._hostUserId].profilePicURL
            }
            
            var instance = {
              id: `booking_${hostresults.hostAppointments[i]._hostUserId}`,
              appointmentId: hostresults.hostAppointments[i]._id, 
              title: "Booked Time",
              address: hostresults.hostAppointments[i].address,
              location: [hostresults.hostAppointments[i].locationlat, hostresults.hostAppointments[i].locationlng],
              status: hostresults.hostAppointments[i].status,
              start: new Date(hostresults.hostAppointments[i].start),
              end: new Date(hostresults.hostAppointments[i].end),
              hostId: hostresults.hostAppointments[i]._hostUserId,
              requesterId: hostresults.hostAppointments[i]._requestUserId,
              driverRequestedCancel: hostresults.hostAppointments[i].cancelRequestDriverSubmit,
              hostRequestedCancel: hostresults.hostAppointments[i].cancelRequestHostSubmit,
              profilePicURL: hostresults.hostAppointments[i].profilePicURL,
              isDraggable: true
            }
  
            newevents.push(instance)
          }
  
          newevents.sort(function(a,b){
            return new Date(b.date) - new Date(a.date);
          })
          setHostAppointments([...hostresults.hostAppointments])
          setHostEvents(newevents)
        }
      }
  
      if(currentDateHost && auth.userId && value === "0"){
        hostAppointments()
      }
  
    }, [currentDateHost, auth, value, newrequest])


    const handleLinkURLDirections = (e) => {

      console.log(e)
    }

    const {scrollToTime} = useMemo(
      () => ({
        scrollToTime: new Date(),
      }),
      []
    )

    useEffect( () => {

      if(auth){
        console.log("User is logged in")
      }
  
      async function driverAppointments() {
  
        const driverresults = await getDriverAppointments(auth.userId, currentDateDriver, auth.accessToken, auth.userId)
  
        if(driverresults){
  
          console.log("driver results", driverresults)
  
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
            }

            if(hostuserdata[driverresults.userAppointments[i]._hostUserId]){
              driverresults.userAppointments[i].profilePicURL = hostuserdata[driverresults.userAppointments[i]._hostUserId].profilePicURL
            }
            
            var instance = {
              id: `booking_${driverresults.userAppointments[i]._hostUserId}`,
              appointmentId: driverresults.userAppointments[i]._id, 
              title: "Booked Time",
              address: driverresults.userAppointments[i].address,
              location: [driverresults.userAppointments[i].locationlat, driverresults.userAppointments[i].locationlng],
              status: driverresults.userAppointments[i].status,
              start: new Date(driverresults.userAppointments[i].start),
              end: new Date(driverresults.userAppointments[i].end),
              hostId: driverresults.userAppointments[i]._hostUserId,
              requesterId: driverresults.userAppointments[i]._requestUserId,
              driverRequestedCancel: driverresults.userAppointments[i].cancelRequestDriverSubmit,
              hostRequestedCancel: driverresults.userAppointments[i].cancelRequestHostSubmit,
              profilePicURL: driverresults.userAppointments[i].profilePicURL,
              isDraggable: true
            }

            newevents.push(instance)
          }
  
          console.log("host events", newevents)
  
          setDriverAppointments(driverresults.userAppointments)
          setDriverEvents([...newevents])
        }
      }
  
      if(currentDateDriver && auth.userId && value === "1"){
        driverAppointments()
      }
  
    }, [currentDateDriver, auth, value, newrequest])


    useEffect( ()=> {



    }, [pickerDateHost])

    
  return (

    <>

    <div style={{height:'100svh', width:'100svw'}} 
                className="bg-white bg-center max-w-full
                    flex flex-col fixed w-full">

    <MainHeader 
        loggedUserId={auth.userId} loggedUsername={auth.username} 
        profilePicURL={auth.profilePicURL} roles={auth.roles}
    />

      {(verifiedHost && submitted ) && 
      
      <div className='flex relative flex-col items-center pt-[6vh] sm:pt-[7vh] 
              md:pt-[8vh] h-[100svh] w-[100svw] overflow-y-scroll'>

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

          <div className='pt-1 pb-4 flex flex-col gap-y-3 w-full justify-center items-center'>

          <p>Received Bookings From Other EV Drivers</p>

            <div className='flex flex-col w-[250px] h-[400px]'>

              {hostEvents.map((event) => (
                
                <div key={event.id} className='flex flex-row w-full border border-[#00D3E0]'>

                  <div className='flex flex-col'>
                    <img className='w-[50px] rounded-full' src={event.profilePicURL} />
                  </div>

                  <div className='flex flex-col'>
                    <p>Address: {event.address}</p>
                    <p>Start: {event.start.toLocaleTimeString()}</p>
                    <p>End: {event.end.toLocaleTimeString()}</p>
                    <p>Status: {event.status}</p>
                  </div>

                </div>

              ))}

            </div>

              <div className='flex flex-col w-[250px]'>
                <LocalizationProvider dateAdapter={AdapterDayjs}>

                    <DatePicker
                      value={dayjs(pickerDateHost)}
                      onChange={(date) => setPickerDateHost(dayjs(new Date(date)))}
                      />

                </LocalizationProvider>
              </div>

            <div className='flex flex-col w-full max-w-[400px] overflow-y-scroll justify-center'>

                <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                    <p className='text-lg text-center pt-4 pb-2'>Location Schedule</p>

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
                            backgroundColor: "#00D3E0",
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

          <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '0px',
              display:'flex', flexDirection: 'column', width: '100%'}} value="1">        

              <div className='pt-1 pb-4 flex flex-col gap-y-3 w-full justify-center items-center'>

              <p>Your Outgoing Bookings</p>

                  <div className='flex flex-col w-[250px]'>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>

                        <DatePicker
                          value={dayjs(pickerDateDriver)}
                          onChange={(date) => setPickerDateDriver(dayjs(new Date(date)))}
                          />

                    </LocalizationProvider>
                  </div>

                <div className='flex flex-col w-full max-w-[400px] overflow-y-scroll justify-center'>

                    <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                        <p className='text-lg text-center pt-4 pb-2'>Location Schedule</p>

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
        </div>}

        {(!verifiedHost && submitted) && 
        
        <div>
        
          <p>We are currently reviewing your charging location, please hold</p>
        
        </div> }


        {(!verifiedHost && !submitted) && 
        
        <div className="flex w-full flex-col px-4">
        
          <p>Please submit the information below for your charging equipment</p>
          <p>After approval, drivers will be able to request bookings and you will be able to earn income</p>

          <p>Upload a photo of your charging equipment and a photo of the plug connection. </p>
          <p>An example is the following: </p>

          <div className='flex flex-row'>

              <img className='w-[375px] py-2' src={evcharger} />
              <img className='w-[375px] py-2' src={evplug} />

          </div>

          <div className="w-full flex justify-center">
            
            <CameraId croppedImage={croppedImage} setCroppedImage={setCroppedImage} croppedImageURL={croppedImageURL} setCroppedImageURL={setCroppedImageURL} 
              coverIndex={coverIndex} setCoverIndex={setCoverIndex} mediaTypes={mediaTypes} setMediaTypes={setMediaTypes} videoArray={videoArray} setVideoArray={setVideoArray} 
              videoURLArray={videoURLArray} setVideoURLArray={setVideoURLArray}  videoThumbnails={videoThumbnails} setVideoThumbnails={setVideoThumbnails} 
              oldMediaTrack={oldMediaTrack} setOldMediaTrack={setOldMediaTrack} limit={5} />
            
          </div>

            <div className='w-full flex flex-col items-end pt-4 pr-12'>

              <div className='w-full flex flex-col items-end gap-y-4'>

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

                  <div className="flex flex-col justify-center items-center gap-y-2">

                      <div className='flex flex-col'>
                      <label className="flex justify-center items-center pr-2 font-semibold">Connector Type:</label>

                      <img className='w-[375px] py-2' src={evconnectors} />

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

                      <div className='flex flex-col'>
                      <label className="flex justify-center items-center pr-2 font-semibold">If you have any connector adaptors:</label>
                      <select onChange={(event)=>setSecondaryConnectorType(event.target.value)}
                      value={secondaryConnectorType}
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#995372]' 
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

          </div>           
        
        </div> }

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

                    <p className='text-center text-lg font-semibold'>Details of Booking Request</p>

                    <img className='w-[350px] h-[350px]' src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />
                    
                    <p>Start Time: {selectedEventStart}</p>
                    <p>End Time: {selectedEventEnd}</p>
                    <p>Status: {(driverRequestedCancel && selectedEventStatus !== "Cancelled") ? "You Requested To Cancel" : ( (hostRequestedCancel && selectedEventStatus !== "Cancelled" ) ? "You Asked to Cancel" : (selectedEventStatus === "Requested" ? "Booking Requested" : (selectedEventStatus === "Approved" ? "Approved" : (selectedEventStatus === "Cancelled" ? "Cancelled" : "Completed")))) }</p>

                    <button disabled={selectedEventStatus === "Approved" || selectedEventStatus === "Cancelled" || driverRequestedCancel} 
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${ (selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" || driverRequestedCancel) ? "bg-[#c1f2f5] cursor-not-allowed" : "bg-[#c1f2f5] hover:bg-[#00D3E0] " } `}
                      onClick={(e)=>handleEventActionDriver(e)}>
                        {(selectedEventStatus === "Requested" && !driverRequestedCancel && !hostRequestedCancel) && <p>Approve Booking Request</p> }
                        {(selectedEventStatus === "Approved" && !driverRequestedCancel) && <p>Approved - Ask To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) && <p>You Asked To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && hostRequestedCancel) && <p>Host Asked To Cancel</p> }
                        {(selectedEventStatus === "Cancelled") && <p>Cancelled</p> }
                    </button>

                    {selectedEventStatus === "Requested" && 
                      <button 
                      className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]`}
                      onClick={(e)=>handleEventRejectDriver(e)}>
                        Cancel Booking Request
                      </button>}

                    {(selectedAddress && selectedHostUserId !== auth.userId) && <button className='border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]'
                      onClick={(e)=>handleLinkURLDirections(e, selectedAddress)}>
                        Get Directions (Opens Map)
                    </button>}

                    {(selectedEventStatus === "Requested" || selectedEventStatus === "Completed") 
                    && <button onClick={(e)=>handleMessage(e)}>
                      Send Message
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

                    <p className='text-center text-lg font-semibold'>Details of Booking Request</p>

                    <img className='w-[350px] h-[350px]' src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />
                    
                    <p>Start Time: {selectedEventStart}</p>
                    <p>End Time: {selectedEventEnd}</p>
                    <p>Status: {(driverRequestedCancel && selectedEventStatus !== "Cancelled") ? "Driver Requested To Cancel" : (( hostRequestedCancel && selectedEventStatus !== "Cancelled" ) ? "You Asked to Cancel" : (selectedEventStatus === "Requested" ? "Booking Requested" : (selectedEventStatus === "Approved" ? "Approved" : (selectedEventStatus === "Cancelled" ? "Cancelled" : "Completed")))) }</p>

                    <button   
                      disabled={(selectedEventStatus === "Approved" || selectedEventStatus === "Cancelled" || hostRequestedCancel )} 
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${(selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" 
                      || hostRequestedCancel) ? "bg-[#c1f2f5] cursor-not-allowed" : "bg-[#c1f2f5] hover:bg-[#00D3E0] " } `}
                      onClick={(e)=>handleEventActionHost(e)}>
                        {(selectedEventStatus === "Requested" && !driverRequestedCancel && !hostRequestedCancel) && <p>Booking Requested - Approve</p> }
                        {(selectedEventStatus === "Approved" && !driverRequestedCancel && !hostRequestedCancel) && <p>Approved - Ask To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) && <p>You Asked To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && hostRequestedCancel) && <p>Host Asked To Cancel</p> }
                        {(selectedEventStatus === "Cancelled") && <p>Cancelled</p> }
                    </button>

                    {selectedEventStatus === "Requested" && 
                    <button 
                      className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]`}
                      onClick={(e)=>handleEventRejectHost(e)}>
                        Cancel Booking Request
                    </button>}

                    {(selectedAddress && selectedHostUserId !== auth.userId) && <button className='border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]'
                      onClick={(e)=>handleLinkURLDirections(e, selectedAddress)}>
                        Get Directions (Opens Map)
                    </button>}

                </div>
              </div>
            </Box>
        </Modal>
        </>
    )
  }

  export default BookingsPage