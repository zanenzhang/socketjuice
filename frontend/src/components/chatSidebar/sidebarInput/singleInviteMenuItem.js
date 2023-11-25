import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import addChat from "../../../helpers/Chats/addChat";


export default function SingleInviteMenuItem({loggedUserId, loggedFirstName, followerUsername, followerUserId, 
    followerUserProfilePicURL, changedData, setChangedData, chatsList, 
    handleClosePopover, setSelectedChat, drawerState, setDrawerState }){
    
    const {auth} = useAuth();
    const [alreadyChatting, setAlreadyChatting] = useState(false);
    const [currentChat, setCurrentChat] = useState("");

    
    async function handleToggle(){

        if(alreadyChatting){

            setSelectedChat(currentChat)
            setDrawerState({ ...drawerState, ['left']: false });
            setChangedData(!changedData)
            handleClosePopover()
        
        } else {

            var participants = [{_userId: loggedUserId, firstName: loggedFirstName}, 
            {_userId: followerUserId, username: followerUsername}]
            
            participants.sort((a,b) => a.username > b.username ? 1 : -1);
                
            const added = await addChat(participants, loggedUserId, auth.accessToken)

            if(added?.savedNew){
                setSelectedChat(added.savedNew._id)
                setDrawerState({ ...drawerState, ['left']: false });
                setChangedData(!changedData)
                handleClosePopover()
            }    
        }
    }

    useEffect( ()=> {

        if(chatsList?.userChats){

            for (let i=0; i < chatsList.userChats.length; i++){

                var item = chatsList.userChats[i];

                if(item.participants.length === 2 && item.participants.some(e => e._userId === followerUserId)){
                    setAlreadyChatting(true);
                    setCurrentChat(item._id);
                }
            }
        }

    }, [])


    return (

        <ListItem className='w-full px-4 max-w-full gap-3'>
            
            <Avatar src={followerUserProfilePicURL} className="mr-4 ml-4"> </Avatar>
            <ListItemText primary={followerUsername} />
    
            <ListItemButton className='m-2 text-center border-gray-base'
                onClick={handleToggle}>
                {alreadyChatting ? 'Go To Chat' : "Start Chatting"}
        
            </ListItemButton>
        
        </ListItem>
    )
}






