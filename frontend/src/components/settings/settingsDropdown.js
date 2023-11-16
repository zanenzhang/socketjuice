import React, {useState, useEffect} from "react";
import Tabs from "@material-ui/core/Tabs";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import MainHeader from '../components/mainHeader/mainHeader'
import useAuth from "../hooks/useAuth";

import ChangeProfileMainUser from "./SettingPanels/ProfileOptions/changeProfileMainUser";
import ChangeProfileMainHost from "./SettingPanels/ProfileOptions/changeProfileMainHost";
import ChangePass from "./SettingPanels/ChangePass/changePass";

const useStyles = makeStyles({
  appContainer: {
    display: "flex",
    width: "93vw",
    height: "100vh"
  },

  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%"
  },
  panel: {
    width: "100%"
  },
  tab: {
    '&.Mui-selected': {
      background: '#F3E8FF'
    },
    height: 75
  },
});



export default function SettingsDropdown({loggedUserId, loggedUsername, profilePicURL}) {

  const { auth, setActiveTab } = useAuth();

  useEffect( ()=> {

    setActiveTab("map")

  }, [])

  const [value, setValue] = useState("0");
  const [drawerState, setDrawerState] = useState({
    left: true
  })
  const [loggedUserOrStore, setLoggedUserOrStore] = useState(null)
  const classes = useStyles();
  const tabClasses = {root: classes.tab};

  const handleDrawerOpen = (event) => {

    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
        return;
    }
  
    // toggleDrawer('left', true)
    setDrawerState({ ...drawerState, ['left']: true });
  }
  
  const toggleDrawer = (anchor, open) => (event) => {
    
      setDrawerState({ ...drawerState, [anchor]: open });
    };
  
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const list = (anchor) => (
    <div className="flex flex-grow">
    <Box
        sx={{
            bgcolor: "#fff7fc",
            display: "flex",
            alignItems: 'center',
            height: '100%',
            width: 300,
            fontFamily: "Segoe UI",
        }}
        >
        <div className="w-full">
        <Tabs
            orientation="vertical"
            variant="scrollable"
            value={value}
            onChange={handleChange}
            aria-label="Settings Tabs"
            sx={{ 
                borderRight: 1, 
                borderColor: "divider",
                fontFamily: 'ui-sans-serif',
            }}
            TabIndicatorProps={{style: {background:'#995372'}}}
        >
            <button
                className={`${value === '0' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center`}
                value="0" onClick={(event) => {handleChange(event, "0")}}> 
                <div className="pr-2 pl-4">
                    <svg
                        viewBox="0 0 1024 1024"
                        fill="#995372"
                        height="2em"
                        width="2em"
                        >
                        <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656zM492 400h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zM340 368a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0z" />
                    </svg>
                </div>
                <div className="">
                    <p>Edit Profile</p>
                </div>
            </button>
            <button
                className={`${value === '1' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center`}
                value="1" onClick={(event) => {handleChange(event, "1")}}> 
                <div className="pr-2 pl-4">
                    <svg
                        viewBox="0 0 24 24"
                        fill="#995372"
                        height="2em"
                        width="2em"
                        >
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M18 8h2a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h2V7a6 6 0 1112 0v1zM5 10v10h14V10H5zm6 4h2v2h-2v-2zm-4 0h2v2H7v-2zm8 0h2v2h-2v-2zm1-6V7a4 4 0 10-8 0v1h8z" />
                    </svg>
                </div>
                <div className="">
                    <p>Change Password</p>
                </div>
            </button>
            <button
                className={`${value === '2' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center`}
                value="2" onClick={(event) => {handleChange(event, "2")}}> 
                <div className="pr-2 pl-4">
                <svg
                    viewBox="0 0 512 512"
                    stroke="currentColor"
                    height="2em"
                    width="2em"
                    >
                    <path
                        fill="none"
                        stroke="#995372"
                        strokeMiterlimit={10}
                        strokeWidth={32}
                        d="M248 64C146.39 64 64 146.39 64 248s82.39 184 184 184 184-82.39 184-184S349.61 64 248 64z"
                    />
                    <path
                        fill="none"
                        stroke="#995372"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={32}
                        d="M220 220h32v116"
                    />
                    <path
                        fill="none"
                        stroke="#995372"
                        strokeLinecap="round"
                        strokeMiterlimit={10}
                        strokeWidth={32}
                        d="M208 340h88"
                    />
                    <path stroke="#995372" fill="#995372" d="M248 130a26 26 0 1026 26 26 26 0 00-26-26z" />
                    </svg>
                </div>
                <div className="">
                    <p>General Viewing</p>
                </div>
            </button>
            <button
                className={`${value === '3' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center`}
                value="3" onClick={(event) => {handleChange(event, "3")}}> 
                <div className="pr-2 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" 
                        stroke="#995372" className="w-8 h-8">
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                            />
                    </svg>
                </div>
                <div className="">
                    <p>Blocked Users</p>
                </div>
            </button>
            <button
                className={`${value === '4' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center`}
                value="4" onClick={(event) => {handleChange(event, "4")}}> 
                <div className="pr-2 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="#995372" 
                        className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                </div>
                <div className="">
                    <p>Manage Follows</p>
                </div>
            </button>
            <button
                className={`${value === '5' ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                shadow-inner shadow-[#995372]/30 flex flex-row items-center
                border-b-2 border-solid border-[#995372]/20`}
                value="5" onClick={(event) => {handleChange(event, "5")}}> 
                <div className="pr-2 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="#995372" className="w-8 h-8">
                        <path 
                            strokeLinecap="round" strokeLinejoin="round" 
                            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>
                <div className="">
                    <p>Requests</p>
                </div>
            </button>
        </Tabs>
        </div>
    </Box>
    </div>
  )
  
  return (
    <>
    <section>
    <div style={{height:'100svh'}}
        className="flex flex-col bg-gray-background">

        <MainHeader 
            loggedUserId={loggedUserId} loggedUsername={loggedUsername} 
            profilePicURL={profilePicURL} roles={roles}
            />
        
        <div className='flex flex-col h-[88%] sm:h-full pt-[12vh] sm:pt-[13vh] md:pt-[15vh]'>

            <div className="flex flex-row justify-center pt-4 pb-4 border-b border-[#995372]">

                <div className='flex flex-row items-center justify-center gap-x-4'>
                    <p className='text-2xl font-bold'>Settings Panel</p>
                    <button
                    className='flex flex-row text-[#995372] gap-x-1 p-1 rounded-lg px-2'
                    onClick={(e)=>handleDrawerOpen(e)}
                        >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 18.25H15C14.59 18.25 14.25 17.91 14.25 17.5C14.25 17.09 14.59 16.75 15 16.75H22C22.41 16.75 22.75 17.09 22.75 17.5C22.75 17.91 22.41 18.25 22 18.25Z" fill="#995372"/>
                            <path d="M5 18.25H2C1.59 18.25 1.25 17.91 1.25 17.5C1.25 17.09 1.59 16.75 2 16.75H5C5.41 16.75 5.75 17.09 5.75 17.5C5.75 17.91 5.41 18.25 5 18.25Z" fill="#995372"/>
                            <path d="M22 7.25H19C18.59 7.25 18.25 6.91 18.25 6.5C18.25 6.09 18.59 5.75 19 5.75H22C22.41 5.75 22.75 6.09 22.75 6.5C22.75 6.91 22.41 7.25 22 7.25Z" fill="#995372"/>
                            <path d="M9 7.25H2C1.59 7.25 1.25 6.91 1.25 6.5C1.25 6.09 1.59 5.75 2 5.75H9C9.41 5.75 9.75 6.09 9.75 6.5C9.75 6.91 9.41 7.25 9 7.25Z" fill="#995372"/>
                            <path d="M13 21.25H7C5.28 21.25 4.25 20.22 4.25 18.5V16.5C4.25 14.78 5.28 13.75 7 13.75H13C14.72 13.75 15.75 14.78 15.75 16.5V18.5C15.75 20.22 14.72 21.25 13 21.25ZM7 15.25C6.11 15.25 5.75 15.61 5.75 16.5V18.5C5.75 19.39 6.11 19.75 7 19.75H13C13.89 19.75 14.25 19.39 14.25 18.5V16.5C14.25 15.61 13.89 15.25 13 15.25H7Z" fill="#995372"/>
                            <path d="M17 10.25H11C9.28 10.25 8.25 9.22 8.25 7.5V5.5C8.25 3.78 9.28 2.75 11 2.75H17C18.72 2.75 19.75 3.78 19.75 5.5V7.5C19.75 9.22 18.72 10.25 17 10.25ZM11 4.25C10.11 4.25 9.75 4.61 9.75 5.5V7.5C9.75 8.39 10.11 8.75 11 8.75H17C17.89 8.75 18.25 8.39 18.25 7.5V5.5C18.25 4.61 17.89 4.25 17 4.25H11Z" fill="#995372"/>
                        </svg>

                        More Options
                    </button>
                </div>
            </div>
            
            <div className='overflow-auto 
                     h-full flex flex-row
                    justify-center'>

                <Box className={classes.appContainer}>
                    <TabContext value={value}>  

                        <Box className={classes.container}>

                          <TabPanel value="0" className={classes.panel}>
                              <ChangeProfileMainUser />
                          </TabPanel>

                          <TabPanel value="1" className={classes.panel}>
                              <ChangeProfileMainHost />
                          </TabPanel>

                          <TabPanel value="2" className={classes.panel}>
                              <ChangePass />
                          </TabPanel>

                        </Box>

                    </TabContext>
                </Box>
            </div>

        </div>
    </div>

    <SwipeableDrawer
          anchor={'left'}
          open={drawerState['left']}
          onClose={toggleDrawer('left', false)}
          onOpen={toggleDrawer('left', true)}
      >
          {list('left')}
    </SwipeableDrawer>
   
    </section>

    </>
  )
}