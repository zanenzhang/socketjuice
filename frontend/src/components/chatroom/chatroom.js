import React, { useState } from "react";

import ChatSidebar from "../chatSidebar/chatSidebar";
import Chatarea from "../chatarea/chatarea";


const ChatRoom = ({loggedUserId, loggedUsername, profilePicURL}) => {

  const [pageNumber, setPageNumber] = useState(10);
  const [chatsList, setChatsList] = useState([]);
  const [selectedChat, setSelectedChat] = useState("");  

  return (

      <div className="bg-white flex flex-row w-full h-full">
        
          <div className="flex flex-col">

            <div className="flex bg-cyan-100 h-[83vh] sm:h-[82vh] md:h-[81vh] border-r-2 border-white ">

              <ChatSidebar loggedUserId={loggedUserId} selectedChat={selectedChat} setSelectedChat={setSelectedChat}
                chatsList={chatsList} setChatsList={setChatsList} setPageNumber={setPageNumber}/>

            </div>
          <div className="flex flex-grow bg-[#f6f6f6]"/>
        </div>

        <div className="flex flex-grow h-[83vh] sm:h-[82vh] md:h-[81vh]">        
          <Chatarea loggedUserId={loggedUserId} loggedUsername={loggedUsername}
            selectedChat={selectedChat} 
            chatsList={chatsList} setChatsList={setChatsList}
            pageNumber={pageNumber} setPageNumber={setPageNumber}
            />
        </div>
      </div>
    );
  
}

export default ChatRoom;