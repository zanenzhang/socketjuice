import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import addEmailReport from '../../helpers/Emails/addEmailReport';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ReportIssueMenuItem = ({loggedUserId, setOpenMenu}) => {

  const { auth } = useAuth();
  const logout = useLogout();
  const [openModal, setOpenModal] = useState(false);
  var waiting = false;

  const MESSAGE_REGEX = /^.{1,2000}$/;

  const [message, setMessage] = useState('');
  const [sentInvite, setSentInvite] = useState(false);

  const [validMessage, setValidMessage] = useState(false);
  const [messageFocus, setMessageFocus] = useState(false);
  
  useEffect(() => {
    setValidMessage(MESSAGE_REGEX.test(message));
  }, [message])

  const boxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 350,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
    borderRadius: '25px'
};
    
  
  const handleOpen = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenModal(true);
  };

  const handleClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenModal(false);
    setOpenMenu(false);
  };

  const handleEmailReport = async (event) => {

    event.preventDefault();

    if(waiting){
      return
    }

    waiting = true;

    const submitted = await addEmailReport(loggedUserId, message, auth.accessToken)
  
    if(submitted){
    
      toast.success("Invite sent!", {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        });

      setSentInvite(true);
      waiting = false;;

      setOpenModal(false);
      setOpenMenu(false);

    } else {

      toast.error("Sorry, invite was not sent, please try again", {
        position: "bottom-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  }

    return (

        <React.Fragment>

        <button 
            className='h-12 hover:bg-gray-200 hover:cursor-pointer pl-4 pt-2 pb-2 
            w-full flex items-center'
            onClick={(event)=>handleOpen(event)}
            onKeyDown={(event) => {
                if (event.key === "Enter"){
                    handleOpen();
                }
            }}>
        
          <div className='flex flex-row items-center'>

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                viewBox="0 0 24 24" strokeWidth="1.5" stroke="#8BEDF3" 
                className="w-6 h-6 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>

            <p>Feedback</p>

          </div>

        </button>

        <Modal
            open={openModal}
            onClose={handleClose}
            onClick={(event)=>{event.stopPropagation()}}
            onKeyDown={(event)=>{
              if (event.key === "Tab") {
                event.stopPropagation();
              }
            }}
            style={{zIndex: 10001}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...boxStyle, width: 350 }}>

            <div className='flex flex-col items-center justify-center'>
              <p className='text-center pt-4 text-xl font-semibold pb-2 text-[#8BEDF3]'>Feedback or Report An Issue:</p>

              <div className="flex flex-col w-full">

              <div className='py-2'>
                <p className='font-semibold'>Message:</p>
                  <textarea
                    aria-label="message" 
                    type="text" 
                    id="firstname"
                    autoComplete="off"
                    placeholder="Message (2000 character limit):"
                    className='inline-block text-sm text-gray-base focus:outline-[#8BEDF3]
                    w-full mr-3 h-40 py-3 px-3 border border-gray-primary rounded mb-2' 
                    onChange={ ( e ) => setMessage(e.target.value)}
                    value={message}
                    aria-invalid={validMessage ? "false" : "true"}
                    onFocus={() => setMessageFocus(true)}
                    onBlur={() => setMessageFocus(false)}
                  />
                </div>
                  
                <div className='flex flex-row gap-x-8 py-4'>
                  
              <button 
                  className={`${!validMessage  || sentInvite || waiting
                      ? "bg-gray-100 text-gray-400" : "bg-[#8BEDF3] text-white"}  
                      w-full rounded-xl py-3 font-bold border-solid border-2 flex justify-center 
                      items-center gap-x-3`}
                  disabled={ (!validMessage  || sentInvite || waiting ) 
                      ? true : false}
                  onClick={(event)=>handleEmailReport(event)}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleEmailReport(event);
                    }
                  }}
                  >
                  {waiting && 
                      <div aria-label="Loading..." role="status">
                          <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                          <path
                              className="fill-gray-200"
                              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                          <path
                              className="fill-[#00D3E0]"
                              d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                          </svg>
                      </div>
                  }
                  
                  Send
              </button>
              <button 
                  className={`align-center px-4 py-4 text-black
                  border-2 rounded-xl border-black bg-white text-base font-semibold
                  hover:bg-orange-200 hover:text-black`}
                  onClick={handleClose}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleClose();
                    }
                  }}
                  >
                      Close
              </button>
              </div>

          </div>

        </div>

        </Box>
        
      </Modal>

      <ToastContainer
      toastStyle={{ backgroundColor: "#8BEDF3" }}
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
          />
    
    </React.Fragment>

    )
}

export default ReportIssueMenuItem;
        