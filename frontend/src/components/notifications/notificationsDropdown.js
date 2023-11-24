import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import useLogout from '../../hooks/useLogout';
import socketIO from "socket.io-client";

import getNotifications from '../../helpers/Notifications/getNotifications';
import NotificationItem from './notificationItem';
import editOpenedAlert from '../../helpers/Notifications/editOpenedAlert';


export default function NotificationsDropdown() {
 
  const { auth, socket, setSocket, setNewMessages, setNewRequests } = useAuth()

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [waiting, setWaiting] = useState(false);
  var openMenu = Boolean(anchorEl);
  
  const [newAlerts, setNewAlerts] = useState(false);
  const [notiPageNumber, setNotiPageNumber] = useState(10);
  const [notiScrollStop, setNotiScrollStop] = useState(false);
  
  const [notiItems, setNotiItems] = useState([]);
  const logout = useLogout();
  const ENDPOINT = process.env.REACT_APP_CLIENT; 

  
  useEffect ( ()=> {

    async function getNotiData(){

      const notis = await getNotifications(auth.userId, notiPageNumber, auth.accessToken)

      if(notis){

        if(notis.status === 403){

          logout();
        }

        if(notis.data?.settings?.newAlerts === true){
        
          setNewAlerts(true);
  
        } else if (notis.data?.settings?.newAlerts === false){
  
          setNewAlerts(false);
        }
  
        if(notis.data?.settings?.newMessages === true){
  
          setNewMessages(true);
  
        } else if(notis.data?.settings?.newMessages === false){
  
          setNewMessages(false);
        }

        if(notis.data?.settings?.newRequests === true){
  
          setNewRequests(true);
  
        } else if(notis.data?.settings?.newRequests === false){
  
          setNewRequests(false);
        }
  
        if(notis.data?.stop === 1){
  
          setNotiScrollStop(true);
        
        } else {
  
          setNotiPageNumber(notiPageNumber + 10)
        }

        let userDataHash = {}

        for(let i=0; i < notis.data?.userData?.length; i++){

          if(userDataHash[notis.data?.userData[i]._id] === undefined){
            userDataHash[notis.data?.userData[i]._id] = notis.data?.userData[i]
          }
        }
  
        for(let i=0; i < notis.data?.notiData?.length; i++){

          if(userDataHash[notis.data?.notiData[i]._otherUserId] !== undefined){
              notis.data.notiData[i].userInfo = userDataHash[notis.data?.notiData[i]._otherUserId]
          }
        }  

        setNotiItems(notis?.data?.notiData)
      } 
    }

    if(auth?.userId && auth.accessToken){
      getNotiData();
    }
    
    if(auth?.accessToken){
      setSocket(socketIO.connect(ENDPOINT, {
        path:'/mysocket',
        query: `token=${auth.accessToken}`
      }))
    }
    
  }, [auth.accessToken, auth.userId])


  useEffect( ()=> {

    if(Object.keys(socket).length > 0){

      socket.emit("setup", {userId: auth.userId});
    
      socket.on("connected", () => {
        console.log("Connected")
      });

      socket.on("linkedNotis", () => {
        console.log("Notification link is connected!")
      });
  
      socket.on("newNotification", (noti) => {        
        setNotiItems([...notiItems, noti]);
      })
    }

  }, [socket])


  async function handleScroll(e) {
        
    if(!waiting && !notiScrollStop){

        setWaiting(true);

        let element = e.target;
        if (element.scrollBottom === 0) {

            const prevNotis = await getNotifications(auth.userId, notiPageNumber)

            if(prevNotis.stop === 1){

                setNotiScrollStop(true);
            
            } else {

                setNotiPageNumber(notiPageNumber + 10);
            }

            for(let i=0; i < prevNotis.notiData?.length; i++){

              for(let j=0; j < prevNotis.userData?.length; j++){
      
                if(prevNotis.notiData[i]._otherUserId === prevNotis.userData[j]._id){
      
                  prevNotis.notiData[i].userInfo = prevNotis.userData[j];
                }
              }
            }

            var appointmentData = {}
            var messageData = {}

            for (let i=0; i<prevNotis.relatedAppointments?.length; i++){

              if(appointmentData[prevNotis.relatedAppointments[i]._id] === undefined){
                appointmentData[prevNotis.relatedAppointments[i]._id] = prevNotis.relatedAppointments[i]
              }
            }

            for (let i=0; i<prevNotis.relatedMessages?.length; i++){
              if(messageData[prevNotis.relatedMessages[i]._id] === undefined){
                messageData[prevNotis.relatedMessages[i]._id] = prevNotis.relatedMessages[i]
              }
            }

            for (let i=0; i<prevNotis.notiData?.length; i++){

              if(prevNotis.notiData[i]._relatedMessage){
                prevNotis.notiData[i].message = messageData[prevNotis.notiData[i]._relatedMessage]
              }

              if(prevNotis.notiData[i]._relatedAppointment){
                prevNotis.notiData[i].appointment = messageData[prevNotis.notiData[i]._relatedAppointment]
              }
            }
            
            setNotiItems([...prevNotis.notiData, ...notiItems]);

            element.scroll(0, -100);
          }
        }
        setWaiting(false)
    }

  const handleClick = (event) => {
    if(!auth.userId){
      navigate('/map');
      return
    }
    setAnchorEl(event.currentTarget);
    editOpenedAlert(auth.userId, auth.accessToken);
    setNewAlerts(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (
    <>
      <div className='flex flex-col items-center justify-center'>

      {newAlerts ? 

      (
        <button type="button" title='Notification Dropdown' 
        onClick={(event)=>handleClick(event)}
          onKeyDown={(event) => {
            if (event.key === "Enter"){
                
            }
        }}>

      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill='#FFE142' viewBox="0 0 24 24" 
        strokeWidth={1} 
        stroke="#FFE142" 
        className="mx-2 h-7 md:h-8 sm:mx-3 text-black-light animate-pulse
        cursor-pointer transform transition duration-300 hover:scale-125" 
      >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" 
      />
      </svg>

      </button>)

      :

      (
        <button type="button" title='Notification Dropdown' 
        onClick={(event)=>handleClick(event)}
        onKeyDown={(event) => {
            if (event.key === "Enter"){
                
            }
        }}
        >
      <svg 
          className="mx-2 h-7 md:h-8 sm:mx-3 text-black-light 
          cursor-pointer transform transition duration-300 hover:scale-125" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="#FFE142" viewBox="0 0 24 24" 
          strokeWidth={1} 
          stroke="black"
      >
      <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
      </svg>

      </button>
      )
      }

      </div>

      <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={openMenu}
          onClose={()=>handleClose()}
          style={{zIndex: 10000}}
          PaperProps={{
            style: {  
              width: 350,  
              maxHeight: 300,
              minHeight: 200, 
              overflow: 'auto',
              borderRadius: '10px',
            },
            elevation: 1,
            sx: {
              overflow: 'visible',
              borderRadius: '10px',
              border: 1,
              borderColor: '#00D3E0',
              // filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >

      <p className="mt-0 mb-2 pl-4 pt-1 text-lg font-bold text-[#00D3E0]">Notifications</p>

      <Divider />

      <div key={"notiContainer"} className='flex flex-col h-30 overflow-y-auto' onScroll={ handleScroll}>

        {notiItems ? notiItems.map((noti) => (

          <div key={noti._id} className='w-full'>
              <NotificationItem notiLine={noti} loggedUserId={auth.userId} />
          </div>

        )) : null}

      </div> 

      </Menu>   
    
    </>
  ) 
}