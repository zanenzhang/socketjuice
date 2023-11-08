import React, { useRef, useState, useEffect } from 'react';

import { TextField, Button, DialogActions } from "@mui/material";
import MainHeader from '../../components/mainHeader/mainHeader';
import useAuth from '../../hooks/useAuth';
import Tab from "@material-ui/core/Tab";
import Box from '@mui/material/Box';
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";  

import "./mappage.css";


  const BookingsPage = () => {

    const { auth, setActiveTab, socket, setSocket, setNewMessages, setNewRequests } = useAuth();

    const [value, setValue] = useState("0")
    const [waiting, setWaiting] = useState(false);
    const [currentDate, setCurrentDate] = useState("")

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

        if(auth.userId && currentDate){

        }

      }, [auth.userId, currentDate])


      const handleNewDate = () => {



      }

    const EVENTS = [
      {
        event_id: 1,
        title: "Event 1",
        start: new Date(new Date(new Date().setHours(9)).setMinutes(0)),
        end: new Date(new Date(new Date().setHours(10)).setMinutes(0)),
        disabled: true,
        admin_id: [1, 2, 3, 4]
      },
      {
        event_id: 2,
        title: "Event 2",
        start: new Date(new Date(new Date().setHours(10)).setMinutes(0)),
        end: new Date(new Date(new Date().setHours(12)).setMinutes(0)),
        admin_id: 2,
        color: "orange"
      },
      {
        event_id: 3,
        title: "Event 3",
        start: new Date(new Date(new Date().setHours(11)).setMinutes(0)),
        end: new Date(new Date(new Date().setHours(12)).setMinutes(0)),
        admin_id: 1,
        editable: false,
        deletable: false
      },
      {
        event_id: 4,
        title: "Event 4",
        start: new Date(
          new Date(new Date(new Date().setHours(9)).setMinutes(30)).setDate(
            new Date().getDate() - 2
          )
        ),
        end: new Date(
          new Date(new Date(new Date().setHours(11)).setMinutes(0)).setDate(
            new Date().getDate() - 2
          )
        ),
        admin_id: 2,
        color: "yellow"
      },
      {
        event_id: 5,
        title: "Event 5",
        start: new Date(
          new Date(new Date(new Date().setHours(10)).setMinutes(30)).setDate(
            new Date().getDate() - 2
          )
        ),
        end: new Date(
          new Date(new Date(new Date().setHours(14)).setMinutes(0)).setDate(
            new Date().getDate() - 2
          )
        ),
        admin_id: 2,
        editable: true
      },
    ];

    //Make call for static map urls


  
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