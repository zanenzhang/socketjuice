import React, {useState, useEffect, useMemo} from 'react';
import { useNavigate } from "react-router-dom";
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';

import searchUsers from '../../helpers/Userdata/searchUsers';
import addUserBan from '../../helpers/Bans/addUserBan';
import removeUserBan from '../../helpers/Bans/removeUserBan';
import getAppointmentFlagsAdmin from '../../helpers/Flags/getAppointmentFlagsAdmin';
import removeAppointmentFlag from "../../helpers/Flags/removeAppointmentFlag";

import useAuth from '../../hooks/useAuth';


const AdminPageControl = () => {

    const { auth } = useAuth();
    const [ userList, setUserList] = useState([])
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [changed, setChanged] = useState(0)
    const [firstNameDisplay, setFirstNameDisplay] = useState("")
    const [lastNameDisplay, setLastNameDisplay] = useState("")
    const [appointments, setAppointments] = useState([]);
    
    const navigate = useNavigate();

    const handleFirstName = (e) => {

        debouncedChangeHandlerFirst(e)
        setFirstNameDisplay(e.target.value)
    }
    
    const changeHandlerFirst = (event) => {
    
        if(firstName?.length > 16 || lastName?.length > 16){
            return
        }
        setFirstName(event.target.value);
      };

    const debouncedChangeHandlerFirst = useMemo(
        () => debounce(changeHandlerFirst, 500)
    , []);


    const changeHandlerLast = (event) => {
    
        if(firstName?.length > 16 || lastName?.length > 16){
            return
        }
        setLastName(event.target.value);
    };

    const debouncedChangeHandlerLast = useMemo(
        () => debounce(changeHandlerLast, 500)
    , []);

    const handleLastName = (e) => {

        debouncedChangeHandlerLast(e)
        setLastNameDisplay(e.target.value)
    }

    useEffect ( ()=> {

        async function searchUserList(){

            const users = await searchUsers(firstName, lastName, auth.userId, auth.accessToken)

            if(users){
                setUserList(users?.foundUsers)
            }
        }

        if( (firstName?.length > 1 || lastName?.length > 1) || changed > 0){

            searchUserList()
        }

    }, [firstName, lastName, changed])


    useEffect( ()=> {

        async function getFlaggedAppointments(){

            const appointmentData = await getAppointmentFlagsAdmin(auth.userId, auth.accessToken)

            if(appointmentData && appointmentData?.foundAppointments?.length > 0){

                var userHash = {}

                for(let i=0; i<appointmentData?.userData?.length; i++){
                    if(userHash[appointmentData?.userData[i]._id] !== undefined){
                        userHash[appointmentData.userData[i]._id] = appointmentData.userData[i]
                    }
                }

                for(let i=0; i<appointmentData?.foundAppointments?.flaggedBy?.length; i++){
                    if(userHash[appointmentData?.foundAppointments?.flaggedBy[i]._flaggedByUserId] !== undefined){
                        appointmentData.foundAppointments.flaggedBy[i].flaggedUserData = userHash[appointmentData?.foundAppointments?.flaggedBy[i]._flaggedByUserId]
                    }
                    if(userHash[appointmentData?.foundAppointments?.flaggedBy[i]._violationUserId] !== undefined){
                        appointmentData.foundAppointments.flaggedBy[i].violationUserData = userHash[appointmentData?.foundAppointments?.flaggedBy[i]._violationUserId]
                    }
                }

                setAppointments(appointmentData.foundAppointments)
            }
        }

        if(auth.userId){
            getFlaggedAppointments()
        }


    }, [auth])


    const handleRemoveFlag = (e, appointmentId) => {

        e.preventDefault()

        async function removeFlag(){

            const removed = await removeAppointmentFlag(appointmentId, auth.userId, auth.accessToken)

            if(removed){
                alert("Removed appointment flag")
            }
        }

        removeFlag()
    }
    

    const handleAddBan = (e, userId) => {

        e.preventDefault()

        async function addBan(){

            const response = await addUserBan(auth.userId, userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                alert("Added ban")
                setChanged(changed + 1)
            }
        }

        addBan()
    }

    const handleRemoveBan = (e, userId) => {

        e.preventDefault()

        async function reject(){

            const response = await removeUserBan(auth.userId, userId, auth.accessToken)

            if(response && response.status === 200){
                console.log(response)
                // var userListCopy = userList.filter(e => e._id !== userId)
                // setUserList(userListCopy)
                alert("Removed ban")
                setChanged(changed + 1)
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
        
            <div className='w-full flex flex-col items-center pt-[12vh] overflow-y-auto pb-4'>

                <p className='text-lg font-semibold'>User Search</p>

                <div className='flex flex-row gap-x-2 py-4'> 

                    <input 
                        className='w-full border-2 rounded-xl p-4 mt-1 text-base hover:scale-[1.01] ease-in-out
                            bg-white focus:outline-[#00D3E0] border-[#00D3E0]/10'
                        placeholder="First name"
                        aria-label="Enter first name" 
                        type="text" 
                        onChange={ ( e ) => handleFirstName(e)}
                        value={firstNameDisplay}
                    />

                    <input 
                        className='w-full border-2 rounded-xl p-4 mt-1 text-base hover:scale-[1.01] ease-in-out
                            bg-white focus:outline-[#00D3E0] border-[#00D3E0]/10'
                        placeholder="Last name"
                        aria-label="Enter last name" 
                        type="text" 
                        onChange={ ( e ) => handleLastName(e)}
                        value={lastNameDisplay}
                    />

                </div>


                {userList?.length > 0 ?

                    userList?.map((user) => (

                        <div key={user._id} className='flex flex-row py-6 gap-x-4 items-center justify-center'>

                            <img className='w-[100px] border border-gray-500' src={user.profilePicURL} />

                            <div className='flex flex-row gap-x-1'>
                                <p>{user.firstName}</p>
                                <p>{user.lastName}</p>
                            </div>

                            <div className='flex flex-row w-full gap-x-4'>

                                {!user.deactivated ?
                                
                                <button className='border border-gray-500 px-4 py-2 rounded-xl hover:bg-[#00D3E0]' 
                                    onClick={(e)=>handleAddBan(e, user._id)}>
                                    Add Ban
                                    </button> 
                                    
                                    : 
                                    
                                <button className='border border-gray-500 px-4 py-2 rounded-xl hover:bg-[#00D3E0]' 
                                onClick={(e)=>handleRemoveBan(e, user._id)}>
                                Remove Ban
                                </button>
                                }

                            </div>
                        </div>
                    ))

                : null}
                
            </div>

            <div className='flex flex-col'>

                {appointments?.length > 0 && appointments.map((appointment) => (

                    <div key={appointment._id}>

                        {appointment?.flaggedBy?.length > 0 && appointment?.flaggedBy?.map( (user) => (

                            <div key={user._id} className='py-3'>

                                <p>Flagged By User Id: {user._flaggedByUserId}</p>
                                <p>Flagged By User First Name: {user.flaggedUserData.firstName}</p>
                                <p>Flagged By User Last Name: {user.flaggedUserData.lastName}</p>
                                <p>Flagged By User Phone Number: {user.flaggedUserData.phonePrimary}</p>
                                <p></p>
                                <p>Problem User Id: {user._violationUserId}</p>
                                <p>Problem User First Name: {user.violationUserData.firstName}</p>
                                <p>Problem User Last Name: {user.violationUserData.lastName}</p>
                                <p>Problem User Phone Number: {user.violationUserData.phonePrimary}</p>
                                <p></p>
                                {user.flaggedByDriverOrHost === 1 && <p>Flagged By Driver</p>}
                                {user.flaggedByDriverOrHost === 2 && <p>Flagged By Host</p>}
                                <p>Commentary: {user.comment}</p>

                                <button className='py-2 px-4 border border-gray-500 hover:bg-gray-200' onClick={(e) => handleRemoveFlag(e, appointment._id)}>
                                    Remove Flag
                                </button>

                            </div>
                        ))}

                    </div>
                ))}

            </div>

        </div>

        </>
    );
}

export default AdminPageControl;