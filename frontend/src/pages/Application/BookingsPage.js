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

import addDriverCancelApprove from '../../helpers/Appointments/addDriverCancelApprove';
import addDriverCancelSubmit from '../../helpers/Appointments/addDriverCancelSubmit';
import addHostCancelApprove from '../../helpers/Appointments/addHostCancelApprove';
import addHostCancelSubmit from '../../helpers/Appointments/addHostCancelSubmit';

import getUserData from '../../helpers/Userdata/getUserData';
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
        }
      }

      if(auth){

        getUser()

      } else {
        
        setActiveTab("bookings")
      }

    }, [auth])


    const handleEventCancelHost = async (e) => {

      console.log(e)

      const submitted = await addHostCancelSubmit(e.userId, auth.userId, e.appointmentId, auth.userId, auth.accessToken)

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
    
    const handleEventActionHost =  async (e) => {

      console.log(e)

      if(hostRequestedCancel){
        return
      }

      if(driverRequestedCancel){

        const approvedCancel = await addHostCancelApprove(selectedDriverUserId, auth.userId, selectedEventId, auth.userId, auth.accessToken)

        if(approvedCancel){
          console.log("Booking completed")
          setNewrequest(!newrequest)
        }

      } else if (selectedEventStatus === "requested"){

        const bookingApproved = await addAppointmentApproval(e._userId, auth.userId, e.start, e.end, auth.accessToken)

        if(bookingApproved){
          console.log("Booking completed")
          setNewrequest(!newrequest)
        }

      } else if (selectedEventStatus === "approved"){

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
        
        <div>
        
          <p>Please submit the information below for your charging equipment</p>
          <p>After approval, drivers will be able to request bookings and you will be able to earn income</p>
        
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

                    <button disabled={selectedEventStatus === "Approved" || driverRequestedCancel} 
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${ (selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" || driverRequestedCancel) ? "bg-[#c1f2f5] cursor-not-allowed" : "bg-[#c1f2f5] hover:bg-[#00D3E0] " } `}
                      onClick={(e)=>handleEventActionDriver(e)}>
                        { (driverRequestedCancel && selectedEventStatus !== "Cancelled") ? "You Requested To Cancel" : ( (hostRequestedCancel && selectedEventStatus !== "Cancelled") ? "Approve Host Cancellation" : (selectedEventStatus === "Requested" ? "Approve Booking" : (selectedEventStatus === "Approved" ? "Mark Completed" : (selectedEventStatus === "Cancelled" ? "Cancelled" : "Completed")))) }
                    </button>

                    {selectedEventStatus === "Requested" && 
                      <button 
                      className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]`}
                      onClick={(e)=>handleEventCancelDriver(e)}>
                        Ask To Cancel</button>}

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

                    <button disabled={(selectedEventStatus === "Approved" || selectedEventStatus === "Cancelled" || hostRequestedCancel )} 
                      className={`border border-gray-300 px-3 py-2 rounded-xl 
                      ${(selectedEventStatus === "Completed" || selectedEventStatus === "Cancelled" || hostRequestedCancel) ? "bg-[#c1f2f5] cursor-not-allowed" : "bg-[#c1f2f5] hover:bg-[#00D3E0] " } `}
                      onClick={(e)=>handleEventActionHost(e)}>
                        {(driverRequestedCancel && selectedEventStatus !== "Cancelled") ? "Approve Driver Cancellation" : ( (hostRequestedCancel && selectedEventStatus !== "Cancelled" ) ? "You Asked to Cancel" : (selectedEventStatus === "Requested" ? "Approve Booking" : (selectedEventStatus === "Approved" ? "Mark Completed" : (selectedEventStatus === "Cancelled" ? "Cancelled" : "Completed")))) }
                    </button>

                    {selectedEventStatus === "Requested" && 
                      <button 
                        className={`border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] hover:bg-[#00D3E0]`}
                        onClick={(e)=>handleEventCancelHost(e)}>
                          Ask To Cancel
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