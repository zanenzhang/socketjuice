import React from "react";
import ChatContact from "./chatContact";
import useAuth from "../../../hooks/useAuth";
import ChatOptions from "../../options/chatOptions";

const ChatSlot = ({chatItem, loggedUserId, loggedFirstName, 
    chatsList, changedData, setChangedData, drawerState, setDrawerState }) => {

    const { selectedChat, setSelectedChat } = useAuth();    

    const handleSelectContact = (event, item) => {
        event.preventDefault()
        console.log(item._id)
        setSelectedChat(item._id);  
        setDrawerState({ ...drawerState, ['left']: false });
    }


  return (

    <>
    <div className={`${chatItem._id === selectedChat ? 'bg-[#FFE142]' : 'bg-[#8BEDF3]'} 
        flex flex-row shadow-inner shadow-[#8BEDF3]/50 hover:bg-[#00D3E0] cursor-pointer 
            border-b border-[#00D3E0]`}>
            
        <div className="overflow-x-auto flex flex-grow ">
        
            <button 
                onClick={(event)=>handleSelectContact(event, chatItem)} 
                className="w-full pt-2 pb-3 
                    overflow-x-auto inset-1 "
            >
                <ChatContact chatItem={chatItem} loggedUserId={loggedUserId} />

            </button>

        </div>

        <div className="flex items-center">
            <div className="flex flex-row items-center">

                <ChatOptions 
                    chatId={chatItem._id}
                    loggedUserId={loggedUserId}
                    loggedFirstName={loggedFirstName}
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
                strokeWidth="0.5" 
                stroke="black" 
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
