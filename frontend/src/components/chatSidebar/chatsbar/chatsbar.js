import React, { useEffect, useState } from "react";
import ChatSlot from "../chatContact/chatSlot";
import useAuth from "../../../hooks/useAuth";
import addChat from "../../../helpers/Chats/addChat";

const Chatsbar = ({chatsList, changedData, setChangedData,  
    setPageNumber, drawerState, setDrawerState, loggedUserId, loggedFirstName }) => {
  
      const { newIndividualChat, setNewIndividualChat, auth, 
        selectedChat, setSelectedChat, } = useAuth();    

      useEffect( ()=> {

        if(newIndividualChat.userId && loggedUserId && newIndividualChat.userId !== loggedUserId){

          let newChatUserId = newIndividualChat.userId
          let newChatFirstName = newIndividualChat.firstName

          console.log(newChatUserId, newChatFirstName)

          async function checkContext(){

            let alreadyChatting = false;

            if(chatsList?.userChats){

                for (let i=0; i < chatsList.userChats.length; i++){

                    var item = chatsList.userChats[i];

                    if(item.participants.length === 2 && item.participants.some(e => e._userId === newChatUserId)){
                        alreadyChatting = true
                        setSelectedChat(item._id);
                        setDrawerState({ ...drawerState, ['left']: false });
                        setNewIndividualChat({})
                        break
                    }
                }

                if(!alreadyChatting){

                  var participants = [{_userId: loggedUserId, loggedFirstName: auth.firstName}, 
                    {_userId: newChatUserId, firstName: newChatFirstName}]    
                    
                    participants.sort((a,b) => a.firstName > b.firstName ? 1 : -1);

                    console.log(participants)
                        
                    const added = await addChat(participants, loggedUserId, auth.accessToken)
          
                    if(added){
                      if(added.savedNew){
                        setSelectedChat(added.savedNew._id)
                        setDrawerState({ ...drawerState, ['left']: false });
                        setNewIndividualChat({})
                      }
                        
                    }
                }
            }
          }
          checkContext();
        }

    }, [newIndividualChat.userId, chatsList, loggedUserId])


    return (
        <div className="h-[70vh] overflow-y-auto max-h-[70vh] 
          border-y-2 border-[#00D3E0] rounded-md">

          {chatsList?.userChats?.length > 0 ? chatsList.userChats.map((item) => (
            
            <ChatSlot
              key={item._id} 
              chatItem={item}
              loggedUserId={auth.userId}
              loggedFirstName={auth.firstName}
              setPageNumber={setPageNumber}
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