import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';

import getHostsCheck from '../../helpers/Approval/getHostsCheck';
import approveHost from '../../helpers/Approval/approveHost';
import rejectHost from '../../helpers/Approval/rejectHost';

import useAuth from '../../hooks/useAuth';


const AdminPage = () => {

    const { auth, activeTab, setActiveTab  } = useAuth();
    const [userList, setUserList] = useState([])
    const [hostList, setHostList] = useState([])
    const [changed, setChanged] = useState(0);
    const [waiting, setWaiting] = useState(false);
    
    const navigate = useNavigate();
    
    
    useEffect( ()=> {

        setActiveTab("admin")

        async function getHostsList(){

            const response = await getHostsCheck(auth.userId, auth.accessToken)

            if(response){

                console.log(response)

                var hostData = {}

                for(let i=0; i<response?.foundHosts?.length; i++){
                    if(hostData[response?.foundHosts[i]._userId] === undefined){
                        hostData[response?.foundHosts[i]._userId] = response?.foundHosts[i]
                    }
                }

                for(let i=0; i<response?.users?.length; i++){
                    if(hostData[response.users[i]._id]){
                        response.users[i].host = hostData[response.users[i]._id]
                    }
                }

                setHostList(response?.users)
            }
        }

        console.log(auth.userId, auth.accessToken)
        if(auth.userId && auth.accessToken){
            getHostsList()
        }

    }, [auth.userId, changed])


    

    const handleApproveHost = (e, userId) => {

        e.preventDefault()
        if(waiting){
            return
        }

        setWaiting(true)

        async function approve(){

            console.log(userId, auth.userId, auth.accessToken)
            const response = await approveHost(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(changed + 1)
                setWaiting(false)
            } else {
                setWaiting(false)
            }
        }

        approve()
    }

    const handleRejectHost = (e, userId) => {

        e.preventDefault()

        if(waiting){
            return
        }

        setWaiting(true)

        async function reject(){

            const response = await rejectHost(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(changed + 1)
                setWaiting(false)
            } else {
                setWaiting(false)
            }
        }

        reject()
    }


    return(

        <>

        <div className='flex flex-col w-full h-full'>

            <MainHeader 
                loggedUserId={auth.userId} loggedFirstName={auth.firstName} 
                profilePicURL={auth.profilePicURL}
            />
        
            <div className='w-full flex flex-col items-center pt-[12vh] overflow-y-auto'>

                <p className='text-lg font-semibold'>Hosts to Check</p>

                {hostList?.length > 0 ?

                    hostList?.map((host) => (

                        <div key={host._id} className='flex flex-col py-10 justify-center items-center'>

                            <p>UserId: {host.host._userId}</p>
                            <p>Name: {host.firstName} {host.lastName}</p>
                            <p>Address: {host.host.address}</p>
                            <p>Phone: {host.phonePrimary}</p>
                            <p>Connection: {host.host.connectionType}</p>
                            <p>Adapter: {host.host.secondaryConnectionType}</p>
                            <p>Level: {host.host.chargingLevel}</p>
                            <p>Currency: {host.host.currency}</p>
                            <p>Charge Rate: {host.host.currencySymbol}{host.host.chargeRatePerHalfHour.toFixed(2)}</p>
                            <p>Charge Rate Fee: {host.host.currencySymbol}{host.host.chargeRatePerHalfHourFee.toFixed(2)}</p>
                            <p>{host.host.city}, {host.host.region}</p>

                            <p>Host Pictures:</p>
                            <img className='w-[250px] border border-gray-400 m-1' src={host.profilePicURL} />

                            <div className='flex flex-wrap gap-1'>

                                {host?.host?.mediaCarouselURLs?.map((image) => (

                                    <img className='w-[250px] border border-gray-400' src={image} />
                                ))}

                            </div>

                            <div className='flex flex-row w-full justify-between'>

                                <button onClick={(e)=>handleRejectHost(e, host._id)}>
                                    Reject Host
                                    </button>

                                <button onClick={(e)=>handleApproveHost(e, host._id)}>
                                    Approve Host
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

export default AdminPage;