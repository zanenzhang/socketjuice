import React, { useEffect } from "react";
import ChatContact from "./chatContact";
import { formatDistanceToNowStrict } from 'date-fns';
import useAuth from "../../../hooks/useAuth";
import ChatOptions from "../../options/chatOptions";

const ChatSlot = ({chatItem, selectedChat, setSelectedChat, loggedUserId,
    loggedUsername, previous, setPrevious, setPageNumber, chatsList,
    changedData, setChangedData, drawerState, setDrawerState }) => {

    const { socket } = useAuth();    

    // useEffect( () => {

    //     if(chatItem?.mostRecentMessage){
    //         console.log(chatItem.mostRecentMessage);
    //     }
        
    // }, [])

    function handleSelectContact(item){
        setSelectedChat(item._id);        
        setDrawerState({ ...drawerState, ['left']: false });
    }

    useEffect( ()=> {

        if(Object.keys(socket) !== 0){
    
          if(previous !== ''){
            socket.emit("leave", {chatId: previous, userId: loggedUserId})
          } 
    
          socket.emit("join", {chatId: selectedChat, userId: loggedUserId})
          
          if(previous !== selectedChat){
              setPrevious(selectedChat)
          }
        }
    
      }, [selectedChat])
    

  return (

    <>
    <div className={`${chatItem._id === selectedChat ? 'bg-[#fadeeb]' : 'bg-[#fff7fc]'}  
    flex flex-row shadow-inner shadow-[#8BEDF3]/30 hover:bg-blue-100 cursor-pointer `}>
            
        <div className="overflow-x-auto flex flex-grow ">
        
            <button 
                onClick={(event)=>handleSelectContact(chatItem)} 
                className="w-full pb-4 pt-3 
                    overflow-x-auto inset-1 "
            >
                <ChatContact chatItem={chatItem} loggedUserId={loggedUserId} />
                
                {(chatItem?.mostRecentMessage?.content) &&

                    <div>
                        <div className="flex flex-col pl-5 justify-start">
                            <div className="flex flex-wrap break-all ">
                                {chatItem.mostRecentMessage.username === loggedUsername ? 
                                    (<span>{"You:"} &nbsp;</span>) :   
                                    <span>{chatItem.mostRecentMessage.username.slice(0,8)}: &nbsp;</span>                                     
                                }
                                <span>{chatItem.mostRecentMessage.content.slice(0,13)}{chatItem.mostRecentMessage.content.length > 13 ? '...' : null}</span>
                            </div>
                            <div className="flex flex-row text-sm">
                                {chatItem.lastUpdated && <p>{formatDistanceToNowStrict(new Date(chatItem.lastUpdated),{addSuffix: true})}</p>}
                            </div>
                        </div>
                        
                    </div>
                }

            </button>

        </div>

        <div className="flex items-center">
            <div className="flex flex-row items-center">

                <ChatOptions 
                    chatId={chatItem._id}
                    loggedUserId={loggedUserId}
                    loggedUsername={loggedUsername}
                    chatsList={chatsList}
                    changedData={changedData} 
                    setChangedData={setChangedData} 
                    setSelectedChat={setSelectedChat}
                    participants={chatItem.participants}
                    drawerState={drawerState}
                    setDrawerState={setDrawerState}
                />

            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" viewBox="0 0 24 24" 
                strokeWidth="1" 
                stroke="#8BEDF3" 
                className="w-8 h-8"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M8.25 4.5l7.5 7.5-7.5 7.5" 
                />
            </svg>
            </div>
        </div>
    </div>
    </>
  );
};

export default ChatSlot;
