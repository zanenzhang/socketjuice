import React, { useEffect, useState } from "react";
import { formatDistanceToNowStrict, format } from 'date-fns';

import MessageOptions from "../../../options/messageOptions";

const Message = ({ message, senderUsername,loggedUserId, loggedUsername, 
  chatId }) => {
  
  const [hiddenToggle, setHiddenToggle] = useState(message.hidden);
  const [showReceivedName, setShowReceivedName] = useState(false);
  const [showMessageTime, setShowMessageTime] = useState(false);

  // useEffect( ()=> {

  //   console.log(message)

  // }, [message])

  function handleRecNameClick(){
    if(showReceivedName){
      setShowReceivedName(false)
    } else {
      setShowReceivedName(true)
    }
  }

  function handleMesTimeClick(){
    if(showMessageTime){
      setShowMessageTime(false)
    } else {
      setShowMessageTime(true)
    }
  }

  useEffect( ()=> {

    setHiddenToggle(message.hidden)

  }, [message])

  return (

    <div className="w-full">
      
      {(message?.showDate) &&
      <div className="flex justify-center py-2">
          <p className="">-- {format(new Date(message.createdAt), "cccc',' LLLL d',' yyyy h':'mm b")} --</p>
      </div>}
    
      {senderUsername !== loggedUsername ? 
      
      (<div className="flex flex-row float-right pl-4 pr-4 py-4">

          <div className="flex flex-col pt-2">
              
            {(!hiddenToggle && message?.content) &&
            
            <div 
              onClick={handleMesTimeClick} 
              className="flex text-base max-w-1/2 rounded-2xl 
                bg-orange-300 text-black py-1 px-4 hover:cursor-pointer">

              <div className={`${message.content ? 'flex justify-center p-1 m-1' : null}`}>
                
                {message.content ? <span className="">{message.content}</span> : null}
                
              </div>

            </div>}
            
            {(hiddenToggle && message?.content) && 
            
            <div className="flex text-base max-w-1/2 rounded-2xl bg-orange-300 text-black py-1 px-4">

              <div className={`${message.content ? 'flex justify-center p-1 m-1' : null}`}>
                
                {message.content ? <span className="italic">Message Deleted</span> : null}
                
              </div>

            </div>}

            { message && 
            <p className={`text-xs ${showMessageTime ? 'flex justify-center' : 'invisible'  }`}>
              {formatDistanceToNowStrict(new Date(message.createdAt),{addSuffix: true})}
              </p>}

          </div>

          <div className="flex flex-col justify-center pr-4 pl-3">

              <div className={`${showReceivedName ? 'flex' : 'hidden' } `}>
                <p className="flex justify-center 
                  items-center pb-1 text-xs font-semibold">{message?.username}</p>
              </div>

              {message?.username && <MessageOptions userProfilePicURL={message.userProfilePicURL} chatId={chatId}
                loggedUserId={loggedUserId} messageId={message._id} loggedUsername={loggedUsername}
                  hiddenToggle={hiddenToggle} setHiddenToggle={setHiddenToggle}
                  messageUserId={message._userId} handleRecNameClick={handleRecNameClick}
              />}

          </div>
    
      </div>)        
    : 
    
    (<div className="flex flex-row float-left ml-4">

        {(message?.content) && <MessageOptions userProfilePicURL={message.userProfilePicURL} loggedUsername={loggedUsername}
          loggedUserId={loggedUserId} messageId={message._id} chatId={chatId}
            hiddenToggle={hiddenToggle} setHiddenToggle={setHiddenToggle}
            messageUserId={message._userId}
        />}

          <div className="flex flex-col justify-center pl-4 py-4 pr-4">
              
            {(!hiddenToggle && message?.content) && <div className="flex text-base max-w-1/2 rounded-2xl 
              bg-[#8BEDF3] text-white py-1 px-4 hover:cursor-pointer">

              <div 
                onClick={handleMesTimeClick} 
                className={`${message.content ? 'flex justify-center p-1 m-1' : null}`}>
                
                {message.content ? <span className="">{message.content}</span> : null}
                
              </div>

            </div>}


            {(hiddenToggle && message?.content) && <div className="flex text-base max-w-1/2 rounded-2xl bg-[#8BEDF3] text-white py-1 px-4">

              <div className={`${message.content ? 'flex justify-center p-1 m-1' : null}`}>
                
                {message.content ? <span className="italic">Message Deleted</span> : null}
                
              </div>

            </div>}

            { message && 
            <p className={`text-xs ${showMessageTime ? 'flex justify-center' : 'invisible'  }`}>
              {formatDistanceToNowStrict(new Date(message.createdAt),{addSuffix: true})}
              </p>}

          </div>
    
    </div>)

      }
    
    </div>

    // <p id={"timestamp"} className="pl-4 text-[12px]"> {formatDistance(new Date(message.createdAt), new Date())} </p> 

  );
};

export default Message;
