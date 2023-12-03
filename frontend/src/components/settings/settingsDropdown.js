import React, {useState, lazy, Suspense} from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import useAuth from '../../hooks/useAuth';

const SignOutMenuItem = lazy( () => import('./signOutMenuItem'));
const SettingsMenuItem = lazy( () => import('./settingsMenuItem'));
const PaymentsMenuItem = lazy( () => import('./paymentsItem'));
const ReportIssueMenuItem = lazy( () => import('./reportIssueMenuItem'));


export default function SettingsDropdown({loggedUserId, profilePicURL}) {
  
  const {auth} = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  
  const handleClick = (event) => {
    if(!auth.userId){
      navigate('/map');
      return
    }
    event.preventDefault();
    setOpenMenu(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setOpenMenu(false);
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
        
        <div className='flex flex-col items-center'>

          <div className='flex items-center justify-center' 
          onClick={(event)=>handleClick(event)}>

            { (auth.userId && auth.profilePicURL !== '/images/avatars/defaultUserPic.svg') 
            
            ? 
            
            <img src={auth.profilePicURL} className="rounded-full border border-gray-700 mx-1 
              h-7 md:h-8 sm:mx-2 text-black-light 
                cursor-pointer transform transition duration-300 hover:scale-125"/>
            
              :

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
              viewBox="0 0 24 24" strokeWidth="1.5" stroke="#00D3E0" 
              className='mx-1 h-7 md:h-8 text-black-light 
              cursor-pointer transform transition duration-300 hover:scale-125'>
              <path strokeLinecap="round" strokeLinejoin="round" 
              d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            
            }

          </div>

        </div>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={openMenu}
        onClose={(event)=>handleClose(event)}
        onClick={(event)=>handleClose(event)}
        onKeyDown={(event)=>{
          if (event.key === "Tab") {
            event.stopPropagation();
            event.preventDefault()
          }
        }}
        style={{zIndex: 10000}}
        PaperProps={{
        style: {  
            width: 200,  
            maxHeight: 350,
            borderRadius: '10px',
            },
          elevation: 1,
          sx: {
            overflow: 'auto',
            cursor: 'pointer',
            borderRadius: '10px',
            border: 1,
            borderColor: '#8BEDF3',
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
              cursor: 'pointer',
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
        <div className='flex flex-col w-pic h-pic'>

        <div className='flex flex-row'>
          <Suspense fallback={<div>Loading...</div>}>
            <SettingsMenuItem />
          </Suspense>
        </div>

        <div className='flex flex-row'>
          <Suspense fallback={<div>Loading...</div>}>
            <PaymentsMenuItem loggedUserId={loggedUserId} setOpenMenu={setOpenMenu}/>
          </Suspense>
        </div>

        <div className='flex flex-row'>
          <Suspense fallback={<div>Loading...</div>}>
            <ReportIssueMenuItem loggedUserId={loggedUserId} setOpenMenu={setOpenMenu}/>
          </Suspense>
        </div>

        <div className='flex flex-row'>
        <Suspense fallback={<div>Loading...</div>}>
          <SignOutMenuItem />
        </Suspense>
        </div>

        </div>

      </Menu>
    </React.Fragment>
  );
}