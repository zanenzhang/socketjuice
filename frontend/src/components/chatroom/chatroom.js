import React, { useState } from "react";

import ChatSidebar from "../chatSidebar/chatSidebar";
import Chatarea from "../chatarea/chatarea";


const ChatRoom = ({loggedUserId, loggedFirstName }) => {

  const [pageNumber, setPageNumber] = useState(10);

  return (

      <div className="bg-white flex flex-row w-full h-full">
        
          <div className="flex flex-col">

            <div className="flex bg-cyan-100 h-[83vh] sm:h-[82vh] md:h-[81vh] border-r-2 border-white ">

              <ChatSidebar loggedUserId={loggedUserId} loggedFirstName={loggedFirstName}/>

            </div>
          <div className="flex flex-grow bg-[#f6f6f6]"/>
        </div>

        <div className="flex flex-grow h-[83vh] sm:h-[82vh] md:h-[81vh]">        
          <Chatarea loggedUserId={loggedUserId} loggedFirstName={loggedFirstName}
            pageNumber={pageNumber} setPageNumber={setPageNumber}
            />
        </div>
      </div>
    );
  
}

export default ChatRoom;