import React, {useState, useEffect, useMemo, useRef} from 'react';
import useAuth from '../../hooks/useAuth';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Popover from '@mui/material/Popover';
import debounce from 'lodash.debounce';
import List from '@mui/material/List';
import { DEFAULT_IMAGE_PATH } from '../../constants/paths';

import addUserToChat from '../../helpers/Chats/addUserToChat';
import removeUserFromChat from '../../helpers/Chats/removeUserFromChat';


export default function AppointmentOptions({appointmentId, loggedUserId, loggedFirstName,
    drawerState, setDrawerState }) {

const { auth, setSelectedChat } = useAuth();
const [anchorElMain, setAnchorElMain] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const [waiting, setWaiting] = useState(false)

  const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{4,48}$/;
    
  const menuStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 350,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
    borderRadius: '25px'
};
  
  const handleOpenMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenMenu(true);
    setAnchorElMain(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpenMenu(false);
    setAnchorElMain(null);
  };

  const handleOpenChildAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedUser(null);
    setOpenMenu(false);
    setOpenChildAdd(true);
  };

  const handleCloseChildAdd = () => {
    setOpenChildAdd(false);
  };

  const handleOpenChildLeave = () => {
    setOpenChildLeave(true);
  }

  const handleCloseChildLeave = () => {
    setOpenChildLeave(false);
    setOpenMenu(false);
  }
  
  return (
    <React.Fragment>
        
        <div className='flex flex-shrink-0 items-center justify-center cursor-pointer' 
        onClick={(event)=>handleOpenMenu(event)}>

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
            strokeWidth="0.5" stroke="currentColor" 
            className="w-8 h-8 mr-4 hover:stroke-1">
            <path strokeLinecap="round" strokeLinejoin="round" 
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
            
        </div>

      <Menu
        anchorEl={anchorElMain}
        id="account-menu"
        open={openMenu}
        onClose={()=>handleCloseMenu()}
        PaperProps={{
        style: {  
            width: 200,  
            maxHeight: 200,
            },
          elevation: 0,
          sx: {
            overflow: 'auto',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
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
        <div className='flex flex-col w-[200px'>
            

        <div className='flex flex-row'>
            <button 
                className='h-12 hover:bg-gray-200 pl-4 pt-2 pb-2 
                    w-full flex items-center'
                onClick={(event)=> handleOpenChildAdd(event)}
              >

            <div className='flex flex-row items-center'>
            
            <svg xmlns="http://www.w3.org/2000/svg" 
                fill="none" viewBox="0 0 24 24" 
                strokeWidth="1.5" stroke="#8BEDF3" className="w-6 h-6 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <p>Add Flag</p>

            </div>

            </button>
        </div>
        
        <div className='flex flex-row'>
            <button 
                className='h-12 hover:bg-gray-200 px-4 pt-2 pb-2 
                    w-full flex items-center'
                onClick={(event)=> handleOpenChildLeave(event) }
            >

            <div className='flex flex-row items-center'>
            
            <svg
                fill="none"
                stroke="#8BEDF3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                height="1.5em"
                width="1.5em"
                className='mr-2'
                >
                <path stroke="none" d="M0 0h24v24H0z" />
                <path d="M13 12v.01M3 21h18M5 21V5a2 2 0 012-2h7.5M17 13.5V21M14 7h7m-3-3l3 3-3 3" />
                </svg>

            <p>Remove Flag</p>

            </div>

            </button>
        </div>

        </div>

      </Menu>

    </React.Fragment>
  );
}