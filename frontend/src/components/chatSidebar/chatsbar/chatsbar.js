import React, { useEffect, useState } from "react";
import ChatSlot from "../chatContact/chatSlot";
import useAuth from "../../../hooks/useAuth";
import addChat from "../../../helpers/Chats/addChat";

const Chatsbar = ({changedData, setChangedData, drawerState, setDrawerState }) => {
  
      const { newIndividualChat, setNewIndividualChat, auth, 
        chatsList, setSelectedChat, selectedChat } = useAuth();    

      const [waiting, setWaiting] = useState(false);
      const [alreadyChatting, setAlreadyChatting] = useState(false)

      useEffect( ()=> {

        async function checkContext(){

          let newChatUserId = newIndividualChat.userId
          let newChatFirstName = newIndividualChat.firstName

            for (let i=0; i < chatsList?.userChats?.length; i++){

                var item = chatsList.userChats[i];

                if(item.participants.some(e => e._userId.toString() === newChatUserId.toString())){
                    setAlreadyChatting(true)
                    setSelectedChat(item._id);
                    setDrawerState({ ...drawerState, ['left']: false });
                    setNewIndividualChat({})
                    break
                }
            }

            if(!alreadyChatting && !selectedChat){

              var participants = [{_userId: auth.userId, firstName: auth.firstName}, 
                {_userId: newChatUserId, firstName: newChatFirstName}]    
                
                participants.sort((a,b) => a.firstName > b.firstName ? 1 : -1);
                    
                const added = await addChat(participants, auth.userId, newChatUserId, auth.accessToken)
      
                if(added){

                  console.log(added)
                  
                  if(added.savedNew){
                    console.log("Created a new chat")
                    setSelectedChat(added.savedNew._id)
                    setAlreadyChatting(true)
                    setDrawerState({ ...drawerState, ['left']: false });
                    setNewIndividualChat({})
                    setWaiting(false)
                  
                  } else {
                    console.log("Failed to create new chat")
                    setWaiting(false)
                  }
                    
                } else {
                  console.log("Failed to create new chat")
                  setWaiting(false)
                }
            }
        }

        if(newIndividualChat.userId && auth.userId && auth.firstName && !selectedChat
          && newIndividualChat.userId !== auth.userId && !waiting){

          setWaiting(true)
          checkContext();
        }

    }, [newIndividualChat.userId, chatsList?.length, selectedChat, auth.userId])


    return (
        <div className="h-[70vh] overflow-y-auto max-h-[70vh] 
          border-y-2 border-[#00D3E0] rounded-md">

          {chatsList?.userChats?.length > 0 ? chatsList.userChats.map((item) => (
            
            <ChatSlot
              key={item._id} 
              chatItem={item}
              loggedUserId={auth.userId}
              loggedFirstName={auth.firstName}
              chatsList={chatsList}
              changedData={changedData}
              setChangedData={setChangedData}
              drawerState={drawerState} 
              setDrawerState={setDrawerState}
              />

            )) 

            : null 
          
          }

        </div>
    );  
}

export default Chatsbar;