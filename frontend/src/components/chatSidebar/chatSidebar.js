import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";

import SidebarInput from "./sidebarInput/sidebarInput";
import Chatsbar from "./chatsbar/chatsbar";
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

import getUserChats from "../../helpers/Chats/getUserChats";
import PageFooter from "../pageFooter";

const ChatSidebar = ({loggedUserId, loggedUsername, selectedChat, 
    setSelectedChat, chatsList, setChatsList, socketConnected,
    setPageNumber}) => {

  const {auth, setActiveTab} = useAuth();
  const [changedData, setChangedData] = useState(false);
  const [drawerState, setDrawerState] = useState({
    left: true
  });

  useEffect( ()=> {

    async function fetchChatsData(){

      let newChatsList = await getUserChats(loggedUserId, auth.accessToken);

      if(newChatsList){

        let userDataHash = {}

        for(let i=0; i < newChatsList?.userData?.length; i++){

          userDataHash[newChatsList.userData[i]._id] = newChatsList.userData[i]
        }

        if(Object.keys(userDataHash).length !== 0){

          for(let i=0; i < Object.keys(newChatsList?.userChats).length ; i++){

            for (let j=0; j < newChatsList?.userChats[i]?.participants?.length; j++){
              
              let currentId = newChatsList?.userChats[i]?.participants[j]._userId
              
              newChatsList.userChats[i].participants[j].userInfo = userDataHash[currentId]
              
            }
          }
        }
        setChatsList(newChatsList);
      }
    }

    if(loggedUserId){
      fetchChatsData();
      setActiveTab("chat")
    }

  }, [selectedChat, changedData])


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
  setChangedData(!changedData)
}

const toggleDrawer = (anchor, open) => (event) => {
  
    setDrawerState({ ...drawerState, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: 300, height: '100%' }}
      role="chatPresentation"
    >

    <div className="bg-[#fff7fc] h-full pt-[12vh] sm:pt-[13vh] md:pt-[15vh]">
        <div className="h-full w-full overflow-y-auto">
          
          <SidebarInput chatsList={chatsList} setChatsList={setChatsList}
            changedData={changedData} setChangedData={setChangedData} 
            loggedUserId={loggedUserId} loggedUsername={loggedUsername}
            setSelectedChat={setSelectedChat}
            drawerState={drawerState} setDrawerState={setDrawerState}
            />

          <Chatsbar chatsList={chatsList} setChatsList={setChatsList} 
            changedData={changedData} setChangedData={setChangedData} 
            loggedUserId={loggedUserId} loggedUsername={loggedUsername}
            selectedChat={selectedChat} setSelectedChat={setSelectedChat}
            setPageNumber={setPageNumber}
            drawerState={drawerState} setDrawerState={setDrawerState}
          />

          <PageFooter />
          </div>
        </div>
      </Box>
  )

    return (
      <React.Fragment key={'left'}>

          <button onClick={(e)=>handleDrawerOpen(e)} 
            className="flex items-center justify-center w-[7vw] sm:w-[6vw] md:w-[5vw] lg:w-[4vw]
              border-r-2 border-[#f6f6f6] cursor-pointer">

          <div className='flex items-center justify-center'>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H15C20.43 1.25 22.75 3.57 22.75 9V15C22.75 20.43 20.43 22.75 15 22.75ZM9 2.75C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V9C21.25 4.39 19.61 2.75 15 2.75H9Z" fill="#8BEDF3"/>
          <path d="M10.7401 16.2799C10.5501 16.2799 10.3601 16.2099 10.2101 16.0599C9.92005 15.7699 9.92005 15.2899 10.2101 14.9999L13.2101 11.9999L10.2101 8.99991C9.92005 8.70991 9.92005 8.22991 10.2101 7.93991C10.5001 7.64991 10.9801 7.64991 11.2701 7.93991L14.8001 11.4699C15.0901 11.7599 15.0901 12.2399 14.8001 12.5299L11.2701 16.0599C11.1201 16.2099 10.9301 16.2799 10.7401 16.2799Z" fill="#8BEDF3"/>
          </svg>

        </div>
      </button>

      <SwipeableDrawer
          anchor={'left'}
          open={drawerState['left']}
          onClose={toggleDrawer('left', false)}
          onOpen={toggleDrawer('left', true)}
      >
          {list('left')}
      </SwipeableDrawer>
      </React.Fragment>

    );
  
}

export default ChatSidebar;
