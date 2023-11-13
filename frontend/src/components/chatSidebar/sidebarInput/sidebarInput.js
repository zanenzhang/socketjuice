import React, { useState, useRef, useMemo, useEffect } from "react";
import useAuth from "../../../hooks/useAuth";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Popover from '@mui/material/Popover';
import debounce from 'lodash.debounce'
import List from '@mui/material/List';

import GroupInviteMenuItem from "./groupInviteMenuItem";
import SingleInviteMenuItem from "./singleInviteMenuItem";
import SearchMenuItem from "./searchMenuItem";

import addChat from "../../../helpers/Chats/addChat";
import { Divider } from "@mui/material";

const SidebarInput = ({loggedUserId, loggedUsername, chatsList, 
    setChatsList, changedData, setChangedData, setSelectedChat,
    drawerState, setDrawerState}) => {

  const usernameRef = useRef();  
  const usernameModalRef = useRef();
  const {auth} = useAuth();
  
  const boxStyle = {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 360,
    padding: 2,
    display: "flex",
    flexDirection: "column",
    height: '75vh',
    bgcolor: 'background.paper',
    border: '2px solid #8BEDF3',
    boxShadow: 24,
    borderRadius: '10px',
  };

  const [openModal, setOpenModal] = useState(false);
  
  const handleOpenModal = () => {
    setOpenPopover(false);
    setAnchorEl(null);
    setOpenModal(true); 
    setDrawerState({ ...drawerState, ['left']: false });
  }
     
  const handleCloseModal = () => {
    setOpenPopoverModal(false);
    setAnchorElModal(null);
    setOpenModal(false);
    setGroupDisplay([]);
    setInvitedList([{_userId: loggedUserId, username: loggedUsername}])
  }

  const [openPopover, setOpenPopover] = useState(false);
  const [openPopoverModal, setOpenPopoverModal] = useState(false);

  const [alreadyChattingModal, setAlreadyChattingModal] = useState(false);
  const [currentChatModal, setCurrentChatModal] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElModal, setAnchorElModal] = useState(null);

  function handleClosePopover() {
      setOpenPopover(false) 
  };

  function handleClosePopoverModal() { 
      setOpenPopoverModal(false)
  };

    const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{4,48}$/;
    
    const [username, setUsername] = useState("");
    const [usernameModal, setUsernameModal] = useState("");
    const [newChatDisable, setNewChatDisable] = useState(false);

    const [users, setUsers] = useState("");
    const [usersModal, setUsersModal] = useState("");

    const [invitedList, setInvitedList] = useState([{_userId: loggedUserId, username: loggedUsername}]);
    const [groupDisplay, setGroupDisplay] = useState([]);
    
    const [validUsername, setValidUsername] = useState(false);
    const [validUsernameModal, setValidUsernameModal] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);
    const [usernameModalFocus, setUsernameModalFocus] = useState(false);

    const changeHandler = (event) => {
      setUsername(event.target.value);
    };

    const changeHandlerModal = (event) => {
      setUsernameModal(event.target.value);
    };

  const debouncedChangeHandler = useMemo(
      () => debounce(changeHandler, 500)
    , [username]);

    const debouncedChangeHandlerModal = useMemo(
      () => debounce(changeHandlerModal, 500)
    , [usernameModal]);

  useEffect(() => {
      setValidUsername(USERNAME_REGEX.test(username))
  },[username])

  useEffect( () => {

    if(chatsList.userChats?.length > 30){

      setNewChatDisable(true);
    
    } else {
      setNewChatDisable(false);
    }

  }, [chatsList?.userChats])

  useEffect(() => {
    setValidUsernameModal(USERNAME_REGEX.test(usernameModal))
  },[usernameModal])


  useEffect( ()=> {

    if(users.length > 0){
      setAnchorEl(usernameRef.current);  
      setOpenPopover(true);
    }

  }, [users])


  useEffect( ()=> {

    if(usersModal.length > 0){
        setAnchorElModal(usernameModalRef.current);
        setOpenPopoverModal(true)
    }

  }, [usersModal])

  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      debouncedChangeHandlerModal.cancel();
    }
  }, []);

  useEffect( ()=> {

    if(invitedList){
    
      invitedList.sort((a,b) => a.username > b.username ? 1 : -1);

      if(chatsList?.userChats){

        for(let i=0; i< chatsList?.userChats.length; i++){

           let item = chatsList.userChats[i]

            if(item.participants.length === invitedList.length){

              let checklist1 = JSON.stringify(item.participants.map(e=>e._userId));
              let checklist2 = JSON.stringify(invitedList.map(e=>e._userId));

              if(checklist1 === checklist2){
                setAlreadyChattingModal(true);
                setCurrentChatModal(item._id);
                break;
              
              } else {
                setAlreadyChattingModal(false);
              }

            } else {
              setAlreadyChattingModal(false);
            }
        }
      }
    }

  }, [invitedList.length])


