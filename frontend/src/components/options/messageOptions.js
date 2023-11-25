import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import useAuth from '../../hooks/useAuth';
import removeMessage from '../../helpers/Chats/removeMessage';


const MessageOptions = ({loggedUserId, loggedFirstName, messageUserId, messageId,
    hiddenToggle, setHiddenToggle, userProfilePicURL, chatId, handleRecNameClick}) => {

    const {auth} = useAuth();
    const style = {
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

    const [anchorElMain, setAnchorElMain] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [openChildDelete, setOpenChildDelete] = useState(false);

    const handleOpenMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu(true);
        setAnchorElMain(event.currentTarget);
      };

      const handleCloseMenu = (event) => {
        setOpenMenu(false);
        setAnchorElMain(null);
      };
      
      const handleOpenChildDelete = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu(false);
        setOpenChildDelete(true);
      };
    
      const handleCloseChildDelete = () => {
        setOpenChildDelete(false);
      };
      const handleDeleteMessage = async (event) => {

        if(waiting || hiddenToggle){
            return
        }

        setOpenMenu(false);
        setAnchorElMain(null);

        const deleted = await removeMessage(messageId, chatId, loggedUserId, loggedFirstName, auth.accessToken)
        if(deleted){
            setWaiting(false);
            setHiddenToggle(true);
            setOpenChildDelete(false);
        }
        
      };

    return (

        <>

            <div className="flex flex-col justify-center items-center 
                flex-shrink-0"
            >  
                {(loggedUserId === messageUserId) && 
                <img 
                    src={userProfilePicURL}
                    alt="User Profile Pic"
                    className="w-8 rounded-full hover:cursor-pointer" 
                    onClick={(event)=>handleOpenMenu(event)}
                />}

                {(loggedUserId !== messageUserId) && 
                <img 
                    src={userProfilePicURL}
                    className="w-8 rounded-full hover:cursor-pointer"
                    alt="User Profile Pic"
                    onClick={handleRecNameClick} 
                />}
                
            </div>
        
        {(loggedUserId === messageUserId) && <Menu
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
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        >

        <div className='flex flex-col w-[200px'>
            

        <div className='flex flex-row'>
            <button 
                className='h-12 hover:bg-gray-200 pl-4 pt-2 pb-2 
                    w-full flex items-center'
                onClick={(event)=> handleOpenChildDelete(event)}
                disabled={hiddenToggle || (loggedUserId !== messageUserId)}
              >

            <div className='flex flex-row items-center'>
            
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                strokeWidth="1.5" stroke="#8BEDF3" className="w-6 h-6 mr-2">
                <path strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>


            {!hiddenToggle? <p>Delete Message</p> : <p>Already Deleted</p>}

            </div>

            </button>
        </div>

        </div>

      </Menu>}

      <Modal
            open={openChildDelete}
            onClose={handleCloseChildDelete}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...style, width: 350 }}>

            <div className='flex flex-col items-center justify-center'>
                <p className='text-center pt-4'>Confirm delete message?</p>

                <div className='flex flex-row gap-x-8 py-4'>
                    
                <button 
                    className={`align-center px-4 py-4 text-[#8BEDF3] 
                    border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                    hover:bg-[#8BEDF3] hover:text-white`}
                    onClick={(event)=> handleDeleteMessage(event)}
                    >
                    Confirm
                </button>
                <button 
                    className={`align-center px-4 py-4 text-black
                    border-2 rounded-xl border-black bg-white text-base font-semibold
                    hover:bg-orange-200 hover:text-black`}
                    onClick={handleCloseChildDelete}>
                        Cancel
                </button>
                </div>
            </div>

            </Box>
        
        </Modal>
    
        </>
    )

}

export default MessageOptions