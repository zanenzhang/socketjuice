import React, { useRef, useState, useEffect } from 'react';

import { TextField, Button, DialogActions } from "@mui/material";
import MainHeader from '../../components/mainHeader/mainHeader';
import useAuth from '../../hooks/useAuth';
import Tab from "@material-ui/core/Tab";
import Box from '@mui/material/Box';
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";  
import { Calendar, dayjsLocalizer } from "react-big-calendar";

import addDriverCancelApprove from '../../helpers/Appointments/addDriverCancelApprove';
import addDriverCancelSubmit from '../../helpers/Appointments/addDriverCancelSubmit';
import addHostCancelApprove from '../../helpers/Appointments/addHostCancelApprove';
import addHostCancelSubmit from '../../helpers/Appointments/addHostCancelSubmit';
import getDriverAppointments from '../../helpers/Appointments/getDriverAppointments';
import getHostAppointments from '../../helpers/Appointments/getHostAppointments';
import addAppointmentApproval from '../../helpers/Appointments/addAppointmentApproval';
import addAppointmentCompletion from '../../helpers/Appointments/addAppointmentCompletion';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';


const BookingsPage = () => {

  const localizer = dayjsLocalizer(dayjs);
  const DnDCalendar = withDragAndDrop(Calendar);

    const { auth, setActiveTab, socket, setSocket, setNewMessages, setNewRequests } = useAuth();

    const [value, setValue] = useState("0")
    const [waiting, setWaiting] = useState(false);

    const [date, setDate] = useState(new Date())
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0,10))

    const [hostAppointments, setHostAppointments] = useState([])
    const [driverAppointments, setDriverAppointments] = useState([])

    useEffect( ()=> {

      setActiveTab("bookings")

    }, [])  

    const handleTabSwitch = (event, newValue) => {

        if(waiting){
            return
        }

        setWaiting(true);

        setValue(newValue);

        setWaiting(false);
    };


    useEffect( ()=> {

      if(auth){
        console.log("User is logged in")
      }
  
      async function hostAppointments() {
  
        const hostresults = await getHostAppointments(hostUserId, currentDate, auth.accessToken, auth.userId)
  
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
  
          console.log(hostprofiledata)
          console.log(hostuserdata)
  
          for (let i=0; i<hostresults?.hostAppointments.length; i++){
  
            if(hostprofiledata[hostresults?.hostAppointments[i]._hostUserId]){
              hostresults.hostAppointments[i].address = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.address
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
              isDraggable: true
            }
  
            newevents.push(instance)
          }
  
          console.log("host events", newevents)
  
          setHostAppointments([...newevents])
        }
      }
  
      if(currentDate && auth.userId && value === "0"){
        hostAppointments()
      }
  
    }, [currentDate, auth, value])


    useEffect( ()=> {

      if(auth){
        console.log("User is logged in")
      }
  
      async function driverAppointments() {
  
        const hostresults = await getDriverAppointments(hostUserId, currentDate, auth.accessToken, auth.userId)
  
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
  
          console.log(hostprofiledata)
          console.log(hostuserdata)
  
          for (let i=0; i<hostresults?.hostAppointments.length; i++){
  
            if(hostprofiledata[hostresults?.hostAppointments[i]._hostUserId]){
              hostresults.hostAppointments[i].address = hostprofiledata[hostresults.hostAppointments[i]._hostUserId]?.address
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
              isDraggable: true
            }
  
            newevents.push(instance)
          }
  
          console.log("host events", newevents)
  
          setDriverAppointments([...newevents])
        }
      }
  
      if(currentDate && auth.userId && value === "1"){
        driverAppointments()
      }
  
    }, [currentDate, auth, value])

    
    


  return (

    <div style={{height:'100svh', width:'100svw'}} 
                className="bg-white bg-center max-w-full
                    flex flex-col fixed w-full">

    <MainHeader 
        loggedUserId={auth.userId} loggedUsername={auth.username} 
        profilePicURL={auth.profilePicURL} roles={auth.roles}
    />

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

          <p>Received Bookings From Other EV Drivers</p>

          <div className='pt-1 pb-4 flex flex-col gap-y-3'>

              <LocalizationProvider dateAdapter={AdapterDayjs}>

                  <DatePicker
                    value={dayjs(bookingStart)}
                    onChange={(newValue) => setBookingStart(dayjs(new Date(newValue)))}
                    />

              </LocalizationProvider>

              <button className='border border-gray-300 px-3 py-2 rounded-xl bg-[#c1f2f5] 
                hover:bg-[#00D3E0]'

                onClick={(e)=>handleAddAppointment(e)}>
                Update
              </button>

            </div>

          <div className='flex flex-col w-full overflow-y-scroll'>

                <div className='flex flex-col'>

                  {hostAppointments?.map(booking => (

                      `https://maps.googleapis.com/maps/api/staticmap?center=${selectedAddress}&zoom=14&size=300x300&markers=color:yellow%7C${selectedLat},${selectedLng}&maptype=roadmap&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
                  ))}

                </div>

                
                <div className='pt-1 pb-4 flex flex-col gap-y-3'>

                    <p className='text-lg text-center pt-4 pb-2'>Location Schedule</p>

                    <DnDCalendar

                      style={{ height: "500px" }}

                      date={date}
                      defaultView="day"
                      events={hostEvents}
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
                            backgroundColor: "lightgrey",
                            color: 'black',
                            borderRadius: "0px",
                            border: "none"
                          };
                    
                          if (event.requesterId === auth.userId){
                            newStyle.backgroundColor = "#FFE142"
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
          

          </TabPanel>

          <TabPanel style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '0px',
              display:'flex', flexDirection: 'column', width: '100%'}} value="1">        

            <img className='w-[200px] h-[200px]' src={`https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=14&size=200x200&maptype=roadmap
                    &markers=color:blue%7Clabel:S%7C40.702147,-74.015794&markers=color:green%7Clabel:G%7C40.711614,-74.012318
                    &markers=color:red%7Clabel:C%7C40.718217,-73.998284&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} />

          </TabPanel>

          </TabContext>
          </div>
        </div>
    )
  }

  export default BookingsPage