import React, {useState, useEffect, useMemo} from 'react';
import { useNavigate } from "react-router-dom";
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';

import searchUsers from '../../helpers/Userdata/searchUsers';
import addUserBan from '../../helpers/Bans/addUserBan';
import removeUserBan from '../../helpers/Bans/removeUserBan';

import useAuth from '../../hooks/useAuth';


const AdminPageControl = () => {

    const { auth } = useAuth();
    const [ userList, setUserList] = useState([])
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [changed, setChanged] = useState(0)
    const [firstNameDisplay, setFirstNameDisplay] = useState("")
    const [lastNameDisplay, setLastNameDisplay] = useState("")
    
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
        
            <div className='w-full flex flex-col items-center pt-[12vh] overflow-y-auto'>

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

        </div>

        </>
    );
}

export default AdminPageControl;