async function handleNewGroupChat(){

  if(alreadyChattingModal){

      setSelectedChat(currentChatModal)
      setDrawerState({ ...drawerState, ['left']: false });
      setChangedData(!changedData)
      setInvitedList([{_userId: loggedUserId, username: loggedUsername}])
      setGroupDisplay([])
      handleCloseModal()
  
  } else {

      invitedList.sort((a,b) => a.username > b.username ? 1 : -1);

      const added = await addChat(invitedList, loggedUserId, auth.accessToken);

      if(added?.savedNew){

          setSelectedChat(added?.savedNew._id);
          setDrawerState({ ...drawerState, ['left']: false });
          setChangedData(!changedData);
          setInvitedList([{_userId: loggedUserId, username: loggedUsername}]);
          setGroupDisplay([])
          handleCloseModal();
      }    
  }
}


  return (
    
    <div className="bg-white w-full h-[7vh] sm:h-[6vh] md:[h-5vh] flex items-center justify-items-center pl-4 pr-2">
      
      <input 
          type="text" 
          placeholder="Search followers" 
          className="box-border border-2 m-2 w-4/5 h-12 
            pl-4 rounded-2xl focus:outline-[#8BEDF3]"
          ref={usernameRef}
          onChange={ debouncedChangeHandler }
          aria-invalid={validUsername ? "false" : "true"}
          aria-describedby="usernamenote"
          onFocus={() => setUsernameFocus(true)}
          onBlur={() => setUsernameFocus(false)}
          disabled={newChatDisable}
          />

          <Popover
            open={openPopover}
            anchorEl={anchorEl}
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
              maxHeight: 300
          }}>
          
          { (users) ?
          
          users.map( (user) => <SingleInviteMenuItem  
              key={user._id} followerUsername={user.username} followerUserId={user._id} 
              loggedUserId={loggedUserId} loggedUsername={loggedUsername}
              followerUserProfilePicURL={user.profilePicURL}
              handleClosePopover={handleClosePopover} 
              chatsList={chatsList} setChatsList={setChatsList}
              setSelectedChat={setSelectedChat}
              changedData={changedData} setChangedData={setChangedData}
              drawerState={drawerState} setDrawerState={setDrawerState}
              /> )

          : null }

          </List> 
          
          </Popover>


        <div className="items-center justify-items-center">
        <button onClick={handleOpenModal} className=" rounded-3xl hover:bg-purple-100 mr-4">
        <svg
          viewBox="0 0 1024 1024"
          fill="#8BEDF3"
          height="2em"
          width="2em"
        >
          <path d="M892 772h-80v-80c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v80h-80c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h80v80c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-80h80c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM373.5 498.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 01-38.7-95.4c.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.8-1.7-203.2 89.2-203.2 200 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204a8 8 0 008 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.8-1.1 6.4-4.8 5.9-8.8zM824 472c0-109.4-87.9-198.3-196.9-200C516.3 270.3 424 361.2 424 472c0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 00-86.4 60.4C357 742.6 326 814.8 324 891.8a8 8 0 008 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5C505.8 695.7 563 672 624 672c110.4 0 200-89.5 200-200zm-109.5 90.5C690.3 586.7 658.2 600 624 600s-66.3-13.3-90.5-37.5a127.26 127.26 0 01-37.5-91.8c.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4-.1 34.2-13.4 66.3-37.6 90.5z" />
        </svg>
        </button>
      </div>
    
    <Modal
    open={openModal}
    onClose={handleCloseModal}
    aria-labelledby="modal-modal-title"
    aria-describedby="modal-modal-description"
  >
    <Box sx={boxStyle} style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px'}}>

      <div className="h-full">
      
      <div className="items-center justify-center w-full h-1/4">
      <p className="text-center text-lg text-semibold">{`Create Group Chat (Max 10 People)`} </p>
      
      <input
        placeholder="Search followers"
        className="w-full h-12 mt-5 border-box border-2 p-4 
        rounded-2xl focus:outline-[#8BEDF3]"
        ref={usernameModalRef}
        onChange={ debouncedChangeHandlerModal }
        aria-invalid={validUsernameModal ? "false" : "true"}
        aria-describedby="usernamemodalnote"
        onFocus={() => setUsernameModalFocus(true)}
        onBlur={() => setUsernameModalFocus(false)}
        disabled={newChatDisable}
        />
      
            <Popover
                  open={openPopoverModal}
                  anchorEl={anchorElModal}
                  onClose={handleClosePopoverModal}
                  anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                  }}
                  >

              <List sx={{
                  bgcolor: 'background.paper',
                  position: 'relative',
                  overflow: 'auto',
                  maxHeight: 300
              }}>
              
              { (usersModal) ?
              
              usersModal.map( (user) => <SearchMenuItem  
                  key={user._id} followerUsername={user.username} loggedUserId={loggedUserId}
                  loggedUsername={loggedUsername} 
                  followerUserId={user._id} followerProfilePicURL={user.profilePicURL}
                  invitedList={invitedList} setInvitedList={setInvitedList}
                  groupDisplay={groupDisplay} setGroupDisplay={setGroupDisplay}
                  /> )

              : null }

              </List> 
              
              </Popover>
      
      </div>

      <div className="h-3/5">
      
      <p className="text-lg text-semibold">Invitees</p>
      <Divider className="pt-2"/>
      <div className="overflow-y-auto">

      <List sx={{
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'auto',
            maxHeight: 300
        }}>

        {(groupDisplay) ? 
        
            groupDisplay.map( (user) => 
            
            ( user._userId !== loggedUserId &&
            <GroupInviteMenuItem  
            key={user._userId} followerUsername={user.username} loggedUserId={loggedUserId}
            followerUserId={user._id} followerProfilePicURL={user.profilePicURL}
            invitedList={invitedList} setInvitedList={setInvitedList}
            groupDisplay={groupDisplay} setGroupDisplay={setGroupDisplay}
            /> ))

        : null }
        
        </List>

      </div>
      </div>

        <div className="flex items-end h-1/6">
      <button 
        className="w-full h-12  bg-[#fadeeb] text-black rounded-2xl hover:bg-[#8BEDF3] hover:text-white"
        onClick={handleNewGroupChat}
        disabled={newChatDisable}
        >
        {!alreadyChattingModal ? "Start Group Chat" : "Go To Group Chat" }
      </button>
      </div>

      </div>

    </Box>
  </Modal>
  </div>
  );
};

export default SidebarInput;
