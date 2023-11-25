import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';



export default function AddUserMenuItem({loggedUserId, loggedFirstName, followerUsername, followerUserId, 
    followerUserProfilePicURL, setSelectedUser, selectedUser }){
    
    const [alreadySelected, setAlreadySelected] = useState(false);
    
    async function handleToggle(){

        setSelectedUser({_userId: followerUserId, username: followerUsername, 
            profilePicURL: followerUserProfilePicURL})
    }

    useEffect( ()=> {

        if(selectedUser){
            if(followerUserId === selectedUser?._userId){
                setAlreadySelected(true)
            } else {
                setAlreadySelected(false)
            }
        }
        

    }, [selectedUser])

    useEffect( ()=> {

        setSelectedUser(null)

    }, [])


    return (

        <ListItemButton onClick={handleToggle} className='w-full px-4 max-w-full gap-3 onClick={handleToggle}'>
            
            <Avatar src={followerUserProfilePicURL} className="mr-4 ml-4"> </Avatar>
            <ListItemText primary={followerUsername} />
    
            <ListItemText className='m-2 text-center border-gray-base'
                >
                {alreadySelected ? 'Already Selected' : "Select User"}
        
            </ListItemText>
        
        </ListItemButton>
    )
}






