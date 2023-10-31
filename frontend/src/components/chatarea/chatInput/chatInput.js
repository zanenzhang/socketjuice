import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "../../emojiPicker/emojiPicker";
import useAuth from "../../../hooks/useAuth";
import { profanity } from '@2toad/profanity';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import addMessage from "../../../helpers/Chats/addMessage";
import addMessageNoti from "../../../helpers/Notifications/addMessageNoti";


const ChatInput = ({loggedUserId, loggedUsername, selectedChat, 
    messages, setMessages, socket}) => {

  const {auth} = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const [currentTyping, setCurrentTyping] = useState(false);
  const [disable, setDisable] = useState(false);
  const messageRef = useRef();

  var waiting = false;

  // useEffect( () => {

  //   if(profanity){
  //     profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);
  //   }

  // }, [profanity])

  const handleSubmitMessage = async () => {

    if(!socket || !selectedChat){
      return
    }
      waiting = true;
      setCurrentTyping(false);

      socket.emit("typingStop", {chatId: selectedChat, username: loggedUsername});  

      // const profanityCheck = profanity.exists(messageContent)
          
      // if(!profanityCheck){
        
      const addedMessage = await addMessage(loggedUserId, loggedUsername, selectedChat, messageContent, auth.accessToken)
    
      if(addedMessage){
        const addedNoti = await addMessageNoti(loggedUserId, selectedChat, auth.accessToken)  

        if(addedNoti){
          setMessageContent("");
          waiting = false;
        }

      } else {
        waiting = false
      }
      
      // } else {

      //   toast.error("Your message may violate our terms, please try again!", {
      //     position: "bottom-center",
      //     autoClose: 1500,
      //     hideProgressBar: false,
      //     closeOnClick: true,
      //     pauseOnHover: true,
      //     draggable: true,
      //     progress: undefined,
      //     theme: "colored",
      //     });

      // }
  }

  const onEnterPress = (event) => {
    if(selectedChat !== "" && event.key === 'Enter' && event.shiftKey === false) {  
      event.preventDefault();
      handleSubmitMessage();
    }
  }

  useEffect( () => {

    setMessageContent("");

  }, [selectedChat])

  const messageHandler = (e) => {

    setMessageContent(e.target.value)

    if(!socket ){
      return
    }

    if (!currentTyping) {
      socket.emit("typingStart", {chatId: selectedChat, username: loggedUsername})
      setCurrentTyping(true);
    }

    let lastTypingTime = new Date().getTime();

    var timerLength = 3000;
    let timer1 = setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;

      if ( (timeDiff >= timerLength) && (currentTyping || messageContent.length === 0) ) {
        socket.emit("typingStop", {chatId: selectedChat, username: loggedUsername})  
        setCurrentTyping(false);
      }
      return () => {
        clearTimeout(timer1);
      };
      
    }, timerLength);

  };

  useEffect(() => {
        
    if(selectedChat !== ""){
      const ele = messageRef.current
      ele.focus();
      setDisable(false)
    } else {
      setDisable(true)
    }

  }, [selectedChat])

  
    return (
      <div className="h-[10vh] bg-[#f6f6f6] w-full 
        sm:pr-[5vw] flex items-center justify-center">
          
          <div className="">
            <EmojiPicker content={messageContent} setContent={setMessageContent} disabled={disable} />
          </div>

          <input
            type="text"
            className="box-border border-2 m-3 w-full h-12 rounded-2xl pl-15 placeholder: pl-3"
            value={messageContent}
            onChange={messageHandler}
            placeholder="Type message"
            onKeyDown={(event)=>onEnterPress(event)}
            ref={messageRef}
            disabled={waiting || disable}
          />

        <button 
          className="pl-1 pr-8" 
          onClick={handleSubmitMessage}
          disabled={messageContent.length < 1 || !selectedChat}
          >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="1.5" 
            stroke="currentColor" 
            className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>

          </button>

          {/* <ToastContainer
              position="bottom-center"
              autoClose={1500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
          /> */}
          
      </div>
    );
  
}

export default ChatInput;