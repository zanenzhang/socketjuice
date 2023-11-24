import React, { useEffect, useState } from "react";
import ChatSlot from "../chatContact/chatSlot";
import useAuth from "../../../hooks/useAuth";
import addChat from "../../../helpers/Chats/addChat";

const Chatsbar = ({chatsList, changedData, setChangedData, selectedChat, setSelectedChat, 
    setPageNumber, drawerState, setDrawerState, loggedUserId, loggedFirstName }) => {
  
      const [previous, setPrevious] = useState("")
      const { newIndividualChat, setNewIndividualChat, auth } = useAuth();    

      useEffect( ()=> {

        if(newIndividualChat.userId && loggedUserId && newIndividualChat.userId !== loggedUserId){

          let newChatUserId = newIndividualChat.userId
          let newChatFirstName = newIndividualChat.firstName

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
          border-b-2 border-solid border-[#8BEDF3]/20">

          {chatsList?.userChats ? chatsList.userChats.map((item) => (
            
            <ChatSlot
              key={item._id} 
              selectedChat={selectedChat} 
              setSelectedChat={setSelectedChat} 
              chatItem={item}
              loggedUserId={loggedUserId}
              loggedFirstName={loggedFirstName}
              previous={previous}
              setPrevious={setPrevious}
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