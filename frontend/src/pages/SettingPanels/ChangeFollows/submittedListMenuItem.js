import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import useAuth from '../../../hooks/useAuth';

import addPeopleFollowers from '../../../helpers/Follow/addPeopleFollowers';
import addPeopleFollowing from '../../../helpers/Follow/addPeopleFollowing';
import removePeopleFollowing from '../../../helpers/Follow/removePeopleFollowing';
import removePeopleFollowers from '../../../helpers/Follow/removePeopleFollowers';
import addStoreFollowers from '../../../helpers/StoreData/addStoreFollowers';
import addStoreFollowing from '../../../helpers/StoreData/addStoreFollowing';
import removeStoreFollowers from '../../../helpers/StoreData/removeStoreFollowers';
import removeStoreFollowing from '../../../helpers/StoreData/removeStoreFollowing';

import addPeopleFollowReceivers from '../../../helpers/Follow/addPeopleFollowReceive';
import addPeopleFollowSubmitters from '../../../helpers/Follow/addPeopleFollowSubmit';
import editPeopleFollowReceivers from '../../../helpers/Follow/editPeopleFollowReceive';
import editPeopleFollowSubmitters from '../../../helpers/Follow/editPeopleFollowSubmit';
import addStoreFollowReceivers from '../../../helpers/StoreData/addStoreFollowReceive';
import addStoreFollowSubmitters from '../../../helpers/StoreData/addStoreFollowSubmit';
import editStoreFollowReceivers from '../../../helpers/StoreData/editStoreFollowReceive';
import editStoreFollowSubmitters from '../../../helpers/StoreData/editStoreFollowSubmit';

import addFollowNoti from '../../../helpers/Notifications/addFollowNoti';
import addFollowRequestedNoti from '../../../helpers/Notifications/addFollowRequestedNoti';


