import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import ListItem from '@mui/material/ListItem';

import addUserBlock from '../../../helpers/UserData/addUserBlock';
import removeUserBlock from '../../../helpers/UserData/removeUserBlock';


export default function BlockedListMenuItem({loggedUserId, blockedUsername, blockedUserId, 
    blockedUserProfilePicURL, blockedUsers, changed, setChanged, loggedUserOrStore, roles}){
    
    const {auth, setAuth} = useAuth();
    const [profileUserOrStore, setProfileUserOrStore] = useState(null);
    const [blockedToggle, setBlockedToggle] = useState(false)
    var waiting = false;

    useEffect( () => {

        if(blockedUsers){

            const blockedSwitch = blockedUsers.some(e => e._id === blockedUserId)

            if(blockedSwitch){
                setBlockedToggle(blockedSwitch)
            } else {
                setBlockedToggle(false)
            }

            setAuth(prev => {
                return {
                    ...prev,
                    blockedUsers: blockedUsers
                }
            })
        }

    }, [blockedUsers])


    useEffect( ()=> {

        if(roles){
            if(Object.values(roles).includes(3780)){ 
                setProfileUserOrStore(2);
            } else {
                setProfileUserOrStore(1);
            }
        }

    }, [roles])

        
    async function handleToggle() {

        waiting = true;;

        if(blockedToggle){

            const deleted = await removeUserBlock(loggedUserId, blockedUserId, auth.accessToken)

            if(deleted){
                setBlockedToggle(!blockedToggle);
                setChanged(!changed);
                waiting = false;;
            }

        } else {

            const added = await addUserBlock(loggedUserId, blockedUserId, loggedUserOrStore, profileUserOrStore, auth.accessToken)
            
            if(added){
                setBlockedToggle(!blockedToggle);
                setChanged(!changed);
                waiting = false;;
            }
        }
    }

    return (

        <ListItem className='px-4 w-[300px] sm:w-[350px] md:w-[400px]' >

            <div className='flex justify-between flex-grow'>
                <div className='flex flex-row items-center'>
                    <img src={blockedUserProfilePicURL} className="rounded-full h-12 mr-4 ml-4"/>
                    <p>{blockedUsername.slice(0,20)}{blockedUsername?.length > 20 ? '...' : null}</p>
                </div>

                <div className='flex justify-center items-center'>
                {blockedToggle 
                    ? 
                    (<button 
                        className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                        onClick={handleToggle} 
                        disabled={waiting}>
                            Unblock
                        </button>)
                    
                    : 
                    (<button 
                        className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                        onClick={handleToggle} 
                        disabled={waiting}>
                            Block
                        </button>)
                }

                </div>
            </div>
        </ListItem>
    )
}




