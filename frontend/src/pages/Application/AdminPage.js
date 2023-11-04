import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import axios from '../../api/axios';

import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from 'react-router';

import getUserStatus from '../../helpers/Approval/getUserStatus';
import approvePhotos from '../../helpers/Approval/approvePhotos';
import rejectUser from '../../helpers/Approval/rejectUser';


import useAuth from '../../hooks/useAuth';



const AdminPage = () => {

    const { auth, activeTab, setActiveTab  } = useAuth();
    const [userList, setUserList] = useState([])
    
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

        console.log(auth.userId, auth.accessToken)
        if(auth.userId && auth.accessToken){
            getUsersList()
        }

    }, [auth.userId])


    const handleApproveUser = (e, userId) => {

        e.preventDefault()

        async function approve(){

            console.log(userId, auth.userId, auth.accessToken)
            const response = await approvePhotos(userId, auth.userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                var userListCopy = userList.filter(e => e._id !== userId)
                setUserList(userListCopy)
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
                var userListCopy = userList.filter(e => e._id !== userId)
                setUserList(userListCopy)
            }
        }

        reject()
    }
    

    return(

        <>

        <div className='flex flex-col w-full h-full'>

            <MainHeader 
                loggedUserId={auth.userId} loggedUsername={auth.username} 
                profilePicURL={auth.profilePicURL} roles={auth.roles}
            />

            <div className='w-full flex flex-col justify-center items-center pt-[10vh]'>

                {userList?.length > 0 ?

                    userList.map((user) => (

                        <div key={user._id} className='flex flex-col py-10'>

                            <p>{user._id}</p>
                            <p>{user.firstName} {user.lastName}</p>
                            <p>{user.host.address}</p>
                            <p>{user.phonePrimary}</p>
                            <p>{user.host.city}, {user.host.region}</p>

                            <img className='w-[250px]' src={user.profilePicURL} />

                            <div className='flex flex-row'>

                                <img className='w-[250px]' src={user.frontMediaURL} />
                                <img className='w-[250px]' src={user.backMediaURL} />

                            </div>

                            <div className='flex flex-row w-full justify-between'>

                                <button onClick={(e)=>handleRejectUser(e, user._id)}>
                                    Reject
                                    </button>

                                <button onClick={(e)=>handleApproveUser(e, user._id)}>
                                    Approve
                                    </button>

                            </div>
                        </div>
                    ))

                : null}
                
            </div>
        </div>

        <ToastContainer
            toastStyle={{ backgroundColor: "#00D3E0" }}
                position="bottom-center"
                autoClose={7000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />

        </>
    );
}

export default AdminPage;