import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import useAuth from '../../../hooks/useAuth';

import approvePeopleFollowers from '../../../helpers/Follow/approvePeopleFollowers';
import approvePeopleFollowing from '../../../helpers/Follow/approvePeopleFollowing';
import approveStoreFollowers from '../../../helpers/StoreData/approveStoreFollowers';
import approveStoreFollowing from '../../../helpers/StoreData/approveStoreFollowing';
import settingsEditStoreFollowReceivers from '../../../helpers/Settings/settingsEditStoreReceive';
import settingsEditStoreFollowSubmitters from '../../../helpers/Settings/settingsEditStoreSubmit';
import settingsEditPeopleFollowReceivers from '../../../helpers/Settings/settingsEditPeopleReceive';
import settingsEditPeopleFollowSubmitters from '../../../helpers/Settings/settingsEditPeopleSubmit';

import addFollowApprovedNoti from '../../../helpers/Notifications/addFollowApprovedNoti';


export default function ReceiveListMenuItem({loggedUserId, receiveUsername, receiveUserId, 
    receiveUserProfilePicURL, loggedUserOrStore, roles}){
    
    const {auth} = useAuth();
    const [decisionToggle, setDecisionToggle] = useState(true)
    var waiting = false;
    const [profileUserOrStore, setProfileUserOrStore] = useState(null)

    useEffect( ()=> {

        if(roles){

            if(Object.values(roles)?.includes(3780)){

                setProfileUserOrStore(2)
    
            } else {
    
                setProfileUserOrStore(1)
            }
        }

    }, [roles])
        

    async function handleApprove() {

        if(waiting){
            return
        }

        waiting = true;;

        try{

            if(loggedUserOrStore === 1){

                if(profileUserOrStore === 1){

                    const addedSubmit = await approvePeopleFollowers(loggedUserId, receiveUserId, auth.accessToken)
                    const addedReceive = await approvePeopleFollowing(receiveUserId, loggedUserId, auth.accessToken)

                    if(addedSubmit && addedReceive){

                        const deletedReceive = await settingsEditPeopleFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                        const deletedSubmit = await settingsEditPeopleFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                        if(deletedSubmit && deletedReceive){
                            const addedApprovedNoti = await addFollowApprovedNoti(receiveUserId, loggedUserId, auth.accessToken);
                            if(addedApprovedNoti){
                                setDecisionToggle(false)
                                waiting = false;;
                            }                        
                        }
                    }

                } else {

                    const addedSubmit = await approveStoreFollowers(loggedUserId, receiveUserId, auth.accessToken)
                    const addedReceive = await approvePeopleFollowing(receiveUserId, loggedUserId, auth.accessToken)

                    if(addedSubmit && addedReceive){

                        const deletedReceive = await settingsEditStoreFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                        const deletedSubmit = await settingsEditPeopleFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                        if(deletedSubmit && deletedReceive){
                            const addedApprovedNoti = await addFollowApprovedNoti(receiveUserId, loggedUserId, auth.accessToken);
                            if(addedApprovedNoti){
                                setDecisionToggle(false);
                                waiting = false;;
                            }
                        }
                    }
                }

            } else {

                if(profileUserOrStore === 1){

                    const addedSubmit = await approvePeopleFollowers(loggedUserId, receiveUserId, auth.accessToken)
                    const addedReceive = await approveStoreFollowing(receiveUserId, loggedUserId, auth.accessToken)

                    if(addedSubmit && addedReceive){

                        const deletedReceive = await settingsEditPeopleFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                        const deletedSubmit = await settingsEditStoreFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                        if(deletedSubmit && deletedReceive){
                            const addedApprovedNoti = await addFollowApprovedNoti(receiveUserId, loggedUserId, auth.accessToken);
                            if(addedApprovedNoti){
                                setDecisionToggle(false);
                                waiting = false;;
                            }
                        }
                    }

                } else {

                    const addedSubmit = await approveStoreFollowers(loggedUserId, receiveUserId, auth.accessToken)
                    const addedReceive = await approveStoreFollowing(receiveUserId, loggedUserId, auth.accessToken)

                    if(addedSubmit && addedReceive){

                        const deletedReceive = await settingsEditStoreFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                        const deletedSubmit = await settingsEditStoreFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                        if(deletedSubmit && deletedReceive){
                            const addedApprovedNoti = await addFollowApprovedNoti(receiveUserId, loggedUserId, auth.accessToken);
                            if(addedApprovedNoti){
                                setDecisionToggle(false);
                                waiting = false;
                            }
                        }
                    }
                }
            }

        } catch(err) {

            console.log(err)
        }
    }

    async function handleReject() {

        if(waiting){
            return
        }

        waiting = true;;

        try {

            if(loggedUserOrStore === 1){

                if(profileUserOrStore === 1){

                    const deletedReceive = await settingsEditPeopleFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                    const deletedSubmit = await settingsEditPeopleFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                    if(deletedSubmit && deletedReceive){
                        setDecisionToggle(false)
                        waiting = false;;
                    }

                } else {

                    const deletedReceive = await settingsEditStoreFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                    const deletedSubmit = await settingsEditPeopleFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                    if(deletedSubmit && deletedReceive){
                        setDecisionToggle(false);
                        waiting = false;;
                    }
                }

            } else {

                if(profileUserOrStore === 1){

                    const deletedReceive = await settingsEditPeopleFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                    const deletedSubmit = await settingsEditStoreFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                    if(deletedSubmit && deletedReceive){
                        setDecisionToggle(false);
                        waiting = false;;
                    }

                } else {

                    const deletedReceive = await settingsEditStoreFollowReceivers(loggedUserId, receiveUserId, auth.accessToken)
                    const deletedSubmit = await settingsEditStoreFollowSubmitters(receiveUserId, loggedUserId, auth.accessToken)

                    if(deletedSubmit && deletedReceive){
                        setDecisionToggle(false);
                        waiting = false;;
                    }
                }
            }

        } catch(err) {

            console.log(err)
        }
    }

    return (

        <div className='py-3'>

        {decisionToggle ? (
            <>
            <div className='w-[300px] sm:w-[350px] md:w-[400px]'>

                <div className='w-full flex justify-between'>

                    <div className='flex flex-row items-center'>
                        <img src={receiveUserProfilePicURL} className="rounded-full h-12 mr-2"/>
                        <p>{receiveUsername.slice(0,20)}{receiveUsername.length > 20 ? '...' : null}</p>
                    </div>
                
                    <div className='flex flex-row gap-x-2'> 
                        <button 
                            className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                            onClick={handleApprove}>
                                Accept
                        </button>
                        <button 
                            className="w-30 px-3 py-2 text-center text-sm border-gray-base text-black bg-white border border-[#8BEDF3] hover:bg-[#8BEDF3] hover:text-white cursor-pointer rounded-2xl" 
                            onClick={handleReject}>
                                Reject
                        </button>
                    </div>
                </div>

            </div>
            </>
        ) : (
            null
        ) }

        </div>
    )
}






