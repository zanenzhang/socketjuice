import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';

import getUserStatus from '../../helpers/Approval/getUserStatus';
import approvePhotos from '../../helpers/Approval/approvePhotos';
import rejectUser from '../../helpers/Approval/rejectUser';

import getHostsCheck from '../../helpers/Approval/getHostsCheck';
import approveHost from '../../helpers/Approval/approveHost';
import rejectHost from '../../helpers/Approval/rejectHost';

import useAuth from '../../hooks/useAuth';



const AdminPage = () => {

    const { auth, activeTab, setActiveTab  } = useAuth();
    const [userList, setUserList] = useState([])
    const [hostList, setHostList] = useState([])
    const [changed, setChanged] = useState(false);
    
    const navigate = useNavigate();
    
    
    useEffect( ()=> {

        setActiveTab("admin")

        async function getUsersList(){

            const response = await getUserStatus(auth.userId, auth.accessToken)

            if(response){

                var driverData = {}
                var hostData = {}

                for(let i=0; i<response?.foundDrivers?.length; i++){
                    if(driverData[response?.foundDrivers[i]._userId] === undefined){
                        driverData[response?.foundDrivers[i]._userId] = response?.foundDrivers[i]
                    }
                }

                for(let i=0; i<response?.foundHosts?.length; i++){
                    if(hostData[response?.foundHosts[i]._userId] === undefined){
                        hostData[response?.foundHosts[i]._userId] = response?.foundHosts[i]
                    }
                }

                for(let i=0; i<response?.users?.length; i++){
                    if(driverData[response.users[i]._id]){
                        response.users[i].driver = driverData[response.users[i]._id]
                    }
                    if(hostData[response.users[i]._id]){
                        response.users[i].host = hostData[response.users[i]._id]
                    }
                }

                console.log(response?.users)
                setUserList(response?.users)
            }
        }

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
            getUsersList()
            getHostsList()
        }

    }, [auth.userId, changed])


    const handleApproveUser = (e, userId) => {

        e.preventDefault()

        async function approve(){

            console.log(userId, auth.userId, auth.accessToken)
            const response = await approvePhotos(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(!changed)
            }
        }

        approve()
    }

    const handleRejectUser = (e, userId) => {

        e.preventDefault()

        async function reject(){

            const response = await rejectUser(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(!changed)
            }
        }

        reject()
    }
    

    const handleApproveHost = (e, userId) => {

        e.preventDefault()

        async function approve(){

            console.log(userId, auth.userId, auth.accessToken)
            const response = await approveHost(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(!changed)
            }
        }

        approve()
    }

    const handleRejectHost = (e, userId) => {

        e.preventDefault()

        async function reject(){

            const response = await rejectHost(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                setChanged(!changed)
            }
        }

        reject()
    }


    return(

        <>

        <div className='flex flex-col w-full h-full'>

            <MainHeader 
                loggedUserId={auth.userId} loggedFirstName={auth.firstName} 
                profilePicURL={auth.profilePicURL} roles={auth.roles}
            />

            <div className='w-full flex flex-col items-center pt-[12vh] h-[800px] overflow-y-auto'>

                <p className='text-lg font-semibold'>Users to Check</p>

                {userList?.length > 0 ?

                    userList?.map((user) => (

                        <div key={user._id} className='flex flex-col py-10'>

                            <p>{user._id}</p>
                            <p>{user.firstName} {user.lastName}</p>
                            <p>{user.host.address}</p>
                            <p>{user.phonePrimary}</p>
                            <p>{user.host.city}, {user.host.region}</p>

                            <img className='w-[250px]' src={user.profilePicURL} />

                            <div className='flex flex-row'>

                                <img className='w-[250px]' src={user.driverMediaURL} />
                                <img className='w-[250px]' src={user.plateMediaURL} />

                            </div>

                            <div className='flex flex-row w-full justify-between'>

                                <button onClick={(e)=>handleRejectUser(e, user._id)}>
                                    Reject User
                                    </button>

                                <button onClick={(e)=>handleApproveUser(e, user._id)}>
                                    Approve User
                                    </button>

                            </div>
                        </div>
                    ))

                : null}
                
            </div>
        
            <div className='w-full flex flex-col items-center pt-[12vh] h-[800px] overflow-y-auto'>

                <p className='text-lg font-semibold'>Hosts to Check</p>

                {hostList?.length > 0 ?

                    hostList?.map((host) => (

                        <div key={host._id} className='flex flex-col py-10'>

                            <p>{host._id}</p>
                            <p>{host.firstName} {host.lastName}</p>
                            <p>Address: {host.host.address}</p>
                            <p>Phone: {host.phonePrimary}</p>
                            <p>Connection: {host.host.connectionType}</p>
                            <p>Adapter: {host.host.secondaryConnectionType}</p>
                            <p>Level: {host.host.chargingLevel}</p>
                            <p>{host.host.city}, {host.host.region}</p>

                            <img className='w-[250px]' src={host.profilePicURL} />

                            <div className='flex flex-wrap'>

                                {host?.host?.mediaCarouselURLs?.map((image) => (

                                    <img className='w-[250px]' src={image} />
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