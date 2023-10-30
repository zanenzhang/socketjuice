import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import useLogout from '../../hooks/useLogout';
import socketIO from "socket.io-client";

import editOpenedAlert from '../../helpers/Notifications/editOpenedAlert';

export default function NotificationsDropdown({loggedUsername, loggedUserId, userOrStore}) {
  
  return (
    <>
    
    
    </>
  )
  
}