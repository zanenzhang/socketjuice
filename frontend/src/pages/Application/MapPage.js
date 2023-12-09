import { React, useRef, useState, useEffect, useMemo, createRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsRenderer, 
} from '@react-google-maps/api';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./slider.css";

import MainHeader from '../../components/mainHeader/mainHeader';
import debounce from 'lodash.debounce';
import useAuth from '../../hooks/useAuth';
import getHostProfilesCoord from '../../helpers/HostData/getHostProfilesCoord';
import getGoogleCoordinates from '../../helpers/Google/getGoogleCoordinates';  
import getGoogleMatrix from '../../helpers/Google/getGoogleMatrix';

import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import addAppointmentRequest from '../../helpers/Appointments/addAppointmentRequest';
import addDriverCancelSubmit from '../../helpers/Appointments/addDriverCancelSubmit';
import addDriverCancelApprove from '../../helpers/Appointments/addDriverCancelApprove';
import getHostAppointments from '../../helpers/Appointments/getHostAppointments';
import addDriverReject from '../../helpers/Appointments/addDriverReject';
import addPaypalOrder from '../../helpers/Paypal/addPaypalOrder';
import capturePaypalOrder from '../../helpers/Paypal/capturePaypalOrder';
import getUserData from '../../helpers/Userdata/getUserData';

const libraries = ['places'];


const MapPage = () => {

  /*global google*/

  const localizer = dayjsLocalizer(dayjs);
  const DnDCalendar = withDragAndDrop(Calendar);

  const { auth, setActiveTab, setAuth, setNewIndividualChat } = useAuth();
  
  const navigate = useNavigate();

  const [center, setCenter] = useState({ lat: 48.8584, lng: 2.2945 })

  const [map, setMap] = useState(null);
  const [date, setDate] = useState(dayjs(new Date()));
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [mediaURLs, setMediaURLs] = useState([]);
  const [hostComments, setHostComments] = useState([]);
  const [insufficientFunds, setInsufficientFunds] = useState(false)

  const sliderRefPre = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(1);

  const [j1772ACChecked, setj1772ACChecked] = useState(false);
  const [ccs1DCChecked, setccs1DCChecked] = useState(false);
  const [mennekesACChecked, setmennekesACChecked] = useState(false);
  const [ccs2DCChecked, setccs2DCChecked] = useState(false);
  const [chademoDCChecked, setchademoDCChecked] = useState(false);
  const [gbtACChecked, setgbtACChecked] = useState(false);
  const [gbtDCChecked, setgbtDCChecked] = useState(false);
  const [teslaChecked, setTeslaChecked] = useState(false);
  
  const [waitingCurrent, setWaitingCurrent] = useState(false);
  const [waitingSubmit, setWaitingSubmit] = useState(false);
  
  const [currentMarker, setCurrentMarker] = useState("")
  const [hostUserId, setHostUserId] = useState("")
  const [currentIcon, setCurrentIcon] = useState("")
  const [scrollRefs, setScrollRefs] = useState([])

  const [selectedHostProfile, setSelectedHostProfile] = useState("")
  const [selectedHostUserId, setSelectedHostUserId] = useState("")
  const [selectedEventId, setSelectedEventId] = useState("")
  const [selectedAddress, setSelectedAddress] = useState("")
  const [selectedChargeRate, setSelectedChargeRate] = useState("")
  
  const [selectedCurrency, setSelectedCurrency] = useState("")
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState("")
  const [selectedDistance, setSelectedDistance] = useState("")
  const [selectedDuration, setSelectedDuration] = useState("")

  const [totalCharge, setTotalCharge] = useState(0)
  
  const [selectedEventStatus, setSelectedEventStatus] = useState("")
  const [selectedEventStart, setSelectedEventStart] = useState("")
  const [selectedEventEnd, setSelectedEventEnd] = useState("")
  const [selectedLat, setSelectedLat] = useState("")
  const [selectedLng, setSelectedLng] = useState("")
  const [selectedConnection, setSelectedConnection] = useState("")
  const [secondaryConnection, setSecondaryConnection] = useState("")

  const [driverRequestedCancel, setDriverRequestedCancel] = useState(false)
  const [hostRequestedCancel, setHostRequestedCancel] = useState(false)

  const mapRef = useRef(null);

  const [userLat, setUserLat]= useState();
  const [userLng, setUserLng]= useState();
  const [preHostLocations, setPreHostLocations] = useState([])
  const [hostLocations, setHostLocations] = useState([])
  const [userAddress, setUserAddress] = useState('');

  const [openReserveModal, setOpenReserveModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openPaymentsModal, setOpenPaymentsModal] = useState(false);

  const [termschecked, setTermschecked] = useState(true);

  const [iconLarge, setIconLarge] = useState({})
  const [iconRegular, setIconRegular] = useState({})

  const handleTermsClick = (event) => {

    event.preventDefault()

    window.open("/terms", "_blank");
  }

  const [initialOptions, setInitialOptions] = useState({
    "client-id": (auth?.currency === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
    "currency": auth?.currency?.toUpperCase()
  });

  const boxStyle = {
    position: 'absolute',
    top: '48%',
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

  const [paymentMessage, setPaymentMessage] = useState(""); 

  const [changed, setChanged] = useState(0)
  const [paymentCurrency, setPaymentCurrency] = useState("")
  const [paymentCurrencySymbol, setPaymentCurrencySymbol] = useState("$")
  const [userCurrencies, setUserCurrencies] = useState([])
  const [accountBalance, setAccountBalance] = useState(0)
  const [escrowBalance, setEscrowBalance] = useState(0)
  const [paymentDisplay, setPaymentDisplay] = useState([20, 40, 50])

  const [selectedAmount, setSelectedAmount] = useState(20);
  const [selectedServiceFee, setSelectedServiceFee] = useState(1.50);
  const [selectedTotal, setSelectedTotal] = useState(21.50);
  const [selectedOption, setSelectedOption] = useState("A");

  const [waitingPayment, setWaitingPayment] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  

  const handleSelectAmount = (e, value) => {

    e.preventDefault()

    if(value === "A"){
        
        setSelectedOption("A")
        setSelectedAmount(20)
        setSelectedServiceFee(1.50)
        setSelectedTotal(21.50)

    } else if(value === "B"){
        
        setSelectedOption("B")
        setSelectedAmount(40)
        setSelectedServiceFee(2.00)
        setSelectedTotal(42.00)

    } else if(value === "C"){
        
        setSelectedOption("C")
        setSelectedAmount(50)
        setSelectedServiceFee(2.50)
        setSelectedTotal(52.50)
    }
    
  }

  const [windowSize, setWindowSize] = useState({
      x: window.innerWidth,
      y: window.innerHeight
  });

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

const [bookingStart, setBookingStart] = useState(dayjs(new Date()))
const [bookingEnd, setBookingEnd] = useState(dayjs(new Date()))
const [currentDuration, setCurrentDuration] = useState(0)
const [bookingLengthValue, setBookingLengthValue] = useState(30)
const [bookingLengthText, setBookingLengthText] = useState("30 Min")

const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0,10))
const [newrequest, setNewrequest] = useState(0);

const [events, setEvents] = useState([])
const [hostEvents, setHostEvents] = useState([])
const [availableEvents, setAvailableEvents] = useState([])
const [proposedEvents, setProposedEvents] = useState([])

const {isLoaded} = useJsApiLoader({
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  language: window.navigator.userLanguage || window.navigator.language,
  //Can add language here, language: "en"
  //Can add region here, region: "en"
  libraries
})

useEffect( ()=> {

  var typesarray = []

  if(j1772ACChecked){
    typesarray.push("AC-J1772-Type1")
  }
  if(ccs1DCChecked){
    typesarray.push("DC-CCS1")
  }
  if(mennekesACChecked){
    typesarray.push("AC-Mennekes-Type2")
  }
  if(ccs2DCChecked){
    typesarray.push("DC-CCS2")
  } 
  if(chademoDCChecked){
    typesarray.push("DC-CHAdeMO")
  }
  if(gbtACChecked){
    typesarray.push("AC-GB/T")
  }
  if(gbtDCChecked){
    typesarray.push("DC-GB/T")
  }
  if(teslaChecked){
    typesarray.push("Tesla")
  }

  if(preHostLocations?.length > 0){
    
      const filtered = preHostLocations.filter(e => typesarray.includes(e.connectionType) || typesarray.includes(e.secondaryConnectionType) )
      setHostLocations(filtered)

  } else {
    setHostLocations([])
  }

}, [preHostLocations, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked,
    chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked ])


useEffect( ()=> {

  if(currentDuration){

    var hours = Math.floor(currentDuration / 3600)
    var min = (Math.floor(currentDuration % 3600) / 60) + 3

    const today = new Date()
    const timePlusDuration = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours()+hours, today.getMinutes()+min);
    const endOfThirty = new Date(timePlusDuration.getFullYear(), timePlusDuration.getMonth(), timePlusDuration.getDate(), timePlusDuration.getHours(), timePlusDuration.getMinutes()+30);

    setBookingStart(dayjs(timePlusDuration))
    setBookingEnd(dayjs(endOfThirty))
  
  } else {

    const today = new Date()
    const timePlusDuration = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes());
    const endOfThirty = new Date(timePlusDuration.getFullYear(), timePlusDuration.getMonth(), timePlusDuration.getDate(), timePlusDuration.getHours(), timePlusDuration.getMinutes()+30);

    setBookingStart(dayjs(timePlusDuration))
    setBookingEnd(dayjs(endOfThirty))
  }

}, [currentDuration, newrequest])


