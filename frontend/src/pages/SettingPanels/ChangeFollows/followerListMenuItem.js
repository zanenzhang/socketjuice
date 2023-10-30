import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import useAuth from '../../../hooks/useAuth';

import settingsRemovePeopleFollowers from '../../../helpers/Settings/settingsRemovePeopleFollowers';
import settingsRemovePeopleFollowing from '../../../helpers/Settings/settingsRemovePeopleFollowing';
import settingsRemoveStoreFollowers from '../../../helpers/Settings/settingsRemoveStoreFollowers';
import settingsRemoveStoreFollowing from '../../../helpers/Settings/settingsRemoveStoreFollowing';


export default function FollowerListMenuItem({loggedUserId, followerUsername, followerUserId, 
    followerUserProfilePicURL, loggedUserOrStore, roles}){
    
    const {auth} = useAuth();
    const [followerToggle, setFollowerToggle] = useState(true);
    var waiting = false;
    const [profileUserOrStore, setProfileUserOrStore] = useState(null);
        
    async function handleToggle() {

        if(waiting){
            return
        }

        waiting = true;;

        if(followerToggle){

            if(loggedUserOrStore === 2){

                if (profileUserOrStore === 1){

                    const deletedFollower = await settingsRemovePeopleFollowers( loggedUserId, followerUserId, auth.accessToken )
                    const deletedFollowing = await settingsRemoveStoreFollowing( followerUserId, loggedUserId, auth.accessToken )

                    if( deletedFollower && deletedFollowing ){
                        setFollowerToggle(false);
                        waiting = false;;
                    }

                } else {

                    const deletedFollower = await settingsRemoveStoreFollowers(loggedUserId, followerUserId, auth.accessToken )
                    const deletedFollowing = await settingsRemoveStoreFollowing( followerUserId, loggedUserId, auth.accessToken )

                    if( deletedFollower && deletedFollowing ){
                        setFollowerToggle(false);
                        waiting = false;;
                    }
                    
                }

            } else {

                if (profileUserOrStore === 1){

                    const deletedFollower = await settingsRemovePeopleFollowers(loggedUserId, followerUserId, auth.accessToken )
                    const deletedFollowing = await settingsRemovePeopleFollowing( followerUserId, loggedUserId, auth.accessToken )

                    if( deletedFollower && deletedFollowing ){
                        setFollowerToggle(false);
                        waiting = false;;
                    }

                } else {

                    const deletedFollower = await settingsRemoveStoreFollowers(loggedUserId, followerUserId, auth.accessToken)
                    const deletedFollowing = await settingsRemovePeopleFollowing( followerUserId, loggedUserId, auth.accessToken )

                    if( deletedFollower && deletedFollowing ){
                        setFollowerToggle(false);
                        waiting = false;;
                    }

                }
            }
        } 
    }

    useEffect( ()=> {

        if(roles){
            if(Object.values(roles)?.includes(3780)){
                setProfileUserOrStore(2)
            } else {
                setProfileUserOrStore(1)
            }
        }

    }, [roles])

    return (
        
        <>

            {followerToggle ? 
                
                (

                    <ListItem className='px-4 w-[300px] sm:w-[350px] md:w-[400px]'>
                        
                        <div className='flex justify-between flex-grow'>
                            <div className='flex flex-row items-center'>
                                <img src={followerUserProfilePicURL} className="rounded-full h-12 mr-4 ml-4"/>
                                <p>{followerUsername.slice(0,20)}{followerUsername.length > 20 ? '...' : null} </p>
                            </div>
                            <div className='flex justify-center items-center'>
                                <button 
                                    className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                                     onClick={handleToggle} disabled={waiting}>
                                        Remove
                                </button>
                            </div>
                        </div>
                    </ListItem>
            
            ) : null  }

        </>
        
    )

}
