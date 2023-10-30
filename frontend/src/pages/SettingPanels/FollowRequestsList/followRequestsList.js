import React, { useState, useEffect } from 'react';
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import List from '@mui/material/List';
import useAuth from '../../../hooks/useAuth';

import getPeopleFollowReceivers from '../../../helpers/Follow/getPeopleFollowReceive';
import getPeopleFollowSubmitters from '../../../helpers/Follow/getPeopleFollowSubmit';
import getStoreFollowReceivers from '../../../helpers/StoreData/getStoreFollowReceive';
import getStoreFollowSubmitters from '../../../helpers/StoreData/getStoreFollowSubmit';

import ReceiveListMenuItem from './receiveListMenuItem';


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

export default function FollowRequestsList({loggedUserId, loggedUsername, loggedUserOrStore}) {
    const classes = useStyles();
    
    const {auth} = useAuth();
    const [peopleReceiveList, setPeopleReceiveList] = useState([]);
    const [storeReceiveList, setStoreReceiveList] = useState([]);
    

    useEffect( () => {

        async function fetchData(){

            const peopleReceive = await getPeopleFollowReceivers(loggedUserId, auth.accessToken)
            const storeReceive = await getStoreFollowReceivers(loggedUserId, auth.accessToken)

            if (peopleReceive){
                
                setPeopleReceiveList(peopleReceive.data)
            }

            if (storeReceive){
                
                setStoreReceiveList(storeReceive.data)
            }
        }

        fetchData();
        
    }, [])

    
  
  return (
    
    <Box
        className={classes.container}
    >
        <div className="flex w-full justify-center">

        <div className="flex flex-col w-[300px] sm:w-[350px] md:w-[400px] h-[60vh]">
            
            <nav aria-label="requestList display">

                <List sx={{
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300,
                    width: {xs: 300, sm: 350, md: 400},
                }}>

                <p className="text-lg font-medium pl-2 py-2">Incoming Follow Requests:</p>
                
                { (peopleReceiveList) ? 
                
                peopleReceiveList
                  .filter(user => user._id !== loggedUserId)
                  .map( (user) => <ReceiveListMenuItem  
                    key={user._id} receiveUsername={user.username} loggedUserId={loggedUserId}
                    receiveUserId={user._id} receiveUserProfilePicURL={user.profilePicURL} 
                    roles={user.roles} loggedUserOrStore={loggedUserOrStore}
                    /> )

                : null }

                { (storeReceiveList) ? 
                
                storeReceiveList
                  .filter(user => user._id !== loggedUserId)
                  .map( (user) => <ReceiveListMenuItem  
                    key={user._id} receiveUsername={user.username} loggedUserId={loggedUserId}
                    receiveUserId={user._id} receiveUserProfilePicURL={user.profilePicURL} 
                    loggedUserOrStore={loggedUserOrStore} roles={user.roles}
                    /> )

                : null }

                {(storeReceiveList?.length === 0 && peopleReceiveList?.length === 0) ? 
                <p className='pl-4 italic'>No follow requests</p> : null}

                </List> 

                
            </nav>
            
        </div>
    </div>

    </Box>
        
  );
}