useEffect( () => {

  if(bookingStart && bookingEnd && auth.userId){

    if(bookingEnd < bookingStart){

      setBookingEnd(bookingStart)
      setBookingLengthValue(0)
      setBookingLengthText("No Booking")
    
    } else {

      if(selectedChargeRate){
        var charge = ((bookingEnd - bookingStart) / 1000 / 1800) * selectedChargeRate
        charge = (Math.round(charge * 100))/100
        setTotalCharge(charge)

        if (auth.credits?.length > 0 && selectedCurrency){

          var checkedFunds = false
          for(let i=0; i< auth?.credits?.length; i++){
            if(auth.credits[i].currency.toLowerCase() === selectedCurrency 
            && auth.credits[i].amount >= charge){
              setInsufficientFunds(false)
              checkedFunds = true
              break
            }
          }

          if(!checkedFunds){
            setInsufficientFunds(true)  
          }
    
        } else {
    
          setInsufficientFunds(true)
        }
      }

      var timeMin = (bookingEnd - bookingStart)/60000
      setBookingLengthValue(timeMin)
      setBookingLengthText(`${Math.round(timeMin)} Min`)

      var updatedCurrent = {
        id: `proposed_${auth.userId}`,
        title: "Requested Booking Time",
        start: new Date(bookingStart["$d"]),
        end: new Date(bookingEnd["$d"]),
        isDraggable: true
      }

      var filteredevents = events.filter(e => e.id !== `proposed_${auth.userId}`)
      filteredevents = [...filteredevents, updatedCurrent]

      setProposedEvents([updatedCurrent])
      setEvents([...filteredevents])
    }
  }

}, [bookingStart, bookingEnd, auth, changed])



const handleSelectSlot = (e) => {

  var today = new Date()
  var newproposedstart = new Date(e.start)

  if(newproposedstart < today){
  
    alert("Proposed start time has already passed")
  
  } else {

    setBookingStart(dayjs(new Date(e.start)))
    setBookingEnd(dayjs(new Date(e.end)))

    var updatedCurrent = {
      id: `proposed_${auth.userId}`,
      title: "Proposed Time",
      start: new Date(e.start),
      end: new Date(e.end),
      isDraggable: true
    }

    var filteredevents = events.filter(e => e.id !== `proposed_${auth.userId}`)
    filteredevents = [...filteredevents, updatedCurrent]

    setProposedEvents([updatedCurrent])
    setEvents([...filteredevents]) 
  }
}

