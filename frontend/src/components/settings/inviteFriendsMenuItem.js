import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import addWarnings from '../../helpers/UserData/addWarnings';
import addEmailInvitation from '../../helpers/Emails/addEmailInvite';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactGA from "react-ga4";
import { RWebShare } from "react-web-share";


const InviteFriendsMenuItem = ({loggedUserId}) => {

  const { auth } = useAuth();
  const logout = useLogout();
  const [openModal, setOpenModal] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const EMAIL_REGEX = /\S+@\S+\.\S+/;
  const FRIENDNAME_REGEX = /^[a-zA-Z- ]{4,48}$/;
  
  const [email, setEmail] = useState('');
  const [friendname, setFriendname] = useState('');
  
  const [sentInvite, setSentInvite] = useState(false);
  const [validEmail, setValidEmail] = useState(false);
  const [validFriendname, setValidFriendname] = useState(false);

  const [emailFocus, setEmailFocus] = useState(false);
  const [friendnameFocus, setFriendnameFocus] = useState(false);
  
  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email])

  useEffect(() => {
    setValidFriendname(FRIENDNAME_REGEX.test(friendname));
  }, [friendname])

  const boxStyle = {
    position: 'absolute',
    top: '55%',
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
  };

  const handleEmailInvitation = async (event) => {

    event.preventDefault();

    if(waiting){
      return
    }

    setWaiting(true);

    ReactGA.event({
      category: "Email Invitation",
      action: `Sent an invite email to ${friendname}, ${email}`,
    })

    const submitted = await addEmailInvitation(auth.userId, auth.roles, friendname, email, auth.accessToken)
    
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
      setWaiting(false);
      setEmail("");
      setFriendname("");

      setOpenModal(false);

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

      setEmail("");
      setFriendname("");
      setWaiting(false);

      const warnUser = await addWarnings(loggedUserId, auth.accessToken)
      if(warnUser?.status === 202){
        logout();
      } 
      
    }
  }

    return (

        <React.Fragment>

        <button 
            className='flex items-center justify-center'
            onClick={(event)=>handleOpen(event)}
            onKeyDown={(event) => {
                if (event.key === "Enter"){
                    handleOpen();
                }
            }}>
        
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
            strokeWidth="1.5" stroke="#8BEDF3" 
            className="mx-2 h-5 md:h-6 w-5 md:w-6 sm:mx-3 text-black-light cursor-pointer transform transition duration-300 hover:scale-125">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>

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
            
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...boxStyle, width: 350 }}>

            <div className='flex flex-col items-center justify-center'>

            <div className="flex flex-col w-full">

            <button onClick={handleClose}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleClose();
                    }
                  }}
                  className='absolute ml-64 mb-8'
                      > 
                  <svg
                      viewBox="0 0 24 24"
                      fill="#8BEDF3"
                      height="2em"
                      width="2em"
                      >
                      <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2m0 16H5V5h14v14M17 8.4L13.4 12l3.6 3.6-1.4 1.4-3.6-3.6L8.4 17 7 15.6l3.6-3.6L7 8.4 8.4 7l3.6 3.6L15.6 7 17 8.4z" />
                      </svg>
                  </button>

              <p className='text-center pt-4 text-xl font-semibold pb-2 text-[#8BEDF3]'>Invite A Friend!</p>

              </div>

              <div className="flex flex-col w-full">

              <div className='py-2'>
              <p className='font-semibold'>Your Friend's Name:</p>
                <input 
                  aria-label="Friend name" 
                  type="text" 
                  id="firstname"
                  autoComplete="off"
                  placeholder="First name:"
                  className='text-sm text-gray-base w-full mr-3 py-5 px-4 h-2 border border-gray-primary 
                  rounded mb-2 focus:outline-[#8BEDF3]' 
                  onChange={ ( e ) => setFriendname(e.target.value)}
                  value={friendname}
                  aria-invalid={validFriendname ? "false" : "true"}
                  onFocus={() => setFriendnameFocus(true)}
                  onBlur={() => setFriendnameFocus(false)}
                  // required
                />
                </div>
                  
                <div className='py-2'>
                <p className='font-semibold'>Your Friend's Email:</p>
                  <input 
                    aria-label="Email" 
                    type="text" 
                    id="Email"
                    autoComplete='off'
                    placeholder="Email:"
                    className='text-sm text-gray-base w-full mr-3 py-5 px-4 h-2 border border-gray-primary 
                      rounded mb-2 focus:outline-[#8BEDF3]' 
                    onChange={(event)=>setEmail(event.target.value)}
                    value={email}
                    aria-invalid={validEmail ? "false" : "true"}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    // required
                  />
                </div>
              
              <div className='flex flex-row justify-around gap-x-4 py-4'>
                  
              <button 
                  className={`${!validEmail || !validFriendname || sentInvite || waiting
                      ? "bg-gray-100 text-gray-400" : "bg-[#8BEDF3] text-white"}  
                      px-5 rounded-xl py-2 border-solid border-2  flex flex-row 
                      items-center justify-center gap-x-2 text-base`}
                  disabled={ (!validEmail  || !validFriendname || sentInvite || waiting ) 
                      ? true : false}
                  onClick={(event)=>handleEmailInvitation(event)}
                  onKeyDown={(event)=>{
                    if (event.key === "Enter") {
                      handleEmailInvitation(event);
                    }
                  }}
                  >

                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  
                  Email

                  {waiting && 
                      <div className='pl-2' aria-label="Loading..." role="status">
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
              </button>

              <button 
                  className={`bg-[#8BEDF3] text-white items-center
                  px-5 rounded-xl py-2 border-solid border-2  flex flex-row 
                  justify-center gap-x-2 text-base`}
                  >

                  <RWebShare
                    data={{
                    text: `Check out my profile on Purchies!`,
                    url: `${`https://purchies.com/profile/${Object.values(auth.roles).includes(3780) ? "store" : "user"}/${auth.username}`}`,
                    title: "Purchies Invite:",
                    }}
                    onClick={() => console.log("shared successfully!")}>
                    <button className='flex justify-center items-center flex-row gap-x-2 py-1 rounded'>

                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                            strokeWidth="1" stroke="currentColor" className="w-6 h-6 hover:cursor-pointer">
                            <path strokeLinecap="round" strokeLinejoin="round" 
                            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                        </svg>

                        Social

                    </button>
                </RWebShare>

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

export default InviteFriendsMenuItem;
        