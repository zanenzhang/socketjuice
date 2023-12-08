import React, {useState, useEffect} from 'react';
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';

import addNewPayoutManual from '../../helpers/Paypal/addNewPayoutManual';
import rejectPayout from "../../helpers/Paypal/rejectPayout";
import getPayoutRequests from '../../helpers/Paypal/getPayoutRequests';

import useAuth from '../../hooks/useAuth';


const AdminPageControl = () => {

    const { auth } = useAuth();
    const [ userList, setUserList] = useState([])
    const [changed, setChanged] = useState(0)
    const [waiting, setWaiting] = useState(false);
    

    const handleSubmitPayout = async (e, userId) => {

        e.preventDefault()

        if(waiting){
            return
        }
        setWaiting(true)

        const submitted = await addNewPayoutManual(userId, auth?.userId, auth?.accessToken)

        if(submitted){
            console.log(submitted)
            setWaiting(false)
            setChanged(changed + 1)
        }

    }

    const handleRejectPayout = async (e, userId) => {

        e.preventDefault()

        if(waiting){
            return
        }
        setWaiting(true)

        const rejected = await rejectPayout(userId, auth?.userId, auth?.accessToken)

        if(rejected){
            console.log(rejected)
            setWaiting(true)
            setChanged(changed + 1)
        }
    }

    useEffect( ()=> {

        async function getPayouts(){

            const payoutData = await getPayoutRequests(auth.userId, auth.accessToken)

            if(payoutData){

                console.log(payoutData)

                var incomingData = {}
                var outgoingData = {}

                for(let i=0; i<payoutData?.incomingPayments?.length; i++){

                    if(incomingData[payoutData.incomingPayments[i]._receivingUserId] == undefined){
                        incomingData[payoutData.incomingPayments[i]._receivingUserId] = {}
                    } 

                    if(incomingData[payoutData.incomingPayments[i]._receivingUserId][payoutData.incomingPayments[i].currency] !== undefined){
                        incomingData[payoutData.incomingPayments[i]._receivingUserId][payoutData.incomingPayments[i].currency] = incomingData[payoutData.incomingPayments[i]._receivingUserId][payoutData.incomingPayments[i].currency] + payoutData.incomingPayments[i].amount
                    } else {
                        incomingData[payoutData.incomingPayments[i]._receivingUserId][payoutData.incomingPayments[i].currency] = payoutData.incomingPayments[i].amount
                    }
                }

                for(let i=0; i<payoutData?.outgoingPayments?.length; i++){
                    
                    if(outgoingData[payoutData.outgoingPayments[i]._sendingUserId] == undefined){
                        outgoingData[payoutData.outgoingPayments[i]._sendingUserId] = {}
                    } 
                    
                    if(outgoingData[payoutData.outgoingPayments[i]._sendingUserId][payoutData.outgoingPayments[i].currency] !== undefined){
                        outgoingData[payoutData.outgoingPayments[i]._sendingUserId][payoutData.outgoingPayments[i].currency] = outgoingData[payoutData.outgoingPayments[i]._sendingUserId][payoutData.outgoingPayments[i].currency] + payoutData.outgoingPayments[i].amount
                    } else {
                        outgoingData[payoutData.outgoingPayments[i]._sendingUserId][payoutData.outgoingPayments[i].currency] = payoutData.outgoingPayments[i].amount
                    }
                }

                for(let i=0; i<payoutData?.foundUsers?.length; i++){

                    if(outgoingData[payoutData?.foundUsers[i]._id] !== undefined){
                        payoutData.foundUsers[i].outgoingData = outgoingData[payoutData?.foundUsers[i]._id]
                    }
                    if(incomingData[payoutData?.foundUsers[i]._id] !== undefined){
                        payoutData.foundUsers[i].incomingData = incomingData[payoutData?.foundUsers[i]._id]
                    }
                }

                console.log(payoutData.foundUsers)
                setUserList(payoutData.foundUsers)
            }
        }

        if(auth.userId){
            getPayouts()
        }


    }, [auth, changed])


    

    return(

        <>

        <div className='flex flex-col w-full h-full'>

            <MainHeader 
                loggedUserId={auth.userId} loggedFirstName={auth.firstName} 
                profilePicURL={auth.profilePicURL}
            />
        
            <div className='w-full flex flex-col items-center pt-[12vh] overflow-y-auto pb-4'>

                {userList?.length > 0 ?

                    userList?.map((user) => (

                        <div key={user._id} className='flex flex-row py-6 gap-x-4 items-center justify-center'>

                            <img className='w-[100px] border border-gray-500' src={user.profilePicURL} />

                            <div className='flex flex-row gap-x-1'>
                                <p>{user.firstName}</p>
                                <p>{user.lastName}</p>
                            </div>

                            <div className='flex flex-col justify-center items-center'>
                                {Object.entries(user.incomingData).map((incoming) => (
                                    <div key={incoming._id} className='flex flex-col justify-center items-center'>
                                        <p>Incoming Payments:</p>
                                        <p >{incoming.slice(0,2)}{incoming.slice(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className='flex flex-col justify-center items-center'>
                                {Object.entries(user.outgoingData).map((outgoing) => (
                                    <div key={outgoing._id} className='flex flex-col justify-center items-center'>
                                        <p>Outgoing Payments:</p>
                                        <p >{outgoing.slice(0,2)}{outgoing.slice(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <p>{user.requestedPayoutCurrency}{user.requestedPayoutOption}</p>
                            </div>

                            <div className='flex flex-row w-full gap-x-4'>
                                
                                <button 
                                disabled={waiting}
                                className='border border-gray-500 px-4 py-2 rounded-xl hover:bg-[#00D3E0] flex flex-row gap-x-2' 
                                    onClick={(e)=>handleSubmitPayout(e, user._id)}>
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
                                    Approve Payout
                                    </button> 
                                    
                                <button 
                                disabled={waiting}
                                className='border border-gray-500 px-4 py-2 rounded-xl hover:bg-[#00D3E0] flex flex-row gap-x-2' 
                                    onClick={(e)=>handleRejectPayout(e, user._id)}>
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
                                    Reject Payout
                                </button>

                            </div>
                        </div>
                    ))

                : null}
                
            </div>

        </div>

        </>
    );
}

export default AdminPageControl;