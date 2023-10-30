import React, { useRef, useState, useEffect, useMemo } from 'react';
import useAuth from '../../../hooks/useAuth';
import Box from "@material-ui/core/Box";
import Popover from '@mui/material/Popover';
import { makeStyles } from "@material-ui/core";
import debounce from 'lodash.debounce'
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';

import getUserBlocks from '../../../helpers/UserData/getUserBlocks';
import getUsersPrefixElastic from "../../../helpers/UserData/getUsersPrefixElastic";
import BlockedListMenuItem from './blockedListMenuItem'


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

export default function ChangeBlockedList({loggedUserId, loggedUsername, loggedUserOrStore}) {
    
    const {auth} = useAuth();
    const classes = useStyles();
    const usernameRef = useRef();

    const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{0,16}$/;
    
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState("");
    const [blockedList, setBlockedList] = useState([]);
    const [changed, setChanged] = useState(false);

    const [validUsername, setValidUsername] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);
    const [openPopover, setOpenPopver] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpenPopover = (event) => {
        setAnchorEl(usernameRef.current);
    };

    const handleClosePopover = () => {
        setOpenPopver(false)
    };
    
    const changeHandler = (event) => {
        let shortened = ""
        if(event.target.value?.length > 16){
            shortened = event.target.value?.slice(0, 16)
        } else {
            shortened = event.target.value
        }
        setUsername(shortened);
        handleOpenPopover(event)
      };

    const debouncedChangeHandler = useMemo(
        () => debounce(changeHandler, 500), 
    []);

    useEffect(() => {
        setValidUsername(USERNAME_REGEX.test(username))
    },[username])

    useEffect( ()=> {

        if(users.length > 0){
            setOpenPopver(true)
        }

    }, [users])


    useEffect( () => {

        async function fetchData(){

            const response = await getUserBlocks(loggedUserId, auth.accessToken)

            if (response){
                setBlockedList(response.data)
            }
        }

        fetchData();
        
    }, [changed])


    useEffect( () => {

        async function fetchData(){

            if(username.length > 0){

                const response = await getUsersPrefixElastic(username, loggedUsername, auth.accessToken, auth.userId)
    
                if (response){
                    setUsers(response.data)
                }
            }
        }

        fetchData();

    }, [username])

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

        <div className="flex flex-col w-[300px] sm:w-[350px] md:w-[400px]">
        
            <label className='text-lg font-medium pl-2'>Search Users To Block:</label>
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

            <nav aria-label="blockedList display">
                
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
                .map( (user) => <BlockedListMenuItem  
                    key={user._id} blockedUsername={user.username} loggedUserId={loggedUserId}
                    blockedUserId={user._id} blockedUserProfilePicURL={user.profilePicURL}
                    blockedUsers={blockedList} changed={changed} setChanged={setChanged} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }

                </List> 

                </Popover>

                <div className='h-[60vh] overflow-auto'>

                <List sx={{
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300
                }}>
                
                <Divider className='py-2' />
                
                <p className="text-lg font-medium pl-2 py-2">Currently Blocked Users:</p>

                {(blockedList) ? 
                
                    blockedList
                    .filter( (user) => user._id !== loggedUserId)
                    .map( (user) => <BlockedListMenuItem  
                    key={user._id} blockedUsername={user.username} loggedUserId={loggedUserId}
                    blockedUserId={user._id} blockedUserProfilePicURL={user.profilePicURL}
                    blockedUsers={blockedList} changed={changed} setChanged={setChanged}
                    roles={user.roles} /> )

                : null }
                
                </List>

                </div>
                
            </nav>

        </div>
    </div>

    </Box>
        
  );
}














