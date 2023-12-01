import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';


export default function SearchMenuItem({followerUsername, followerUserId, 
    followerProfilePicURL, invitedList, setInvitedList, groupDisplay, 
    setGroupDisplay}){
    
    const [alreadyInvited, setAlreadyInvited] = useState(false);

    // className={`w-8 mr-4 select-none cursor-pointer focus:outline-none ${
    //     valuesToggle ? 'fill-red text-red-primary' : 'text-black-light'
    //     }`}


    function handleNewParticipant(){

        if(!invitedList.some(e=>e.username === followerUsername)){

            setInvitedList([...invitedList, {_userId: followerUserId, username: followerUsername}]);
            setGroupDisplay([...groupDisplay, {_userId: followerUserId, username: followerUsername, profilePicURL: followerProfilePicURL}]);
            
        }
    }

    useEffect( () => {

        if(invitedList.some(e=>e.username === followerUsername)){
            setAlreadyInvited(true);
        }

    }, [ invitedList.length ])
    

    return (

        <ListItem className='w-full px-4 max-w-full gap-3'>
            
            <Avatar src={followerProfilePicURL} className="mr-4 ml-4"> </Avatar>
            <ListItemText primary={followerUsername} />
    
            <ListItemButton className='m-2 text-center border-gray-base'
                onClick={handleNewParticipant} disabled={alreadyInvited}>
                {!alreadyInvited ? 'Invite' : "Already Added"}
        
            </ListItemButton>
        
        </ListItem>
    )
}