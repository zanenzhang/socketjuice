import React, { useEffect, useState, useRef } from "react";
import Message from "./message/message";
import useAuth from "../../../hooks/useAuth";
import TypingLine from "./message/typing";
import getChatMessages from "../../../helpers/Chats/getChatMessages";
import cloneDeep from 'lodash/cloneDeep';

const MessagesArea = ({loggedUserId, loggedUsername, messages, 
        setMessages, selectedChat, othersTyping, pageNumber, setPageNumber,
        setScrollStop, scrollStop, messagesHash, setMessagesHash }) => {
  
    const {auth} = useAuth();
    const lastMessageRef = useRef(null);
    var waiting = false

      useEffect(() => {
    
        if(lastMessageRef){
            lastMessageRef?.current?.scrollIntoView({ behavior: 'smooth' });
        }
        
    }, [messages]);


      async function handleScroll(e) {
        
        if(!waiting && !scrollStop){

            waiting = true;

            let element = e.target;
            if (element.scrollTop === 0) {

                const prevMessages = await getChatMessages(selectedChat, pageNumber, auth.userId, auth.accessToken)

                if(prevMessages.stop === 1){

                    setScrollStop(true);
                
                } else {

                    setPageNumber(pageNumber + 10);
                }

                var checkedPrevMessages = []

                if(prevMessages?.messagesByChat){

                    let userDataHash = {}
                    let tempMessagesHash = cloneDeep(messagesHash);

                    for (let i=0; i < Object.keys(prevMessages?.userData).length; i++){

                        userDataHash[prevMessages.userData[i]._id] = prevMessages.userData[i].profilePicURL;
                    }    

                    for (let j=0; j< prevMessages.messagesByChat?.length; j++){

                        if(userDataHash[prevMessages.messagesByChat[j]._userId] !== undefined){
                            prevMessages.messagesByChat[j].userProfilePicURL = userDataHash[prevMessages.messagesByChat[j]._userId]
                        }

                        if(tempMessagesHash[prevMessages.messagesByChat[j]._id] === undefined){
                            tempMessagesHash[prevMessages.messagesByChat[j]._id] = prevMessages.messagesByChat[j]._id
                            checkedPrevMessages.push(prevMessages.messagesByChat[j])
                        }
                    }

                    var combined = [...checkedPrevMessages, ...messages]
                    var recentDate = '1920-01-01'

                    for (let i=0; i<combined.length; i++){
                        if(combined[i].createdAt.slice(0,10) > recentDate){
                          recentDate = combined[i].createdAt.slice(0,10)
                          combined[i].showDate = true
                        } else {
                          combined[i].showDate = false
                        }
                      }

                    setMessages(combined);
                    setMessagesHash(tempMessagesHash)

                    element.scroll(0, 300);
                }
            }
            waiting = false;
        }
     }

    return(

        <div key="messagesAreaContainer" 
        className="flex h-[78vh] sm:h-[77vh] md:h-[75vh] overflow-y-auto flex-col" 
        >

            {messages?.length > 0 && 
            
            <div key="messagesWrapper" className="flex flex-col p-4" onScroll={ handleScroll}>
                
                {(messages?.length > 0) && messages?.map((message, index) => (

                    <Message 
                    key={`${message._id}${index}`}
                    message={message}
                    chatId={message._chatId}
                    senderUsername={message.username} 
                    loggedUsername={loggedUsername}
                    loggedUserId={loggedUserId}
                    />
                )) }

            </div>}
        
        <TypingLine key={"typingLine"} othersTyping={othersTyping} loggedUsername={loggedUsername} />
        
        
        <div key={"lastMessage"} ref={lastMessageRef} />

        </div>
    )
}

export default MessagesArea;