export default function SubmittedListMenuItem({loggedUserId, requestedUsername, requestedUserId, 
    requestedUserProfilePicURL, changedData, setChangedData, privacySetting,
    loggedUserOrStore, roles}){
    
    const {auth} = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isRequested, setIsRequested] = useState(true);
    const [notFollowing, setNotFollowing] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    var waiting = false;
    const [profileUserOrStore, setProfileUserOrStore] = useState(null);
    
    useEffect( ()=> {

        async function getData(){

            if(privacySetting === 2){
                setIsPrivate(true)
            } else {
                setIsPrivate(false)
            }

            if(Object.values(roles).includes(3780)){ 
                setProfileUserOrStore(2);
            } else {
                setProfileUserOrStore(1);
            }

            setIsFollowing(false);
            setNotFollowing(false);
            setIsRequested(true);
        }

        if(privacySetting && roles){
            getData();
        }
        
    }, [roles, privacySetting])

        
    const handleToggle = async () => {

        if(waiting || loggedUserId === requestedUserId){
            return
        }
        
        waiting = true;;

        if (isFollowing){

            if(profileUserOrStore === 1){

                if(loggedUserOrStore === 1){

                    const doneFollowing = await removePeopleFollowing(loggedUserId, requestedUserId, auth.accessToken)
                    const doneFollowers = await removePeopleFollowers(requestedUserId, loggedUserId, auth.accessToken)
                    
                    if(doneFollowing && doneFollowers){
                        setIsFollowing(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }

                } else {

                    const doneFollowing = await removePeopleFollowing(loggedUserId, requestedUserId, auth.accessToken)
                    const doneFollowers = await removeStoreFollowers(requestedUserId, loggedUserId, auth.accessToken)
                    
                    if(doneFollowing && doneFollowers){
                        setIsFollowing(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }
                }

            } else {

                if(loggedUserOrStore === 1){

                    const doneFollowing = await removeStoreFollowing(loggedUserId, requestedUserId, auth.accessToken)
                    const doneFollowers = await removePeopleFollowers(requestedUserId, loggedUserId, auth.accessToken)
                    
                    if(doneFollowing && doneFollowers){
                        setIsFollowing(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }

                } else {

                    const doneFollowing = await removeStoreFollowing(loggedUserId, requestedUserId, auth.accessToken)
                    const doneFollowers = await removeStoreFollowers(requestedUserId, loggedUserId, auth.accessToken)
                    
                    if(doneFollowing && doneFollowers){
                        setIsFollowing(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }
                }
            }    
        } 

        if(notFollowing){

            if(isPrivate){

                if(loggedUserOrStore === 1){

                    if(profileUserOrStore === 1){

                        const submitted = await addPeopleFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                        const received = await addPeopleFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(submitted && received){
                            const addedFollowRequestedNoti = await addFollowRequestedNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowRequestedNoti){
                                setNotFollowing(false);
                                setIsRequested(true);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }

                    } else {

                        const submitted = await addStoreFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                        const received = await addPeopleFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(submitted && received){
                            const addedFollowRequestedNoti = await addFollowRequestedNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowRequestedNoti){
                                setNotFollowing(false);
                                setIsRequested(true);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }

                    }

                } else {

                    if(profileUserOrStore === 1){

                        const submitted = await addPeopleFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                        const received = await addStoreFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(submitted && received){
                            const addedFollowRequestedNoti = await addFollowRequestedNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowRequestedNoti){
                                setNotFollowing(false);
                                setIsRequested(true);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }

                    } else {

                        const submitted = await addStoreFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                        const received = await addStoreFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(submitted && received){
                            const addedFollowRequestedNoti = await addFollowRequestedNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowRequestedNoti){
                                setNotFollowing(false);
                                setIsRequested(true);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }   
                    }
                }
            
            } else {

                if(loggedUserOrStore === 1){

                    if(profileUserOrStore === 1){

                        const doneFollowing = await addPeopleFollowing(loggedUserId, requestedUserId, auth.accessToken)
                        const doneFollowers = await addPeopleFollowers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(doneFollowing && doneFollowers){
                            const addedFollowNoti = await addFollowNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowNoti){
                                setIsFollowing(true);
                                setNotFollowing(false);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }

                    } else {

                        const doneFollowing = await addStoreFollowing(loggedUserId, requestedUserId, auth.accessToken)
                        const doneFollowers = await addPeopleFollowers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(doneFollowing && doneFollowers){
                            const addedFollowNoti = await addFollowNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowNoti){
                                setIsFollowing(true);
                                setNotFollowing(false);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }
                    }

                } else {

                    if(profileUserOrStore === 1){

                        const doneFollowing = await addPeopleFollowing(loggedUserId, requestedUserId, auth.accessToken)
                        const doneFollowers = await addStoreFollowers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(doneFollowing && doneFollowers){
                            const addedFollowNoti = await addFollowNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowNoti){
                                setIsFollowing(true);
                                setNotFollowing(false);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }

                    } else {

                        const doneFollowing = await addStoreFollowing(loggedUserId, requestedUserId, auth.accessToken)
                        const doneFollowers = await addStoreFollowers(requestedUserId, loggedUserId, auth.accessToken)
        
                        if(doneFollowing && doneFollowers){
                            const addedFollowNoti = await addFollowNoti(requestedUserId, loggedUserId, auth.accessToken)
                            if(addedFollowNoti){
                                setIsFollowing(true);
                                setNotFollowing(false);
                                setChangedData(!changedData);
                                waiting = false;;
                            }
                        }
                    }
                }
            }
        }

        if(isRequested){

            if(loggedUserOrStore === 1){

                if(profileUserOrStore === 1){

                    const removeSubmit = await editPeopleFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                    const removeReceive = await editPeopleFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                    if(removeSubmit && removeReceive){
                        setIsRequested(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }

                } else {

                    const removeSubmit = await editStoreFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                    const removeReceive = await editPeopleFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                    if(removeSubmit && removeReceive){
                        setIsRequested(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }
                }

            } else {

                if(profileUserOrStore === 1){

                    const removeSubmit = await editPeopleFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                    const removeReceive = await editStoreFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                    if(removeSubmit && removeReceive){
                        setIsRequested(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }

                } else {

                    const removeSubmit = await editStoreFollowSubmitters(loggedUserId, requestedUserId, auth.accessToken)
                    const removeReceive = await editStoreFollowReceivers(requestedUserId, loggedUserId, auth.accessToken)
        
                    if(removeSubmit && removeReceive){
                        setIsRequested(false);
                        setNotFollowing(true);
                        setChangedData(!changedData);
                        waiting = false;;
                    }
                }
            }
        }
    }
    
    return (

        <ListItem className='px-4 w-[300px] sm:w-[350px] md:w-[400px]'>

            <div className='flex justify-between flex-grow'>
                
                <div className='flex flex-row items-center'>
                    <img src={requestedUserProfilePicURL} className="rounded-full h-12 mr-4 ml-4"/>
                    <p>{requestedUsername.slice(0,20)}{requestedUsername?.length > 20 ? '...' : null}</p>
                </div>

                <div className='flex justify-center items-center'>
                    
                    <button 
                        className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                        onClick={handleToggle} 
                        disabled={waiting}>

                        {isFollowing ? 'Unfollow' : null}
                        {isRequested ? 'Unrequest' : null}
                        { (notFollowing && !isPrivate) ? 'Follow' : null}
                        { (notFollowing && isPrivate) ? 'Request' : null}
                    </button>
                </div>
            </div>

        </ListItem>
        
    )
}