const handleSelectEvent = (e) => {

  if(e?.title !== "Available" && e?.requesterId === auth?.userId){
  
    setOpenDetailsModal(true)

    setSelectedHostUserId(e.hostId)
    setSelectedEventId(e.appointmentId)
    setSelectedAddress(e.address)
    setSelectedEventStart(e.start.toLocaleTimeString())
    setSelectedEventEnd(e.end.toLocaleTimeString())
    setSelectedEventStatus(e.status)

    setSelectedLat(e.location[0])
    setSelectedLng(e.location[1])

    setInitialOptions({
      "client-id": (e.currency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
      "currency": e.currency.toUpperCase()
    })

    setDriverRequestedCancel(e.driverRequestedCancel)
    setHostRequestedCancel(e.hostRequestedCancel)

    setSelectedChargeRate(e.chargeRatePerHalfHourFee)
    setSelectedCurrency(e.currency)

    if(auth.credits?.length > 0){
      for(let i=0; i< auth.credits?.length; i++){
        if(auth.credits[i].currency === e.currency?.toLowerCase()){
          setPaymentCurrency(e.currency.toLowerCase())
          setPaymentCurrencySymbol(e.currencySymbol)

          if(e.currency.toLowerCase() === "usd"){
            
            setPaymentDisplay([20, 40, 50])

          } else if(e.currency.toLowerCase() === "cad"){

            setPaymentDisplay([20, 40, 50])

          } else if(e.currency.toLowerCase() === "eur"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(e.currency.toLowerCase() === "gbp"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(e.currency.toLowerCase() === "inr"){
              
            setPaymentDisplay([200, 400, 500])

          } else if(e.currency.toLowerCase() === "jpy"){
              
            setPaymentDisplay([3000, 5000, 6000])

          } else if(e.currency.toLowerCase() === "cny"){
              
            setPaymentDisplay([100, 200, 300])

          } else if(e.currency.toLowerCase() === "aud"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(e.currency.toLowerCase() === "nzd"){
              
            setPaymentDisplay([20, 40, 50])

          } else {
              
            setPaymentDisplay([20, 40, 50])
          }

          break
        }
      }
    }
    setSelectedCurrencySymbol(e.currencySymbol)

    setSelectedDistance(e.distanceText)
    setSelectedDuration(e.durationText)
  
  } else {
  
    return
  }

}

const handleEventResize = (e) => {
  
  if(e.event.id === `proposed_${auth.userId}`){
  
    var today = new Date()
    var newproposedstart = new Date(e.start)

    if(newproposedstart < today){
    
      alert("Proposed start time has already passed")
    
    } else {
      setBookingStart(dayjs(new Date(e.start)))
      setBookingEnd(dayjs(new Date(e.end)))
    }
  
  } else {
  
    return
  }
}

const handleNavigate = (e) => {
  
  setCurrentDate(new Date(e).toISOString().slice(0,10))
  setDate(dayjs(new Date(e)))
}

const toggleTerms = () => {
  setTermschecked(prev => !prev);
}

const handleEventMove = (e) => {
  
  if(e.event.id === `proposed_${auth.userId}`){
  
    var today = new Date()
    var newproposedstart = new Date(e.start)

    if(newproposedstart < today){
    
      alert("Proposed start time has already passed")
    
    } else {
      setBookingStart(dayjs(new Date(e.start)))
      setBookingEnd(dayjs(new Date(e.end)))
    }
  
  } else {
  
    return
  }
}

const {scrollToTime} = useMemo(
  () => ({
    scrollToTime: new Date(),
  }),
  []
)

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef()
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destinationRef = useRef()

  useEffect( () => {

      setActiveTab("map")

  }, [])

  useEffect( () => {

    if(isLoaded && google){

      const svg = {
        path: "M45.699 24.145l-7.89-13.293c-.314-.584-1.072-.852-1.721-.852h-7.088v-6c0-1.1-.9-2-2-2h-5c-1.1 0-2 .9-2 2v6h-5.96c-.65 0-1.44.268-1.754.852l-7.921 13.398c-1.301 0-2.365.987-2.365 2.322v12.139c0 1.335 1.064 2.289 2.365 2.289h2.635v3.78c0 2.004 1.328 3.22 3.279 3.22h1.183c1.951 0 3.538-1.216 3.538-3.22v-3.78h20v3.78c0 2.004 1.714 3.22 3.665 3.22h1.184c1.951 0 3.151-1.216 3.151-3.22v-3.78h2.763c1.3 0 2.237-.954 2.237-2.289v-12.139c0-1.335-1-2.427-2.301-2.427zm-37.194 9.71c-1.633 0-2.958-1.358-2.958-3.034 0-1.677 1.324-3.035 2.958-3.035s2.957 1.358 2.957 3.035c0 1.676-1.323 3.034-2.957 3.034zm1.774-9.855l5.384-9.377c.292-.598 1.063-.623 1.713-.623h15.376c.65 0 1.421.025 1.712.623l5.385 9.377h-29.57zm31.343 9.855c-1.632 0-2.957-1.358-2.957-3.034 0-1.677 1.325-3.035 2.957-3.035 1.633 0 2.958 1.358 2.958 3.035 0 1.676-1.325 3.034-2.958 3.034z",
        fillColor: "cyan",
        fillOpacity: 1,
        strokeWeight: 1,
        rotation: 0,
        scale: 0.6,
        anchor: new google.maps.Point(30,30),
      }

      setCurrentIcon(svg) 
    }

    if(auth){

      if(auth?.j1772ACChecked){
        setj1772ACChecked(true)
      }
      if(auth?.ccs1DCChecked){
        setccs1DCChecked(true)
      }
      if(auth?.mennekesACChecked){
        setmennekesACChecked(true)
      }
      if(auth?.ccs2DCChecked){
        setccs2DCChecked(true)
      }
      if(auth?.chademoDCChecked){
        setchademoDCChecked(true)
      }
      if(auth?.gbtACChecked){
        setgbtACChecked(true)
      }
      if(auth?.gbtDCChecked){
        setgbtDCChecked(true)
      }
      if(auth?.teslaChecked){
        setTeslaChecked(true)
      }
    }

  }, [isLoaded, auth])


  useEffect( ()=> {

    if(hostLocations?.length > 0){
      
      const refs = hostLocations.reduce((acc, value) => {
        acc[value._id] = createRef();
        return acc;
      }, {});

      setScrollRefs(refs)
    }

  }, [hostLocations])


  async function getDistanceDurationsMatrix(destinations, lat, lng){

    if( ( (!userLat && !userLng) && !userAddress) && (!lat && !lng) || destinations?.length === 0 || !destinations){
      alert("Please provide an origin address or your current location")
      return
    }

    var originString = ""
    var destinationString = destinations.join("|")
    var destinationString = encodeURIComponent(destinationString)
    
    if(userLat && userLng){
      originString = userLat.toString() + " " + userLng.toString()
      originString = encodeURIComponent(originString)
    
    } else if (userAddress) {
      originString = encodeURIComponent(userAddress)
    
    } else if(lat && lng){
      originString = lat.toString() + " " + lng.toString()
      originString = encodeURIComponent(originString)
    } 

    const matrix = await getGoogleMatrix(originString, destinationString, auth.userId, auth.accessToken)

    if(matrix){
      return matrix.data
    }
  
  }


  const handleEventActionDriver = async (e) => {

    if(driverRequestedCancel){
      return
    }

    if(waitingSubmit){
      return
    }

    setWaitingSubmit(true)

    if(hostRequestedCancel){

      const approved = await addDriverCancelApprove(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

      if(approved){
        setNewrequest(newrequest + 1)
        setWaitingSubmit(false)
      }
    
    } else {

      const submitted = await addDriverCancelSubmit(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

      if(submitted){
        setNewrequest(newrequest + 1)
        setWaitingSubmit(false)
      }
    }
  }


  const handleEventRejectDriver = async (e) => {

    e.preventDefault()

    if(waitingSubmit){
      return
    }

    setWaitingSubmit(true);

    const submitted = await addDriverReject(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

    if(submitted){
      
      setOpenDetailsModal(false)
      setNewrequest(newrequest + 1)
      setWaitingSubmit(false);

      alert("Booking request has been cancelled")
    }
  }

  const handleEventCancelDriver = async (e) => {

    const submitted = await addDriverCancelSubmit(auth.userId, selectedHostUserId, selectedEventId, auth.userId, auth.accessToken)

    if(submitted){
      setNewrequest(newrequest + 1)
    }
  }


  async function handleAddAppointment(e) {

    e.preventDefault()
    if(waitingSubmit){
      return
    }

    setWaitingSubmit(true)

    var checkedCredits = false
    var charge = ((bookingEnd - bookingStart) / 1000 / 1800) * selectedChargeRate
    setTotalCharge(charge)
    
    if (auth.credits?.length > 0 && selectedCurrency){

      for(let i=0; i< auth?.credits?.length; i++){
        if(auth.credits[i].currency.toLowerCase() === selectedCurrency 
        && auth.credits[i].amount > charge){

          checkedCredits = true;
          setInsufficientFunds(false)
          break
        }
      }

    } else {

      alert("Not enough funds, please fund your account")

      setOpenPaymentsModal(true)
      setInsufficientFunds(true)
    }
      

    if(!checkedCredits){

      alert("Not enough funds, please fund your account")
      setWaitingSubmit(false)
      setOpenPaymentsModal(true)

    } else {

      const added = await addAppointmentRequest(auth.userId, hostUserId, bookingStart, bookingEnd, auth.accessToken)

      if(added && added?.status === 201){
        
        alert("Submitted booking request")
        setNewrequest(newrequest + 1)
        setChanged(changed + 1)
        setOpenReserveModal(false);
        setWaitingSubmit(false)

      } else if (added && added?.status === 402) {
        alert("Sorry, your profile is incomplete! Please check your email or contact us at support@socketjuice.com!")
        setChanged(changed + 1)
        setWaitingSubmit(false);
      
      } else if (added && added?.status === 403) {
        alert("Please try again, conflicting appointment")
        setChanged(changed + 1)
        setWaitingSubmit(false);
      } else {
        alert("Sorry, please try another time!")
        setChanged(changed + 1)
        setWaitingSubmit(false);
      }
    }
  }

  async function handleLinkURLDirections(e, destination){

    // https://www.google.com/maps/dir/?api=1&parameters
      // URL encode origin and destination
      // travelmode=driving

      e.preventDefault()

      var originString = ""
        
      if(userLat !== undefined && userLng !== undefined){
        originString = userLat.toString() + " " + userLng.toString()
        originString = encodeURIComponent(originString)
      
      } else if (userAddress) {
        originString = encodeURIComponent(userAddress)
      }

      var destinationString = encodeURIComponent(destination)

      var finalAddressEncoding = `https://www.google.com/maps/dir/?api=1&origin=${originString}&destination=${destinationString}&travelmode=driving`

      window.open(finalAddressEncoding, "_blank", "noreferrer");
  }


  useEffect( ()=> {

    if(auth){
      console.log("User is logged in")
      debouncedChangeHandleCenter()
    }

    async function hostAppointments(){

      const hostresults = await getHostAppointments(hostUserId, currentDate, auth.accessToken, auth.userId)

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

        var appointmentTrack = {}

        for (let i=0; i<hostresults?.hostAppointments.length; i++){

          if(appointmentTrack[hostresults?.hostAppointments[i]._id] !== undefined){
          
            continue
          
          } else {

            appointmentTrack[hostresults?.hostAppointments[i]._id] = hostresults?.hostAppointments[i]._id

            if(hostresults?.hostAppointments[i]._hostUserId === hostUserId 
              && hostresults?.hostAppointments[i].status !== 'Cancelled'){

              if(hostprofiledata[hostresults?.hostAppointments[i]._hostUserId]){
                
                hostresults.hostAppointments[i].address = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.address
                hostresults.hostAppointments[i].connectionType = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.connectionType
                hostresults.hostAppointments[i].secondaryConnectionType = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.secondaryConnectionType
                
                hostresults.hostAppointments[i].currency = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.currency
                hostresults.hostAppointments[i].currencySymbol = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.currencySymbol
                hostresults.hostAppointments[i].chargeRatePerHalfHour = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.chargeRatePerHalfHour
                hostresults.hostAppointments[i].chargeRatePerHalfHourFee = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.chargeRatePerHalfHourFee

                hostresults.hostAppointments[i].locationlat = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[1]
                hostresults.hostAppointments[i].locationlng = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.location?.coordinates[0]
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
                connectionType: hostresults.hostAppointments[i].connectionType,
                secondaryConnectionType: hostresults.hostAppointments[i].secondaryConnectionType,
                chargeRatePerHalfHour: hostresults.hostAppointments[i].chargeRatePerHalfHour,
                chargeRatePerHalfHourFee: hostresults.hostAppointments[i].chargeRatePerHalfHourFee,
                currency: hostresults.hostAppointments[i].currency,
                currencySymbol: hostresults.hostAppointments[i].currencySymbol,
                durationText: hostresults.hostAppointments[i].durationText,
                distanceText: hostresults.hostAppointments[i].distanceText,
                isDraggable: true
              }
    
              newevents.push(instance)
            }
          }
        }

        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dateCheck = new Date(date["$d"])
        const currentDay = (date["$d"]?.toString()).slice(8,10)
        const yesterday = new Date(dateCheck.getDate() -1)
        const dayofweek = days[dateCheck.getDay()]
        const lastdayofweek = days[yesterday.getDay()]

        const todayAvailableStart = selectedHostProfile[`hours${dayofweek}Start`]
        const todayAvailableEnd = selectedHostProfile[`hours${dayofweek}End`]
        const yesterdayAvailableStart = selectedHostProfile[`hours${lastdayofweek}Start`]
        const yesterdayAvailableEnd = selectedHostProfile[`hours${lastdayofweek}End`]
        const allDayToday = selectedHostProfile[`allDay${dayofweek}`]

        var availabilities = [];

        if(allDayToday){

          var newstarttime = new Date(dateCheck.setHours(0,0,0,0)) 
          newstarttime.setDate(currentDay)

          var newendtime = new Date(dateCheck.setHours(24,0,0,-1)) 
          newendtime.setDate(currentDay)
            
            var availabilityAllDay = {
              id: `today_availability_allday`,
              title: "Available",
              start: new Date(newstarttime),
              end: new Date(newendtime),
              isDraggable: false,
              disabled: true
            }
  
            availabilities.push(availabilityAllDay)

        } else {

              if(yesterdayAvailableEnd < yesterdayAvailableStart && yesterdayAvailableEnd < todayAvailableStart){

                var newstarttime = new Date(dateCheck.setHours(0,0,0,0))
                var newendtime = new Date(dateCheck.setHours(selectedHostProfile[yesterdayAvailableEnd].slice(0, 2),selectedHostProfile[yesterdayAvailableEnd].slice(3, 5),0,0))

                newstarttime.setDate(currentDay)
                newendtime.setDate(currentDay)
                
                var availabilityEarly = {
                  id: `today_availability_early`,
                  title: "Available",
                  start: new Date(newstarttime),
                  end: new Date(newendtime),
                  isDraggable: false,
                  disabled: true
                }
      
                availabilities.push(availabilityEarly)
              
              } else if(yesterdayAvailableEnd < yesterdayAvailableStart && yesterdayAvailableEnd > todayAvailableStart) {
      
                var newstarttime = new Date(dateCheck.setHours(0,0,0,0))
                var newendtime = new Date(dateCheck.setHours(selectedHostProfile[todayAvailableStart].slice(0, 2),selectedHostProfile[todayAvailableStart].slice(3, 5),0,0))

                newstarttime.setDate(currentDay)
                newendtime.setDate(currentDay)
                
                var availabilityEarly = {
                  id: `today_availability_early`,
                  title: "Available",
                  start: new Date(newstarttime),
                  end: new Date(newendtime),
                  isDraggable: false,
                  disabled: true
                }
      
                availabilities.push(availabilityEarly)
              }
              
      
              if(todayAvailableStart > todayAvailableEnd){
      
                var newstarttime = new Date(dateCheck.setHours(selectedHostProfile[todayAvailableStart].slice(0, 2), selectedHostProfile[todayAvailableStart].slice(3, 5), 0,0))
                var newendtime = new Date(dateCheck.setHours(24))

                newstarttime.setDate(currentDay)
                newendtime.setDate(currentDay)
                
                var availabilityLate = {
                  id: `today_availability_late`,
                  title: "Available",
                  start: new Date(newstarttime),
                  end: new Date(newendtime),
                  isDraggable: false,
                  disabled: true
                }
      
                availabilities.push(availabilityLate)
              
              } else if(todayAvailableStart < todayAvailableEnd) {
      
                var newstarttime = new Date(dateCheck.setHours(selectedHostProfile[todayAvailableStart].slice(0, 2), selectedHostProfile[todayAvailableStart].slice(3, 5), 0,0))
                var newendtime = new Date(dateCheck.setHours(selectedHostProfile[todayAvailableEnd].slice(0, 2), selectedHostProfile[todayAvailableEnd].slice(3, 5), 0,0))

                newstarttime.setDate(currentDay)
                newendtime.setDate(currentDay)
                
                var availabilityLate = {
                  id: `today_availability_late`,
                  title: "Available",
                  start: new Date(newstarttime),
                  end: new Date(newendtime),
                  isDraggable: false,
                  disabled: true
                }
      
                availabilities.push(availabilityLate)
              }
        }

        setHostEvents([...newevents])
        setAvailableEvents([...availabilities])
        setEvents([...proposedEvents, ...availabilities, ...newevents])
      }
    }

    if(hostUserId && currentDate && auth.userId){
      hostAppointments()
    }

  }, [hostUserId, newrequest, currentDate, auth])


  const handleOpenReserveModal = (e, host) => {

    e.preventDefault()

    setSelectedAddress(host.address)
    setCurrentDuration(host.durationValue)
    setMediaURLs(host.mediaCarouselURLs)
    setHostComments(host.hostComments)
    setHostUserId(host._userId)

    setInitialOptions({
      "client-id": (host.currency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
      "currency": host.currency.toUpperCase()
    })
    
    setSelectedHostProfile(host)
    setSelectedConnection(host.connectionType)
    setSecondaryConnection(host.secondaryConnectionType)

    setSelectedChargeRate(host.chargeRatePerHalfHourFee)
    setSelectedCurrency(host.currency)
    
    if(auth.credits?.length > 0){
      for(let i=0; i< auth.credits?.length; i++){
        if(auth.credits[i].currency === host.currency.toLowerCase()){
          setPaymentCurrency(host.currency.toLowerCase())
          setPaymentCurrencySymbol(host.currencySymbol)

          if(host.currency.toLowerCase() === "usd"){
            
            setPaymentDisplay([20, 40, 50])

          } else if(host.currency.toLowerCase() === "cad"){

            setPaymentDisplay([20, 40, 50])

          } else if(host.currency.toLowerCase() === "eur"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(host.currency.toLowerCase() === "gbp"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(host.currency.toLowerCase() === "inr"){
              
            setPaymentDisplay([200, 400, 500])

          } else if(host.currency.toLowerCase() === "jpy"){
              
            setPaymentDisplay([3000, 5000, 6000])

          } else if(host.currency.toLowerCase() === "cny"){
              
            setPaymentDisplay([100, 200, 300])

          } else if(host.currency.toLowerCase() === "aud"){
              
            setPaymentDisplay([20, 40, 50])

          } else if(host.currency.toLowerCase() === "nzd"){
              
            setPaymentDisplay([20, 40, 50])

          } else {
              
            setPaymentDisplay([20, 40, 50])
          }

          break
        }
      }
    }

    setSelectedCurrencySymbol(host.currencySymbol)

    var charge = ((bookingEnd - bookingStart) / 1000 / 1800) * host.chargeRatePerHalfHourFee
    setTotalCharge(charge)

    setSelectedDistance(host.distanceText)
    setSelectedDuration(host.durationText)

    setOpenReserveModal(true)
  }

  const handleCloseReserveModal = (e) => {

    e.preventDefault()

    setHostUserId("")
    setOpenReserveModal(false)
  }

  const handleClosePaymentModal = (e) => {

    e.preventDefault()

    setOpenPaymentsModal(false)
  }

  const handleCloseDetailsModal = (e) => {

    e.preventDefault()

    setSelectedEventId("")
    setOpenDetailsModal(false)
  }

  const handleGoogleAddress = (e) => {

    async function getcoordinates(){
        
        if(e.value?.place_id){

            const {latlong} = await getGoogleCoordinates(e.value.place_id, auth.userId, auth.accessToken)

            if(latlong && latlong.results[0].geometry.location.lat && 
              latlong.results[0].geometry.location.lng){

                setUserAddress(latlong.results[0].formatted_address)
                setCenter({ lat: latlong.results[0].geometry.location.lat, lng: latlong.results[0].geometry.location.lng })
            }
        }
    }

    if(auth.userId){
      getcoordinates()
    }
  }

  async function handleCenterChanged() {
      
    if (!mapRef.current || !auth.userId){
      return
    } 
      const newPos = mapRef.current.getCenter().toJSON();

      if(newPos && auth.userId){

        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

        const today = new Date()
        const dayofweek = days[today.getDay()]
        const localtime = today.toTimeString().slice(0,5)
      
        var coordinatesInput = [newPos.lng, newPos.lat]

        const locations = await getHostProfilesCoord(coordinatesInput, dayofweek, localtime,
           auth.userId, auth.accessToken)

        if(locations){

          var destinations = []
          
          for(let i=0; i< locations?.foundHostProfiles?.length; i++){

            if(locations.foundHostProfiles[i]?.address){
              destinations.push(locations.foundHostProfiles[i].address)

              var address_array = locations.foundHostProfiles[i].address?.split(',');
              locations.foundHostProfiles[i].addressArray = address_array
            }
          }
          
          if(locations?.foundHostProfiles?.length > 0){
            const {matrix} = await getDistanceDurationsMatrix(destinations, newPos.lat, newPos.lng)

            if(matrix){

              for(let i=0; i<matrix?.rows[0]?.elements?.length; i++){
                
                if(matrix.destination_addresses[i]){
                    
                  locations.foundHostProfiles[i].durationValue = matrix?.rows[0]?.elements[i].duration?.value
                  locations.foundHostProfiles[i].durationText = matrix?.rows[0]?.elements[i].duration?.text

                  locations.foundHostProfiles[i].distanceValue = matrix?.rows[0]?.elements[i].distance?.value
                  locations.foundHostProfiles[i].distanceText = matrix?.rows[0]?.elements[i].distance?.text
                }
              }
              
              locations.foundHostProfiles.sort((a,b) => a.durationValue - b.durationValue)
              setPreHostLocations(locations.foundHostProfiles)
            }
          }
        }
      }
  }

  const preHandleCenter = (e) => {
    
    if(auth.userId){
      debouncedChangeHandleCenter()
    }
  }

  const colorsList = ["red", "blue", "orange", "purple", "green", "aqua", "maroon", "pink", "gray", "lime"]

  const svgMarkerPins = (color) => {

    if(isLoaded){
      return (

        {path: "M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z",
        fillColor: `${color}`,
        fillOpacity: 1,
        strokeWeight: 1,
        rotation: 0,
        scale: 0.9,
        anchor: new google.maps.Point(25,50),
        }
      )
    }
  } 
  
  const debouncedChangeHandleCenter = useMemo(
      () => debounce(handleCenterChanged, 800)
  , [auth]);

  useEffect( () => {

    var currencies = []
    var currencySet = false;
    if(auth.credits?.length){
        for(let i=0; i<auth.credits?.length; i++){
            currencies.push({currency: auth.credits[i].currency, currencySymbol: auth.credits[i].currencySymbol})
            if(auth.credits[i].currency.toLowerCase() === paymentCurrency){
              setPaymentCurrency(auth.credits[i].currency.toLowerCase())
              setPaymentCurrencySymbol(auth.credits[i].currencySymbol)

              if(paymentCurrency === "usd"){
            
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "cad"){
    
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "eur"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "gbp"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "inr"){
                  
                setPaymentDisplay([200, 400, 500])
    
              } else if(paymentCurrency === "jpy"){
                  
                setPaymentDisplay([3000, 5000, 6000])
    
              } else if(paymentCurrency === "cny"){
                  
                setPaymentDisplay([100, 200, 300])
    
              } else if(paymentCurrency === "aud"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "nzd"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else {
                  
                setPaymentDisplay([20, 40, 50])
              }

              currencySet = true
            }
        }
        setUserCurrencies(currencies)
        if(!currencySet && currencies?.length > 0){
          setPaymentCurrency(currencies[0].currency.toLowerCase())
          setPaymentCurrencySymbol(currencies[0].currencySymbol)
        }
    }

  }, [auth])


  useEffect( ()=> {

    if((auth.credits?.length) && paymentCurrency){
      for(let i=0; i<auth.credits?.length; i++){
          if(auth.credits[i].currency.toLowerCase() === paymentCurrency){
              setPaymentCurrencySymbol(auth.credits[i].currencySymbol)
              setAccountBalance(auth.credits[i].amount)

              if(paymentCurrency === "usd"){
            
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "cad"){
    
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "eur"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "gbp"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "inr"){
                  
                setPaymentDisplay([200, 400, 500])
    
              } else if(paymentCurrency === "jpy"){
                  
                setPaymentDisplay([3000, 5000, 6000])
    
              } else if(paymentCurrency === "cny"){
                  
                setPaymentDisplay([100, 200, 300])
    
              } else if(paymentCurrency === "aud"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else if(paymentCurrency === "nzd"){
                  
                setPaymentDisplay([20, 40, 50])
    
              } else {
                  
                setPaymentDisplay([20, 40, 50])
              }
          }
      }
      for(let i=0; i<auth.escrow?.length; i++){
          if(auth.escrow[i].currency.toLowerCase() === paymentCurrency){
              setEscrowBalance(auth.escrow[i].amount)
          }
      }
    }

  }, [paymentCurrency, auth])


  useEffect( ()=> {

    async function updateUserData(){

        const userdata = await getUserData(auth.accessToken, auth.userId)

        if(userdata){

          for(let i=0; i<userdata.foundUser.credits?.length; i++){
            if(userdata.foundUser.credits[i].currency.toLowerCase() === paymentCurrency){
                setPaymentCurrencySymbol(userdata.foundUser.credits[i].currencySymbol)
                setAccountBalance(userdata.foundUser.credits[i].amount)
            }
          }
          for(let i=0; i<userdata.foundUser.escrow?.length; i++){
              if(userdata.foundUser.escrow[i].currency.toLowerCase() === paymentCurrency){
                  setEscrowBalance(userdata.foundUser.escrow[i].amount)
              }
          }
            
            setAuth(prev => {
        
                return {
                    ...prev,
                    credits: userdata.foundUser?.credits,
                    escrow: userdata.foundUser?.escrow,
                    requestedPayout: userdata.foundUser?.requestedPayout,
                    requestedPayoutCurrency: userdata.foundUser?.requestedPayoutCurrency,
                    requestedPayoutOption: userdata.foundUser?.requestedPayoutOption,
                }
            });
        }
    }

    if(auth?.userId && changed > 0){
        updateUserData()
    }

  }, [changed])


  const handleMessage = async () => {

    if(!auth.userId){
        navigate('/map');
        return
    }

    setNewIndividualChat({userId: selectedHostUserId});
    navigate(`/messages`);
  }


  const handlePanLocation = () => {

      if(auth?.userId){

        setWaitingCurrent(true)

        navigator.geolocation.getCurrentPosition(position =>{
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
  
          if(position.coords.longitude && position.coords.latitude){
            map.panTo({lat:position.coords.latitude,lng:position.coords.longitude})
            setWaitingCurrent(false)
          }
        })
      
      } else {
        //Open login modal
      }
    };


    const handleAddressClick = (e, host) => {

      e.preventDefault()
      setCenter({ lat: host.location?.coordinates[1], lng: host.location?.coordinates[0] })
      setCurrentMarker(host._id)
    }

    const handleMarkerClick = (e, host) => {

      setCurrentMarker(host._id)

      if(scrollRefs){

        setTimeout(() =>
          scrollRefs[host._id].current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          }),
          50
        )
      }
    }

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService()
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    })
    setDirectionsResponse(results)
    setDistance(results.routes[0].legs[0].distance.text)
    setDuration(results.routes[0].legs[0].duration.text)
  }

  function clearRoute() {
    setDirectionsResponse(null)
    setDistance('')
    setDuration('')
    originRef.current.value = ''
    destinationRef.current.value = ''
  }

  const handleOnLoad = (mapinput) => {
      setMap(mapinput)
      mapRef.current = mapinput;
    };

  return (

    <>      
    <div style={{height:'100svh', width:'100svw'}} 
                  className="bg-white bg-center max-w-full
                      flex flex-col fixed w-full">

      <MainHeader 
          loggedUserId={auth.userId} 
      />

      {isLoaded ? 

      <div className='flex relative flex-col items-center pt-[7vh] sm:pt-[8vh] 
              md:pt-[9vh] h-[100svh] w-[100svw]'>

          <div className='absolute h-full w-full'>
          {/* Google Map Box */}
          <GoogleMap
              center={center}
              zoom={14}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              }}
              onLoad={(map) => handleOnLoad(map)}
              onCenterChanged={(e)=>preHandleCenter(e)}
          >

          {(userLat && userLng && isLoaded) && <div>
              <Marker position={{ lat: userLat, lng: userLng }}
              icon={currentIcon}
              />
          </div>}

          { hostLocations?.length > 0 ? 
          
            hostLocations.map((host, index)=> (
              
              <div key={`${host._id}_marker`}>

                <button className='flex flex-col' >
                    <Marker position={{lat: host.location.coordinates[1], lng:host.location.coordinates[0]}} 
                      icon={svgMarkerPins(colorsList[index])}
                      value={host.address}  onClick={(e)=>handleMarkerClick(e, host)}/>
                </button>
              </div>
            ))
          
           : null}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}

        </GoogleMap>
      </div>

      {auth.userId && <div className="p-2 rounded-xl m-2 bg-white shadow-sm z-10 
      flex flex-row border items-center justify-center gap-x-1">

        <div className='flex flex-row items-center'> 

            <svg xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            className="absolute pl-2 h-6 pointer-events-none z-20"
            strokeWidth="2" stroke="#00D3E0">
              <path strokeLinecap="round" strokeLinejoin="round" 
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>

              <GooglePlacesAutocomplete
                  className="text-sm sm:text-base"
                  apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                  debounce={400}
                  // autocompletionRequest={{
                  //     componentRestrictions: {
                  //       country: ["ca", "us"] //to set the specific country
                  //     }
                  //   }}
                  selectProps={{
                      defaultInputValue: userAddress,
                      onChange: handleGoogleAddress, //save the value gotten from google
                      placeholder: "Address",
                      styles: {
                          control: (provided, state) => ({
                              ...provided,
                              width: "170px",
                              height: "50px",
                              boxShadow: "#00D3E0",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              paddingLeft: "28px",
                              borderRadius: "6px",
                              border: state.isFocused
                              ? "2px solid #00D3E0"
                              : "1px solid #00D3E0",
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
                              "--tw-ring-color": "#00D3E0",
                              fontSize: "0.875rem",
                              lineHeight: "1.25rem",
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

        <div className='flex flex-row'>

            <button className='rounded-md px-1 py-3 border border-[#00D3E0] text-gray-500 
            w-[170px] h-[50px] flex flex-row items-center' 
              onClick={(e)=> handlePanLocation(e)}>
                
                {waitingCurrent ?
                  <div aria-label="Loading..." role="status">
                    <svg className="px-1 h-7 w-7 animate-spin" viewBox="3 3 18 18">
                    <path
                        className="fill-gray-200"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                    <path
                        className="fill-[#00D3E0]"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                    </svg>
                </div>
                :
                <div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="#00D3E0"
                    height="1.5em"
                    width="1.5em"
                    className="ml-1"
                  >
                    <path d="M15 12 A3 3 0 0 1 12 15 A3 3 0 0 1 9 12 A3 3 0 0 1 15 12 z" />
                    <path d="M13 4.069V2h-2v2.069A8.008 8.008 0 004.069 11H2v2h2.069A8.007 8.007 0 0011 19.931V22h2v-2.069A8.007 8.007 0 0019.931 13H22v-2h-2.069A8.008 8.008 0 0013 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" />
                  </svg>
                </div>
                }

              <p className='pl-2 pt-1 text-sm'>Current Location</p>
            </button>

        </div>

      </div>}

      { (windowSize.x > 600 && auth.userId ) &&
        
        <div className='flex w-full justify-start items-start '>
            
            <div className='ml-4 py-2 flex flex-col w-[350px] h-[500px] rounded-xl
              bg-gray-50 border-2 border-[#00D3E0] z-10 items-center px-2'>

                <div className='flex flex-row overflow-x-scroll w-full
                pl-4 border-b border-[#00D3E0] py-1'>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>J1772 AC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={j1772ACChecked}
                                onChange={()=>setj1772ACChecked(!j1772ACChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.4)",
                            }}
                            />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>CCS1 DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={ccs1DCChecked}
                              onChange={()=>setccs1DCChecked(!ccs1DCChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.4)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>Mennekes AC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={mennekesACChecked}
                              onChange={()=>setmennekesACChecked(!mennekesACChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.4)",
                          }}
                        />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>CCS2 DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={ccs2DCChecked}
                              onChange={()=>setccs2DCChecked(!ccs2DCChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.4)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>CHAdeMO DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={chademoDCChecked}
                            onChange={()=>setchademoDCChecked(!chademoDCChecked)}
                            style ={{
                            color: "#00D3E0",
                            transform: "scale(1.4)",
                        }}
                        />
                      }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>GB/T AC</label>    
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={gbtACChecked}
                              onChange={()=>setgbtACChecked(!gbtACChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.4)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>GB/T DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={gbtDCChecked}
                                onChange={()=>setgbtDCChecked(!gbtDCChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.4)",
                            }}
                            />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>Tesla</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={teslaChecked}
                                onChange={()=>setTeslaChecked(!teslaChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.4)",
                            }}
                            />
                        }
                    />
                    </div>
                </div>

                <div className='w-full overflow-y-scroll' key={"hostlocations_container"}>
                
                {hostLocations.map((host, index) => (
                  
                  <div key={`${host._id}_leftsquare`} onClick={(e)=>handleAddressClick(e, host)}
                    className={`w-full flex flex-col px-2 bg-[#c1f2f5]
                    py-2 ${currentMarker === host._id ? 'border-4 border-[#FFE142] '   
                    : 'border border-gray-300  '} rounded-lg`}
                    ref={scrollRefs[host._id]}>
                    
                    <div className='flex flex-row'>
                      
                      <svg version="1.2" baseProfile="tiny" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="25" height="25" viewBox="0 0 50 50" 
                      fill={colorsList[index]}
                      overflow="inherit">
                        <path d="M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z"/>
                      </svg>

                      <p className='text-base pl-1'>{host?.addressArray.slice(0, -2).join(", ")}</p>
                    
                    </div>
                    
                    <div className='flex flex-row w-full justify-between items-center'>
                      
                      <div className='flex flex-col w-full gap-y-1 justify-center h-[69px]'>
                        <p className='text-base'>Distance: {host.distanceText} / {host.durationText}</p>
                        <p className='text-base'>30 Min Rate: {host.currencySymbol}{Number(host.chargeRatePerHalfHourFee).toFixed(2)}</p>
                      </div>
                    
                      <div className='flex flex-col items-center py-1'>
                          <button 
                            className='px-3 py-2 bg-[#FFE142] hover:bg-[orange] rounded-lg'
                            onClick={(e)=>handleOpenReserveModal(e, host)}
                            >
                              Reserve
                          </button>
                          {host.availableNow && <p className='text-sm text-center'>Open Now!</p>}
                      </div>
                    </div>

                  </div>
                ))}
              </div>    
            </div>
        </div>}
       
       { (windowSize.x <= 600 && auth.userId ) && 
       
       <div className='flex flex-grow justify-end items-end'>
            
            <div className='flex flex-col w-[350px] h-[200px] rounded-xl bg-gray-50 
              border border-[#00D3E0] z-10 items-center overflow-y-scroll'>

              <div className='flex flex-row overflow-x-scroll w-full
                pl-4 border-b border-[#00D3E0] py-1'>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                      
                    <p className='text-right pr-1 text-xs sm:text-sm'>J1772 AC</p>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={j1772ACChecked}
                                onChange={()=>setj1772ACChecked(!j1772ACChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.3)",
                            }}
                            />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <p className='text-right pr-1 text-xs sm:text-sm'>CCS1 DC</p>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={ccs1DCChecked}
                              onChange={()=>setccs1DCChecked(!ccs1DCChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.3)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <p className='text-right pr-1 text-xs sm:text-sm'>Mennekes AC</p>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={mennekesACChecked}
                              onChange={()=>setmennekesACChecked(!mennekesACChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.3)",
                          }}
                        />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <p className='text-right pr-1 text-xs sm:text-sm'>CCS2 DC</p>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={ccs2DCChecked}
                              onChange={()=>setccs2DCChecked(!ccs2DCChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.3)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>CHAdeMO DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={chademoDCChecked}
                            onChange={()=>setchademoDCChecked(!chademoDCChecked)}
                            style ={{
                            color: "#00D3E0",
                            transform: "scale(1.3)",
                        }}
                        />
                      }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>GB/T AC</label>    
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={gbtACChecked}
                              onChange={()=>setgbtACChecked(!gbtACChecked)}
                              style ={{
                              color: "#00D3E0",
                              transform: "scale(1.3)",
                          }}
                          />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>GB/T DC</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={gbtDCChecked}
                                onChange={()=>setgbtDCChecked(!gbtDCChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.3)",
                            }}
                            />
                        }
                    />
                    </div>

                    <div className='flex flex-row items-center justify-start gap-x-3'>
                    <label className='text-right pr-1 text-xs sm:text-sm'>Tesla</label>
                    <FormControlLabel
                        label=""
                        control={
                        <Checkbox checked={teslaChecked}
                                onChange={()=>setTeslaChecked(!teslaChecked)}
                                style ={{
                                color: "#00D3E0",
                                transform: "scale(1.3)",
                            }}
                            />
                        }
                    />
                    </div>
                </div>

                <div className='w-full' key={"hostlocations_container_mini"}>
                
                {hostLocations.map((host, index) => (
                  
                  <div key={`${host._id}_leftsquare`} onClick={(e)=>handleAddressClick(e, host)}
                    className={`w-full flex flex-col px-3 bg-[#c1f2f5] my-1
                    py-2 ${currentMarker === host._id ? 'border-4 border-[#FFE142] '   
                    : 'border border-gray-300  '} rounded-lg`}
                    ref={scrollRefs[host._id]}>
                    
                    <div className='flex flex-row m-1'>
                      
                      <svg version="1.2" baseProfile="tiny" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="25" height="25" viewBox="0 0 50 50" 
                      fill={colorsList[index]}
                      overflow="inherit">
                        <path d="M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z"/>
                      </svg>

                      <p className='text-base pl-1'>{host?.addressArray.slice(0, -2).join(", ")}</p>
                    
                    </div>
                    
                    <div className='flex flex-row w-full justify-between items-center'>
                      
                      <div className='flex flex-col w-full gap-y-1 h-[69px]'>
                        <p className='text-base'>Distance: {host.distanceText} / {host.durationText}</p>
                        <p className='text-base'>30 Min Rate: {host.currencySymbol}{Number(host.chargeRatePerHalfHourFee).toFixed(2)}</p>
                      </div>
                    
                      <div className='flex flex-col items-center py-1'>
                          <button 
                            className='px-3 py-2 bg-[#FFE142] hover:bg-[orange] rounded-lg'
                            onClick={(e)=>handleOpenReserveModal(e, host)}
                            >
                              Reserve
                          </button>
                          {host.availableNow && <p className='text-sm text-center'>Open Now!</p>}
                      </div>
                    </div>

                  </div>
                ))}

              </div>
            </div>
        </div>
        }

    </div>

        : null }

      </div>

      <Modal
        open={openReserveModal}
        disableAutoFocus={true}
        onClose={handleCloseReserveModal}
        onClick={(event)=>{event.stopPropagation()}}
        aria-labelledby="child-modal-title"
        aria-describedby="child-modal-description">
            
        <Box sx={{ ...profileStyle }}>

          <div className='flex flex-col w-full overflow-y-scroll'>

          <div className='py-2'>
            {/* <p className='text-center'><b>Address:</b> {selectedAddress.slice(0, selectedAddress.lastIndexOf(',', selectedAddress.lastIndexOf(',')-1))}</p> */}
            <p className='text-center text-lg'><b>Connector:</b> {selectedConnection}</p>
            <p className='text-center text-lg'><b>Other Adapter:</b> {secondaryConnection}</p>
          </div>

          <Slider {...settings} ref={sliderRefPre}>
            
            {mediaURLs?.length > 0 && 
            
            mediaURLs.map((image, index) => (

                <div key={`postmediapre_${index}`}> 
                    
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
                                src={mediaURLs[index]} 
                            />
                        
                        </div>

                        </Box>
                        </div>
                  </div>         
              </div>
            ))}

            </Slider>

                <p className='text-lg text-center font-semibold pt-6 pb-2'> Enter Requested Time Below: </p>

                <div className='pt-1 pb-4 flex flex-col gap-y-2'>

                    <LocalizationProvider sx={{borderColor: "#8BEDF3"}} dateAdapter={AdapterDayjs}>
            
                      <DateTimePicker
                        sx={{borderColor: "#8BEDF3", outlineColor: "#8BEDF3"}}
                        value={dayjs(bookingStart)}
                        onChange={(newValue) => setBookingStart(dayjs(new Date(newValue)))}
                      />

                    </LocalizationProvider>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          value={dayjs(bookingEnd)}
                          onChange={(newValue) => setBookingEnd(dayjs(new Date(newValue)))}
                          />
                    </LocalizationProvider>
                    
                    <div className='w-full flex flex-col justify-center items-center pt-1 pb-3'>
                      <p className='text-center text-lg pt-2'>30 Min Rate: {selectedCurrency?.toUpperCase()} {selectedCurrencySymbol}{Number(selectedChargeRate).toFixed(2)}</p>
                      <p className='text-center text-lg'> Length of Booking: {bookingLengthText}</p>
                      <p className='pt-2 text-xl font-semibold'>Total Cost: {selectedCurrency?.toUpperCase()}{selectedCurrencySymbol}{Number(totalCharge).toFixed(2)}</p>
                    </div>

                    <div className='flex flex-row ml-2'>
                        <input  
                          className='w-5 h-5'
                            type="checkbox" 
                            id='termsagree'
                            onChange={toggleTerms}
                            checked={termschecked}
                        />
                        <label className='ml-2 text-sm font-medium md:text-base' htmlFor="termsagree">{`I agree to the `}
                            <button className='text-blue-900 underline' onClick={(e)=>handleTermsClick(e)}> 
                              Terms of Service
                            </button>
                        </label>
                    </div>

                    <button className={`border border-gray-300 px-3 py-3 rounded-xl bg-[#c1f2f5] 
                     flex flex-row gap-x-2 justify-center items-center ${!termschecked ? "cursor-not-allowed hover:bg-gray-400" : "cursor-pointer hover:bg-[#00D3E0]"}`}
                      onClick={(e)=>handleAddAppointment(e)}
                      disabled={!termschecked || waitingSubmit}>

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
                      </div>
                      }

                      {insufficientFunds ? "Fund Account and Submit Request" : "Submit Request" }

                    </button>

                    <div className="flex flex-row justify-center items-center gap-x-2 pt-8">

                      <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                      <select onChange={(event)=>setPaymentCurrency(event.target.value)}
                      value={paymentCurrency}
                      className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                          {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                          
                              <option key={`${e.currency}_incoming`} value={`${e.currency.toLowerCase()}`}>{e.currencySymbol}{e.currency.toUpperCase()}</option>
                          )}

                      </select> 

                      </div>

                    <div className='text-xl text-center pt-1 font-semibold'>
                      My Account Balance
                    </div>
                    
                    <div className='flex flex-col justify-center items-center pb-3'>
                      <p className="text-lg">In Wallet: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{accountBalance.toFixed(2)}</p>
                      <p className="text-lg">On Hold: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{escrowBalance.toFixed(2)}</p>
                    </div>

                    <div className='flex flex-col pt-4'>
                      
                      <div className='flex flex-row justify-center'>
                      <span className='bg-[#8BEDF3] h-[50px] w-[100px] flex justify-center items-center p-2'>3rd Party Bookings</span>
                        <span className='bg-[#F97316] h-[50px] w-[100px] flex justify-center items-center p-2'>Current Request</span>
                        <span className='bg-[#FFE142] h-[50px] w-[100px] flex justify-center items-center p-2'>Your Bookings</span>
                        <span className='bg-[#D1D5DB] h-[50px] w-[100px] flex justify-center items-center p-2'>Host Available</span>
                      </div>

                      <p className='text-lg text-center pt-4 pb-2'>Host Schedule</p>

                    <DnDCalendar

                      style={{ height: "500px"}}

                      date={date}
                      defaultView="day"
                      events={events}
                      localizer={localizer}
                      
                      startAccessor="start"
                      endAccessor="end"
                      draggableAccessor="isDraggable"

                      views={['day']}

                      onSelectEvent={(e)=>handleSelectEvent(e)}
                      onEventDrop={(e)=>handleEventMove(e)}
                      onEventResize={(e)=>handleEventResize(e)}
                      
                      onSelectSlot={(e)=>handleSelectSlot(e)}
                      scrollToTime={scrollToTime}
                      onNavigate={date=>handleNavigate(date)}

                      eventPropGetter={
                        (event) => {
                          let newStyle = {
                            backgroundColor: "#D1D5DB",
                            color: 'black',
                            borderRadius: "0px",
                            border: "none",
                          };
                    
                          if (event.requesterId === auth.userId){
                          
                            newStyle.backgroundColor = "#FFE142"
                          
                          } else if (event.title === "Available"){

                            newStyle.backgroundColor = "#D1D5DB"
                            newStyle.marginRight = "60px"
                            newStyle.width = "60%"
                          
                          } else if (event.title === "Requested Booking Time"){

                            newStyle.backgroundColor = "#F97316"
                          
                          } else {

                            newStyle.backgroundColor = "#8BEDF3"
                          }
                    
                          return {
                            className: "",
                            style: newStyle
                          };
                        }
                      }

                      selectable
                      resizable
                  />
                  </div>

                </div>
              </div>
            </Box>
        </Modal>

        <Modal
            open={openDetailsModal}
            disableAutoFocus={true}
            onClose={handleCloseDetailsModal}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description">

            <Box sx={{ ...profileStyle, height: "450px" }}>

              <div className='flex flex-col w-full overflow-y-scroll'>

                <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                    <p className='text-center text-lg font-semibold'>Details of Booking Request</p>

                    <p className='text-center'><b>Rate Per 30 Min: </b>{selectedCurrency?.toUpperCase()}{selectedCurrencySymbol}{Number(selectedChargeRate).toFixed(2)}</p>
                    {hostComments?.length > 0 && <p className='flex-wrap pl-2'>Special Directions / Comments from Host: {hostComments}</p>}

                    <p className='text-xl font-semibold'>Total: {selectedCurrency?.toUpperCase()}{selectedCurrencySymbol}{Number(totalCharge).toFixed(2)}</p>

                    <img className='w-[350px] h-[350px]' src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />
                    
                    <p>Start Time: {selectedEventStart}</p>
                    <p>End Time: {selectedEventEnd}</p>
                    <p>Status: {driverRequestedCancel ? "Driver Requested To Cancel" : (hostRequestedCancel ? "You Asked to Cancel" : (selectedEventStatus === "Requested" ? "Booking Requested" : (selectedEventStatus === "Approved" ? "Approved" : "Completed"))) }</p>

                    {selectedEventStatus !== "Requested" && 
                    <button 
                      disabled={(selectedEventStatus === "Cancelled" || selectedEventStatus === "Approved")}
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                        ${( (selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) || selectedEventStatus === "Cancelled" ) 
                        ? "cursor-not-allowed bg-gray-300" : "bg-[rgb(193,242,245)] hover:bg-[#00D3E0]" }`}
                      onClick={(e)=>handleEventActionDriver(e)}>
                        {(selectedEventStatus === "Approved" && !driverRequestedCancel && !hostRequestedCancel) && <p>Approved - Ask To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && driverRequestedCancel) && <p>You Asked To Cancel</p> }
                        {(selectedEventStatus === "CancelSubmitted" && hostRequestedCancel) && <p>Host Asked To Cancel - Approve</p> }
                        {(selectedEventStatus === "Cancelled") && <p>Cancelled</p> }
                    </button> }

                    {selectedEventStatus === "Requested" && 
                    <button 
                      disabled={(selectedEventStatus === "Cancelled" || selectedEventStatus === "CancelSubmitted" || waitingSubmit)}
                      className={`border border-gray-300 px-3 py-2 rounded-xl flex flex-row justify-center items-center gap-x-2
                        ${( (selectedEventStatus === "CancelSubmitted" || selectedEventStatus === "Cancelled"  && driverRequestedCancel) || selectedEventStatus === "Cancelled" ) 
                        ? "cursor-not-allowed bg-gray-300" : "bg-[rgb(193,242,245)] hover:bg-[#00D3E0]" }`}
                      onClick={(e)=>handleEventRejectDriver(e)}>

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
                        </div>
                        }

                        {(selectedEventStatus === "Requested" && !driverRequestedCancel) && <p>Cancel Booking Request</p> }
                    </button>}

                    <button className='border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]'
                      onClick={(e)=>handleLinkURLDirections(e, selectedAddress)}>
                        Get Directions (Opens Map)
                    </button>

                    {(selectedEventStatus !== "Requested") 
                      && 
                      <button className='border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]'
                      onClick={(e)=>handleMessage(e)}>
                      Send Message
                    </button>}

                </div>
              </div>
            </Box>
        </Modal>

        <Modal
            open={openPaymentsModal}
            disableAutoFocus={true}
            onClose={handleClosePaymentModal}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description">

            <Box sx={{ ...profileStyle, height: "450px" }}>

              <div className='flex flex-col w-full overflow-y-scroll'>

                  <div className="flex flex-col justify-center items-center w-full">
                
                      <img className="w-[200px]" src={socketjuice_full_logo} />

                      <p className="text-2xl">Reload Amount:</p>

                      {!paymentSubmitted && <div className="flex flex-row gap-x-4 py-3">

                          <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                              onClick={(e)=>handleSelectAmount(e, "A")} disabled={paymentSubmitted}>
                              {paymentCurrencySymbol}{paymentDisplay[0]}
                          </button>

                          <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                              onClick={(e)=>handleSelectAmount(e, "B")} disabled={paymentSubmitted}>
                              {paymentCurrencySymbol}{paymentDisplay[1]}
                          </button>

                          <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                              onClick={(e)=>handleSelectAmount(e, "C")} disabled={paymentSubmitted}>
                              {paymentCurrencySymbol}{paymentDisplay[2]}
                          </button>

                      </div>}

                      <div className="py-4 flex flex-col justify-center items-center">

                          <p className="text-3xl font-bold">{selectedCurrency.toUpperCase()} {selectedCurrencySymbol}{selectedAmount.toFixed(2)}</p>
                          
                          <p className="text-lg font-bold"> +Service Fee: {selectedCurrencySymbol}{selectedServiceFee.toFixed(2)} </p>

                          <p className="flex flex-col w-[325px] text-center text-sm">Note: Service fee includes taxes and all processing charges for PayPal, credit cards, and bank transfers. </p>

                          <p className="text-4xl font-bold pt-8 pb-4">Total: {selectedCurrency.toUpperCase()} {selectedCurrencySymbol}{selectedTotal.toFixed(2)}</p>

                      </div>

                      {waitingPayment && <div className="flex flex-row gap-x-2">

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
                          <p className="text-lg">Loading...</p>

                      </div>}

                      {paymentMessage && <p>{paymentMessage}</p>}

                      {(auth.userId && selectedCurrency) ? 
                      
                      <div className="flex flex-col w-[325px] max-w-[350px] pt-4">
                      <PayPalScriptProvider options={initialOptions}>

                      <PayPalButtons
                      forceReRender={[selectedCurrency, selectedOption, paymentSuccess]}
                      disabled={paymentSuccess || waitingPayment}
                      style={{
                          shape: "rect",
                          //color:'blue' change the default color of the buttons
                          layout: "vertical", //default value. Can be changed to horizontal
                      }}
                      createOrder={async (data, actions) => {
                          
                          setWaitingPayment(true);

                          const orderData = await addPaypalOrder(selectedCurrency, selectedOption, auth?.userId, auth?.accessToken)

                          if(orderData){

                              try{

                                  var orderDataId = orderData.id

                                  if (orderDataId) {
                                      
                                      setWaitingPayment(false)
                                      setPaymentSubmitted(true)
                                      return orderDataId;

                                  } else {
                                      const errorDetail = orderData?.details?.[0];
                                      const errorMessage = errorDetail
                                      ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                                      : JSON.stringify(orderData);

                                      throw new Error(errorMessage);
                                  }

                              } catch (error) {
                                  console.error(error);
                                  setPaymentMessage(`Could not initiate PayPal Checkout...${error}`);
                              }
                          } else {
                              setWaitingPayment(false)
                              setPaymentSuccess(true)
                              setPaymentMessage(`Could not initiate PayPal Checkout...Sorry, please refresh and try again`);
                              return 
                          }
                      }}
                      onApprove={async (data, actions) => {
                          
                          try {

                            setWaitingPayment(true)
                              
                              const captureData = await capturePaypalOrder(data.orderID, auth.userId, auth.accessToken)

                              if(captureData){

                                  const errorDetail = captureData?.details?.[0];

                                  // Three cases to handle:
                                  //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                                  //   (2) Other non-recoverable errors -> Show a failure message
                                  //   (3) Successful transaction -> Show confirmation or thank you message

                                  if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                                      // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                                      // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                                      setWaitingPayment(false);
                                      return actions.restart();
                                  } else if (errorDetail) {
                                      // (2) Other non-recoverable errors -> Show a failure message
                                      setWaitingPayment(false);
                                      throw new Error(
                                      `${errorDetail.description} (${captureData.debug_id})`,
                                      );
                                  } else if (captureData?.status === 201) {
                                      // (3) Successful transaction -> Show confirmation or thank you message
                                      // Or go to another URL:  actions.redirect('thank_you.html');
                                      setWaitingPayment(false);
                                      setPaymentSuccess(true)
                                      setChanged(changed + 1)
                                      alert(`Success, your payment of ${captureData?.data?.orderData?.currency_code} ${captureData?.data?.orderData?.value} has been received!`)
                                      setPaymentCurrency(selectedCurrency.toLowerCase())
                                      setOpenPaymentsModal(false)
                                  }
                              }   

                          } catch (error) {
                              console.error(error);
                              setPaymentMessage(
                                  `Sorry, your transaction could not be processed...${error}`,
                              );
                          }
                      }}
                      />
                  </PayPalScriptProvider>

                  </div> : null}

                  </div>
                
              </div>
            </Box>
        </Modal>
    </>
  )
}

export default MapPage