import React, { useRef, useState, useEffect, useMemo } from 'react';
import useAuth from '../../../hooks/useAuth';

import Box from "@material-ui/core/Box";
import Popover from '@mui/material/Popover';
import { makeStyles } from "@material-ui/core";
import debounce from 'lodash.debounce'
import List from '@mui/material/List';
import FollowerListMenuItem from './followerListMenuItem'
import FollowingListMenuItem from './followingListMenuItem'
import FollowSearchMenuItem from './followSearchMenuItem';
import SubmittedListMenuItem from './submittedListMenuItem';
import Divider from '@mui/material/Divider';

import getUsersPrefixElastic from "../../../helpers/UserData/getUsersPrefixElastic";
import getFollowSettings from '../../../helpers/Follow/getFollowSettings';

const useStyles = makeStyles({
  appContainer: {
    display: "flex",
    width: "93vw",
    height: "100vh"
  },

  container: {
    display: "flex",
    height: "100%",
    width: "100%"
  },
  panel: {
    width: "100%"
  }
});

export default function ChangeFollows({loggedUserId, loggedUsername, loggedUserOrStore}) {
    
    const {auth} = useAuth();
    const classes = useStyles();
    const usernameRef = useRef();
    const [changedData, setChangedData] = useState(false);
    const [openPopover, setOpenPopover] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpenPopover = (event) => {
        setAnchorEl(usernameRef.current);
    };

    const handleClosePopover = () => {
        setOpenPopover(false)
    };

    const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{0,16}$/;
    
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState("");
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [submittedList, setSubmittedList] = useState([]);

    const [validUsername, setValidUsername] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);
    
    const changeHandler = (event) => {
        let shortened = ""
        if(event.target.value > 16){
            shortened = event.target.value?.slice(0, 16)
        } else {
            shortened = event.target.value
        }
        setUsername(shortened);
        handleOpenPopover(event);
      };

    const debouncedChangeHandler = useMemo(
        () => debounce(changeHandler, 500)
      , []);


    useEffect(() => {
        setValidUsername(USERNAME_REGEX.test(username))
    },[username])


    useEffect( () => {

        async function fetchData(){

            const response = await getFollowSettings(loggedUserId, auth.accessToken)
            
            if(response){
                setFollowersList(response.data.followerProfiles)
                setFollowingList(response.data.followingProfiles)
                setSubmittedList(response.data.submitProfiles)
            }
        }

        fetchData();
        
    }, [changedData])

    

    useEffect( () => {

        async function fetchData(){

            if(username.length > 0){
                const response = await getUsersPrefixElastic(username, loggedUsername, auth.accessToken, loggedUserId)
    
                if (response){
                    setUsers(response.data)
                }
            }
        }

        fetchData();

    }, [username])

    useEffect( ()=> {

        if(users.length > 0){
            setOpenPopover(true)
        }

    }, [users])


    useEffect(() => {
        const ele = usernameRef.current
        ele.focus();
    }, [])

    useEffect(() => {
        return () => {
          debouncedChangeHandler.cancel();
        }
      }, []);
  

  return (
    
    <Box
        className={classes.container}
    >
        <div className="flex w-full justify-center pt-3">

        <div className="flex flex-col w-[300px] md:w-[400px]">
            
        <label className='text-lg font-medium pl-2'>Search Users To Follow:</label>
            <input 
                aria-label="Enter username" 
                type="username" 
                ref={usernameRef}
                id="usernameinput"
                placeholder="Enter username"
                className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                    border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                onChange={ debouncedChangeHandler }
                disabled={!validUsername}
                aria-invalid={validUsername ? "false" : "true"}
                aria-describedby="usernamenote"
                onFocus={() => setUsernameFocus(true)}
                onBlur={() => setUsernameFocus(false)}
                required
            />

            <nav aria-label="followers display">
                <Popover
                    open={openPopover}
                    anchorEl={anchorEl}
                    onClose={handleClosePopover}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    disableAutoFocus={true}
                    disableEnforceFocus={true}
                >

                <List sx={{
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300,
                    width: {xs: 300, sm: 350, md: 400},
                }}>
                
                { (users) ?
                
                users
                .filter( (user) => user._id !== loggedUserId)
                .map( (user) => <FollowSearchMenuItem  
                    key={user._id} followingUsername={user.username} loggedUserId={loggedUserId}
                    followingUserId={user._id} followingUserProfilePicURL={user.profilePicURL}
                    followingUsers={followingList} submittedUsers={submittedList} 
                    privacySetting={user.privacySetting} blockedUsers={user.blockedUsers}
                    changedData={changedData} setChangedData={setChangedData} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }

                </List> 
                
                </Popover>

                <Divider className='py-2' />

                <div className='h-[60vh] overflow-auto'>

                <List sx={{
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300
                }}>

                <p className="text-lg font-medium pl-2 py-2">Currently Following:</p>

                {(followingList) ? 
                
                    followingList
                    .filter( (user) => user._id !== loggedUserId)
                    .map( (user) => <FollowingListMenuItem  
                    key={user._id} followingUsername={user.username} loggedUserId={loggedUserId}
                    followingUserId={user._id} followingUserProfilePicURL={user.profilePicURL}
                    privacySetting={user.privacySetting}
                    changedData={changedData} setChangedData={setChangedData} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }
                
                </List>

                <Divider className='py-2' />

                <List sx={{
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300
                }}>

                <p className="text-lg font-medium pl-2 py-2">Pending Follow Requests:</p>

                {(submittedList) ? 
                
                    submittedList
                    .filter(user => user._id !== loggedUserId)
                    .map( (user) => <SubmittedListMenuItem  
                    key={user._id} requestedUsername={user.username} loggedUserId={loggedUserId}
                    requestedUserId={user._id} requestedUserProfilePicURL={user.profilePicURL}
                    privacySetting={user.privacySetting}
                    changedData={changedData} setChangedData={setChangedData} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }
                
                </List>


                <Divider className='py-2'/>

                <List sx={{
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300
                }}>

                <p className="text-lg font-medium pl-2 py-2">Users Following You:</p>

                {(followersList) ? 
                
                    followersList.map( (user) => <FollowerListMenuItem  
                    key={user._id} followerUsername={user.username} loggedUserId={loggedUserId}
                    followerUserId={user._id} followerUserProfilePicURL={user.profilePicURL}
                    followerState={true} changedData={changedData} setChangedData={setChangedData} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }
                
                </List>

                </div>
                
            </nav>

        </div>
    </div>

    </Box>
        
  );
}














