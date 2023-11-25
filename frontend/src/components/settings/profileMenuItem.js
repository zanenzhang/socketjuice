import React, {useEffect, useState} from 'react'
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { DEFAULT_IMAGE_PATH } from '../../constants/paths';

const ProfileMenuItem = ({loggedUserName, profilePicURL}) => {

  const { auth } = useAuth();
  const [userOrStore, setUserOrStore] = useState(1);

  useEffect( ()=> {

    if(auth?.roles?.includes(3780)){

        setUserOrStore(2)

    } else {

        setUserOrStore(1)

    }

  }, [auth.roles])

    return (
        <>

        {userOrStore === 2 && <Link reloadDocument to={`/profile/store/${loggedUsername}`}
            className='h-12 hover:bg-gray-200 hover:cursor-pointer pl-4 pt-2 pb-2 
            w-full flex items-center'
            >

        <div className='flex flex-row items-center'>
          
          <img className="rounded-full w-8 border border-gray-400"
                src={profilePicURL} 
                alt=""
                onError={(e) => {
                    e.target.src = DEFAULT_IMAGE_PATH;
                }}
            />  

          <p className='pl-3'>My Profile</p>
          
        </div>
        </Link>}

        {userOrStore === 1 && <Link reloadDocument to={`/profile/user/${loggedUsername}`}
            className='h-12 hover:bg-gray-200 hover:cursor-pointer pl-4 pt-2 pb-2 
            w-full flex items-center'
            >

        <div className='flex flex-row items-center'>
          
          <img className="rounded-full w-8 border border-gray-400"
                src={profilePicURL} 
                alt=""
                onError={(e) => {
                    e.target.src = DEFAULT_IMAGE_PATH;
                }}
            />  

          <p className='pl-3'>My Profile</p>
          
        </div>
        </Link>}

        </>

    )
}

export default ProfileMenuItem;
        