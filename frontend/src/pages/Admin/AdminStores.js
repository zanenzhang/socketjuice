import React, { useState, useEffect, useRef, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import Box from "@material-ui/core/Box";
import Popover from '@mui/material/Popover';
import { makeStyles } from "@material-ui/core";
import debounce from 'lodash.debounce'
import List from '@mui/material/List';

import ChangeReceivePaymentsItem from '../../components/changeReceivePaymentsItem';
import getUsersPrefixElastic from '../../helpers/UserData/getUsersPrefixElastic';


const AdminStores = () => {

    const { auth } = useAuth();
    const loggedUsername = auth.username;
    const loggedUserId = auth.userId;

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
    const [loggedUserOrStore, setLoggedUserOrStore] = useState(null)

    const [validUsername, setValidUsername] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);
    
    const changeHandler = (event) => {
        if(username?.length > 16){
            return
        }
        setUsername(event.target.value);
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

            if(username.length > 0){
                const response = await getUsersPrefixElastic(username, loggedUsername, auth.accessToken, loggedUserId)
    
                if (response){
                    console.log(response.data)
                    setUsers(response.data)
                }
            }
        }

        fetchData();

    }, [username])

    useEffect( () => {

        if(auth.roles?.includes(3780)){
      
            setLoggedUserOrStore(2)
      
        } else {
            setLoggedUserOrStore(1)
        }
      
      }, [auth.roles])

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
  


    return(
        <Box
        className={classes.container}
    >
        <div className="flex w-full justify-center pt-3">

        <div className="flex flex-col w-[350px] md:w-[450px]">
            
        <label className='text-lg font-medium pl-2'>Search Users To Adjust Payments:</label>
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
                .map( (user) => <ChangeReceivePaymentsItem  
                    key={user._id} followingUsername={user.username} loggedUserId={loggedUserId}
                    followingUserId={user._id} followingUserProfilePicURL={user.profilePicURL}
                    canReceivePayments={user.canReceivePayments}
                    privacySetting={user.privacySetting} blockedUsers={user.blockedUsers}
                    changedData={changedData} setChangedData={setChangedData} 
                    loggedUserOrStore={loggedUserOrStore}
                    /> )

                : null }

                </List> 
                
                </Popover>
                
            </nav>

        </div>
    </div>

    </Box>
    )
}

export default AdminStores
