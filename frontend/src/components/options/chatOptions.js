import React, {useState, useEffect, useMemo, useRef} from 'react';
import useAuth from '../../hooks/useAuth';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Popover from '@mui/material/Popover';
import debounce from 'lodash.debounce';
import List from '@mui/material/List';
import AddUserMenuItem from "./addUserMenuItem";
import { DEFAULT_IMAGE_PATH } from '../../constants/paths';

import addUserToChat from '../../helpers/Chats/addUserToChat';
import removeUserFromChat from '../../helpers/Chats/removeUserFromChat';


export default function ChatOptions({chatId, loggedUserId, loggedUsername,
    chatsList, changedData, setChangedData, participants, setSelectedChat,
    drawerState, setDrawerState }) {

const { auth } = useAuth();
const [anchorElMain, setAnchorElMain] = useState(null);
  const [anchorElPop, setAnchorElPop] = useState(null);
  const [openPopover, setOpenPopover] = useState(false);
  const usernameRef = useRef();  

  const [openMenu, setOpenMenu] = useState(false);
  const [openChildAdd, setOpenChildAdd] = useState(false);
  const [openChildLeave, setOpenChildLeave] = useState(false);
  
  const [users, setUsers] = useState("");
  const [alreadyChatting, setAlreadyChatting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [validUsername, setValidUsername] = useState(false);
  const [tempParticipants, setTempParticipants] = useState([]);
  const [usernameFocus, setUsernameFocus] = useState(false);

  var waiting = false;

  const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{4,48}$/;
    
    const [username, setUsername] = useState("");

  function handleClosePopover() {
    setOpenPopover(false)
};

const changeHandler = (event) => {
    setUsername(event.target.value);
  };

  const debouncedChangeHandler = useMemo(
    () => debounce(changeHandler, 500)
  , []);

  useEffect(() => {
    setValidUsername(USERNAME_REGEX.test(username))
},[username])


useEffect( ()=> {

    if(selectedUser && participants){

        var newParticipants = [ ...participants,
            {_userId: selectedUser._userId, 
            username: selectedUser.username}]
    
        newParticipants.sort((a,b) => a.username > b.username ? 1 : -1);
        let check1 = JSON.stringify(newParticipants.map(e=>e._userId))            
    
        for(let i=0; i< chatsList?.userChats?.length; i++){
    
            let item = chatsList.userChats[i]
    
            if(item.participants.length === newParticipants.length){
                let check2 = JSON.stringify(item.participants.map(e=>e._userId))
                if(check1 === check2){
                    setAlreadyChatting(true)
                } else {
                  setTempParticipants(newParticipants)
                }
            } else {
              setTempParticipants(newParticipants)
            }  
        }
    }

}, [selectedUser, participants])


useEffect( ()=> {

    if(users.length > 0){
      setAnchorElPop(usernameRef.current);  
      setOpenPopover(true)
    }

  }, [users])


  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    }
  }, []);

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

  const handleLeaveChat = async () => {
    if(waiting){
      return
    }
    waiting = true;;
    setOpenChildLeave(false);
    setOpenMenu(false);

    const leftChat = await removeUserFromChat(loggedUserId, loggedUsername, chatId, auth.accessToken)

    if(leftChat){
        waiting = false;;
        setSelectedChat("cleared");
        setChangedData(!changedData);
    }
  }


  const handleAddUserToChat = async () => {

    setOpenChildAdd(false);

    if(alreadyChatting){
        setChangedData(!changedData)
        setSelectedChat(chatId)
        setDrawerState({ ...drawerState, ['left']: false });

    } else {

       const addedUser = await addUserToChat(chatId, selectedUser._userId, 
            selectedUser.username, tempParticipants, auth.accessToken, auth.userId) 

        if(addedUser?.status === 200){
            setChangedData(!changedData)
            setSelectedChat(chatId)
        }
    }
  }

  return (
    <React.Fragment>
        
        <div className='flex flex-shrink-0 items-center justify-center cursor-pointer' 
        onClick={(event)=>handleOpenMenu(event)}>

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                strokeWidth="0.5" stroke="#8BEDF3" 
                className="w-10 h-10 mr-4 hover:stroke-1">
                <path strokeLinecap="round" strokeLinejoin="round" 
                d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
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

            <p>Add User</p>

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

            <p>Leave Chat</p>

            </div>

            </button>
        </div>

        </div>

      </Menu>

        <Modal
            open={openChildAdd}
            onClose={handleCloseChildAdd}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
        <Box sx={{ ...menuStyle, width: 350 }}>

            <div className="flex flex-col">

            <label className='text-base font-semibold pl-2 pr-2 py-4'>Add follower to chat:</label>
            
            <div className='flex justify-center items-center'>
            <input 
                type="text" 
                placeholder="Search followers" 
                className="box-border border-2 w-full h-12 
                    pl-4 rounded-2xl focus:outline-[#8BEDF3]"
                ref={usernameRef}
                onChange={ debouncedChangeHandler }
                aria-invalid={validUsername ? "false" : "true"}
                aria-describedby="usernamenote"
                onFocus={() => setUsernameFocus(true)}
                onBlur={() => setUsernameFocus(false)}
                />
            </div>

          <Popover
            open={openPopover}
            anchorEl={anchorElPop}
            onClose={handleClosePopover}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            >

          <List sx={{
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'auto',
              maxHeight: 150
          }}>
          
          { (users) ?
          
          users.map( (user) => <AddUserMenuItem  
              key={user._id} followerUsername={user.username} followerUserId={user._id} 
              loggedUserId={loggedUserId} loggedUsername={loggedUsername}
              followerUserProfilePicURL={user.profilePicURL}
              setSelectedUser={setSelectedUser}
              selectedUser={selectedUser}
              /> )

          : null }

          </List> 
          
          </Popover>

          <List sx={{
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'auto',
            maxHeight: 300
        }}>

        {(selectedUser !== null) && 
        
            <div className='flex flex-row items-center justify-center py-4 flex-shrink-0'>

                <img className="rounded-full h-12 w-12 mr-3"
                    src={selectedUser.profilePicURL}
                    onError={(e) => {
                        e.target.src = DEFAULT_IMAGE_PATH;
                        }}
                />
                <p className='font-md'>{selectedUser.username}</p>

            </div>
            }
        
        </List>

            <div className='flex justify-between pt-2'>
                {!alreadyChatting && <button 
                    className={`align-center mb-4 px-4 py-2 text-[#8BEDF3] 
                    border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                    hover:bg-[#8BEDF3] hover:text-white flex flex-row hover:stroke-white
                    stroke-[#8BEDF3]
                    ${(!selectedUser ) && 'opacity-50' }`}
                    onClick={()=>handleAddUserToChat()}
                    disabled={(!selectedUser )}>

                    <svg xmlns="http://www.w3.org/2000/svg" 
                        fill="none" viewBox="0 0 24 24" 
                        strokeWidth="1.5" stroke="#8BEDF3" className="w-6 h-6 mr-1 stroke-inherit">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    
                    Add
                </button>}

                {alreadyChatting && <button 
                    className={`align-center mb-4 px-4 py-2 text-[#8BEDF3] 
                    border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                    hover:bg-[#8BEDF3] hover:text-white flex flex-row hover:stroke-white
                    stroke-[#8BEDF3]
                    ${(!selectedUser ) && 'opacity-50' }`}
                    onClick={()=>handleAddUserToChat()}
                    disabled={(!selectedUser )}>
                    
                    Go To Chat
                </button>}


                <button 
                    className={`align-center mb-4 px-4 py-2 text-black
                    border-2 rounded-xl border-black bg-white text-base font-semibold
                    hover:bg-orange-200 hover:text-black`}
                    onClick={handleCloseChildAdd}>
                        Cancel
                </button>
            </div>

            </div>
            </Box>
        </Modal>

        <Modal
            open={openChildLeave}
            onClose={handleCloseChildLeave}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...menuStyle, width: 350 }}>

            <div className='flex flex-col items-center justify-center'>
                <p className='text-center pt-4'>Do you want to leave the chat?</p>

                <div className='flex flex-row gap-x-8 py-4'>
                    
                <button 
                    className={`align-center px-4 py-4 text-[#8BEDF3] 
                    border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                    hover:bg-[#8BEDF3] hover:text-white`}
                    onClick={()=>handleLeaveChat()}
                    >
                    Confirm
                </button>
                <button 
                    className={`align-center px-4 py-4 text-black
                    border-2 rounded-xl border-black bg-white text-base font-semibold
                    hover:bg-orange-200 hover:text-black`}
                    onClick={handleCloseChildLeave}>
                        Cancel
                </button>
                </div>
            </div>

            </Box>
        
        </Modal>
        
    </React.Fragment>
  );
}