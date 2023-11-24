import React, {useState, useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';

// import "./mainHeader.css";
import useAuth from '../../hooks/useAuth';

import editNewMessagesFill from '../../helpers/Notifications/editNewMessagesFill';


const LowerHeader = ({loggedUserId, loggedUsername, profilePicURL, roles, socket, setSocket,
        socketConnected, setSocketConnected} ) => {

    const { newMessages, setNewMessages, auth, browse } = useAuth();
    const navigate = useNavigate();
    const [newMessagesFill, setNewMessagesFill] = useState(false);
    const [userOrStore, setUserOrStore] = useState(null);
    const [lowerSearchSwitch, setLowerSearchSwitch] = useState(false);
    
        
    useEffect( () => {

        if(roles){
            if(roles?.includes(3780)){
                setUserOrStore(2);
            } else {
                setUserOrStore(1);
            }    
        } else {
            setUserOrStore(0);
        }

    }, [roles])


    const handleMessagesClick =  async (event) => {
        if(!auth.userId || browse === 'yes'){
            navigate('/map');
            return
        }
        event.preventDefault();
        const openedMsgs = await editNewMessagesFill(loggedUserId, auth.accessToken)
        if(openedMsgs){
            setNewMessages(false);
            setNewMessagesFill(false);
            navigate('/messages');
        }
    }

    useEffect( ()=> {

        if(newMessages){
            setNewMessagesFill(true);
        }

    }, [newMessages])

    return (
        <>        
        <div className="flex flex-row justify-evenly w-full overflow-auto px-6">

                <div className='flex flex-col items-center sm:hidden'>
                    <Link reloadDocument to={ROUTES.DASHBOARD} aria-label="PeopleDashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                            strokeWidth="1.5" stroke="#8BEDF3" 
                            className="mx-3 w-6 sm:w-7 md:w-8 sm:mx-4 
                                text-black-light cursor-pointer 
                                transform transition duration-300 hover:scale-125"
                            >
                            <path strokeLinecap="round" strokeLinejoin="round" 
                            d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                        </svg>
                    </Link>
                    <p className='text-[11px] sm:hidden text-[#8BEDF3]'>Social</p>
                </div>

                <div className='flex flex-col items-center sm:hidden'>
                    <Link reloadDocument to={ROUTES.STORE_DASHBOARD} aria-label="StoreDashboard">
                        <svg 
                            className="mx-3 w-6 sm:w-7 md:w-8 sm:mx-4
                            text-black-light cursor-pointer transform transition duration-300 hover:scale-125"
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" viewBox="0 0 24 24" 
                            stroke="#8BEDF3"
                        >
                        <path 
                            strokeLinecap="round"  
                            strokeLinejoin="round" 
                            strokeWidth={1.5}
                            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>
                        </svg>
                    </Link>
                    <p className='text-[11px] sm:hidden text-[#8BEDF3]'>Shop</p>
                </div>

                <div className='flex flex-col items-center sm:hidden'>
                
                {newMessagesFill ? (
                
                <button onClick={(event)=>handleMessagesClick(event)}>
                    <svg 
                        className="mx-3 w-6 sm:w-7 md:w-8 sm:mx-4 
                        text-black-light cursor-pointer transform transition duration-300 hover:scale-125"
                        xmlns="http://www.w3.org/2000/svg" 
                        fill='#CBC3E3' viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="#8BEDF3"
                    >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" 
                    />
                    </svg>
                </button>) 
                
                : 
                (
                
                <button onClick={(event)=>handleMessagesClick(event)}>
                    <svg 
                        className="mx-3 w-6 sm:w-7 md:w-8 sm:mx-4 
                        text-black-light cursor-pointer transform transition duration-300 hover:scale-125"
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="#8BEDF3"
                    >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" 
                    />
                    </svg>
                </button>
                )}

            <p className='text-[11px] sm:hidden text-[#8BEDF3]'>Chat</p>

            </div>

        </div>
        </>
    )
}

export default LowerHeader;
