import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Divider from '@mui/material/Divider';
import SuggestedFollows from '../suggestedFollows/index';
import editNewRequestsFill from '../../helpers/Notifications/editNewRequestsFill';


const AddFollowsMenuItem = ({loggedUserId, setOpenMenu}) => {

  const { auth, setNewTimeline, setNewStoreTimeline, refresh, setRefresh,
    newTimeline, newStoreTimeline, newBanner, setNewBanner,
    newRequests, setNewRequests, browse  } = useAuth();

  const logout = useLogout();

  const [openModal, setOpenModal] = useState(false);
  var waiting = false;
  const [userOrStore, setUserOrStore] = useState(null);
  const [newRequestsFill, setNewRequestsFill] = useState(false);

  useEffect( ()=> {

    if(newRequests){
      setNewRequestsFill(true);
    } 

}, [newRequests])

  const boxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 350,
    height: 500,
    overflowY:'auto',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    flexDirection: "column",
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
    borderRadius: '25px'
};
    
  
  const handleOpen = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setNewRequests(false);

    const openedReqs = await editNewRequestsFill(loggedUserId, auth.accessToken)
      if(openedReqs){
        setNewRequestsFill(false);
      }
    setOpenModal(true);
    
  };

  useEffect( () => {

    if(auth.roles){

        if(auth.roles?.includes(3780)){
            setUserOrStore(2);
        } else {
            setUserOrStore(1);
        }    

    } else {
        setUserOrStore(0);
    }

}, [auth.roles])

  const handleClose = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if(refresh){

      if(setNewTimeline){
        setNewTimeline(!newTimeline)
      }
      if(setNewStoreTimeline){
          setNewStoreTimeline(!newStoreTimeline)
      }
      if(setNewBanner){
        setNewBanner(!newBanner)
      }

      setRefresh(false);
    }

    setOpenModal(false);
    setOpenMenu(false);
  };

  
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
          
        {newRequestsFill ? (
        <svg 
            className="w-6 h-6 mr-2"
            xmlns="http://www.w3.org/2000/svg" 
            fill="#8BEDF3" viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="#8BEDF3" >
          <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" 
          />
          </svg>) :
          
          (<svg 
            className="w-6 h-6 mr-2"
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="#8BEDF3" >
          <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" 
          />
          </svg>)
          }

          <p>Add Follows</p>

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

          <p className="mt-0 mb-2 pl-4 pt-1 text-lg font-bold text-[#8BEDF3]">Add New Follows!</p>
          <Divider />

          <SuggestedFollows loggedUserId={loggedUserId} userOrStore={userOrStore} 
            />
          

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

export default AddFollowsMenuItem;
        