import React, { useEffect, useState } from "react";
import MessagesArea from "./messages/messagesArea";
import ChatInput from "./chatInput/chatInput";
import useAuth from "../../hooks/useAuth";

import getChatMessages from "../../helpers/Chats/getChatMessages";
import getSingleChat from "../../helpers/Chats/getSingleChat";
import editNewMessagesFill from "../../helpers/Notifications/editNewMessagesFill";
import cloneDeep from 'lodash/cloneDeep';


const ChatArea = ({loggedUserId, loggedUsername, selectedChat, chatsList, setChatsList,
      pageNumber, setPageNumber}) => {

    const {auth, socket, newMessages, setNewMessages } = useAuth();
    
    const userProfilePicURL = auth.profilePicURL;
    const [scrollStop, setScrollStop] = useState(false);
    const [othersTyping, setOthersTyping] = useState(false);
    const [messages, setMessages] = useState([]);
    const [updatedChat, setUpdatedChat] = useState("");
    const [updatedMessage, setUpdatedMessage] = useState("");
    const [messagesHash, setMessagesHash] = useState({});

    useEffect( ()=> {

      async function fetchMessagesData() {

        if(messagesHash){
          if(messagesHash[updatedMessage._id] !== undefined){
            return
          } else {
            var newHash = cloneDeep(messagesHash);
            newHash[updatedMessage._id] = updatedMessage._id
            setMessagesHash(newHash)
          }
        }
        
        if(chatsList?.userData){
          for (let i=0; i < Object.keys(chatsList.userData).length; i++){
            if(updatedMessage._userId === chatsList.userData[i]._id){
              updatedMessage.userProfilePicURL = chatsList.userData[i].profilePicURL;
              break;
            }
            if(updatedMessage._userId === loggedUserId){
              updatedMessage.userProfilePicURL = userProfilePicURL;
              break;
            }
          }
        }
  
        if(messages?.length > 0){

          var combined = [...messages, updatedMessage]
          var recentDate = '1920-01-01'

          for (let i=0; i<combined.length; i++){
            if(combined[i].createdAt.slice(0,10) > recentDate){
              recentDate = combined[i].createdAt.slice(0,10)
              combined[i].showDate = true
            } else {
              combined[i].showDate = false
            }
          }

          setMessages(combined)

        } else {

          updatedMessage.showDate = true;

          setMessages([updatedMessage])
        }
        
        setPageNumber(pageNumber + 1)
      }

      if(updatedMessage){
        fetchMessagesData()
      }

    }, [updatedMessage])


    useEffect( ()=> {

      async function updateNewMessages() {

        if(newMessages){
          const openedMsgs = await editNewMessagesFill(loggedUserId, auth.accessToken)
          if(openedMsgs){
            setNewMessages(false)
          }  
        }
      }

      updateNewMessages();

    }, [newMessages])


    useEffect( ()=> {

      async function getNewChat(){

        if(updatedChat){
          const newChat = await getSingleChat(updatedChat, auth.accessToken, auth.userId)

          if(newChat){

            let userDataHash = {}
  
            for(let i=0; i < newChat?.userData?.length; i++){
  
                userDataHash[newChat.userData[i]._id] = newChat.userData[i]
            }
    
            if(Object.keys(userDataHash).length !== 0){
    
              for (let j=0; j < newChat?.foundChat?.participants?.length; j++){
                
                let currentId = newChat?.foundChat?.participants[j]._userId
                
                newChat.foundChat.participants[j].userInfo = userDataHash[currentId]
                
              }
            }
  
            var newChatsList = cloneDeep(chatsList);
  
            for(let i=0; i < Object.keys(newChatsList.userChats).length; i++){
              var item = newChatsList.userChats[i];
              
              if(item._id === newChat?.foundChat._id){
                newChatsList.userChats[i] = newChat.foundChat;
                break;
              }
            }

            newChatsList.userChats.sort((a,b) => 
              Date.parse(b.lastUpdated) - Date.parse(a.lastUpdated)
            )
  
            setChatsList(newChatsList);
          }
        }
      }

      getNewChat();

    }, [updatedChat])


    useEffect( async ()=> {

      async function getChatData(){

        if(selectedChat && selectedChat !== "cleared"){
          
          const messageData = await getChatMessages(selectedChat, 10, loggedUserId, auth.accessToken);
  
          if(messageData?.stop === 1){

            setScrollStop(true);

          } else {

            setPageNumber(20);
          }

          let userDataHash = {}
          let tempMessagesHash = {}

          for(let j=0; j< messageData?.userData?.length; j++){

            userDataHash[messageData.userData[j]._id] = messageData?.userData[j].profilePicURL
          }

          var recentDate = '1920-01-01'
  
          for(let i =0; i< messageData?.messagesByChat?.length; i++){

            if(userDataHash[messageData.messagesByChat[i]._userId] !== undefined){
              messageData.messagesByChat[i].userProfilePicURL = userDataHash[messageData.messagesByChat[i]._userId]
            }

            if(messageData.messagesByChat[i].createdAt.slice(0,10) > recentDate){
              recentDate = messageData.messagesByChat[i].createdAt.slice(0,10)
              messageData.messagesByChat[i].showDate = true
            
            } else {

              messageData.messagesByChat[i].showDate = false
            }

            tempMessagesHash[messageData.messagesByChat[i]._id] = messageData.messagesByChat[i]._id
          } 
            
          setMessages(messageData?.messagesByChat)
          setMessagesHash(tempMessagesHash)
        
        } else if (selectedChat === 'cleared'){
          
          setMessages([]);
        }
      }

      getChatData();

    }, [selectedChat])


    useEffect( () => {

        if(Object.keys(socket).length === 0){
          return
        }

        if(Object.keys(socket).length !== 0){
      
          socket.on("updatedChats", (update) => {
            //Setchatslist
            setUpdatedChat(update);
          })
      
          socket.on("newMessage", (message) => {
            //setMessages()
            setUpdatedMessage(message);
          })
      
          socket.on("othersTypingStart", (username) => {
            setOthersTyping(username);
          })
      
          socket.on("othersTypingStop", (username) => {
            setOthersTyping("");
          })
    
      //Delete message, filter state
  
      }

    }, [socket])


    return (
      <div key={"chatAreaContainer"} className="bg-gradient-to-r from-purple-50 
      to-orange-50 bg-center overflow-auto w-full h-full">
        
        <MessagesArea 
          key={"messagesArea"}
          selectedChat={selectedChat} loggedUserId={loggedUserId}
          loggedUsername={loggedUsername}
          messages={messages} setMessages={setMessages} 
          othersTyping={othersTyping} pageNumber={pageNumber}
          setPageNumber={setPageNumber} setScrollStop={setScrollStop}
          scrollStop={scrollStop} 
          messagesHash={messagesHash}
          setMessagesHash={setMessagesHash}
        />

        <div key={"chatInputContainer"} 
        className="flex flex-col items-end justify-items-end">

          <ChatInput 
            selectedChat={selectedChat} loggedUserId={loggedUserId}
            loggedUsername={loggedUsername} messages={messages} 
            setMessages={setMessages} socket={socket}
            />
        
        </div>
      </div>
    )   
}


export default ChatArea;