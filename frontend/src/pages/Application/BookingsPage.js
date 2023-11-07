import React, { useRef, useState, useEffect } from 'react';
import { Scheduler } from "@aldabil/react-scheduler";

import { TextField, Button, DialogActions } from "@mui/material";
import MainHeader from '../../components/mainHeader/mainHeader';
import useAuth from '../../hooks/useAuth';
import Tab from "@material-ui/core/Tab";
import Box from '@mui/material/Box';
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";  

import "./mappage.css";

const CustomEditor = ({ scheduler }) => {
  const event = scheduler.edited;

  // Make your own form/state
  const [state, setState] = useState({
    title: event?.title || "",
    description: event?.description || ""
  });

  const [error, setError] = useState("");

  const handleChange = (value, name) => {
    setState((prev) => {
      return {
        ...prev,
        [name]: value
      };
    });
  };
  const handleSubmit = async () => {
    // Your own validation
    if (state.title.length < 3) {
      return setError("Min 3 letters");
    }

    try {
      scheduler.loading(true);

      /**Simulate remote data saving */
      const added_updated_event = (await new Promise((res) => {
        /**
         * Make sure the event have 4 mandatory fields
         * event_id: string|number
         * title: string
         * start: Date|string
         * end: Date|string
         */
        setTimeout(() => {
          res({
            event_id: event?.event_id || Math.random(),
            title: state.title,
            start: scheduler.state.start.value,
            end: scheduler.state.end.value,
            description: state.description
          });
        }, 3000);
      }))

      scheduler.onConfirm(added_updated_event, event ? "edit" : "create");
      scheduler.close();
    } finally {
      scheduler.loading(false);
    }
  };

  return (
    <div>
      <div style={{ padding: "1rem" }}>
        <p>Load your custom form/fields</p>
        <TextField
          label="Title"
          value={state.title}
          onChange={(e) => handleChange(e.target.value, "title")}
          error={!!error}
          helperText={error}
          fullWidth
        />
        <TextField
          label="Description"
          value={state.description}
          onChange={(e) => handleChange(e.target.value, "description")}
          fullWidth
        />
      </div>
      <DialogActions>
        <Button onClick={scheduler.close}>Cancel</Button>
        <Button onClick={handleSubmit}>Confirm</Button>
      </DialogActions>
    </div>
  );
};

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

          <Scheduler
                className="flex flex-start"
                events={EVENTS}
                view="day"
                day={{
                  startHour: 5, 
                  endHour: 24, 
                  step: 15,
                  navigation: true
                  }}
                week={null}
                month={null}
                disableViewNavigator={false}
                onSelectedDateChange={(e)=>console.log(e)}
                editable={false}
                deletable={false}
                eventRenderer={({ event, ...props }) => {
                  
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          height: "425px",
                          background: "#757575"
                        }}
                        {...props}
                      >
                        <div
                          style={{ height: 120, background: "#ffffffb5", color: "black" }}
                        >
                          {event.start.toLocaleTimeString("en-US", {
                            timeStyle: "short"
                          })}
                        </div>
                        <div>{event.title}</div>
                        <div
                          style={{ height: 120, background: "#ffffffb5", color: "black" }}
                        >
                          {event.end.toLocaleTimeString("en-US", { timeStyle: "short" })}
                        </div>
                      </div>
                    );
                  
                }}
                fields={[
                  {
                    name: "comments",
                    type: "input",
                    default: "Comments",
                    config: { label: "Comments / Directions", required: false }
                  }
                ]}
                // customEditor={(scheduler) => <CustomEditor scheduler={scheduler} />}
                viewerExtraComponent={(fields, event) => {
                  return (
                    <div>
                      <p>Useful to render custom fields...</p>
                      <p>Description: {event.description || "Nothing..."}</p>
                    </div>
                  );
                }}
              />

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