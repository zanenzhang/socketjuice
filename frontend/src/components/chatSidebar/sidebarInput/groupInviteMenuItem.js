import React, { useState } from 'react';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';


export default function GroupInviteMenuItem({loggedUserId, followerUsername, followerUserId, 
    followerProfilePicURL, invitedList, setInvitedList }){
    
    const [removed, setRemoved] = useState(false)

    function handleRemove(){

        let newInvitedList = invitedList.filter( el => el.username !== followerUsername );
        setInvitedList(newInvitedList) 
        setRemoved(true);
    }

        
    return (

        (!removed && <ListItem className='w-full max-w-full'>
            
            <Avatar src={followerProfilePicURL} className="mr-4"> </Avatar>
            <ListItemText primary={followerUsername} />
    
            <ListItemButton className='m-2 text-center border-gray-base'
                onClick={handleRemove}>
                Remove
            </ListItemButton>
        
        </ListItem>)
        
    )

}






