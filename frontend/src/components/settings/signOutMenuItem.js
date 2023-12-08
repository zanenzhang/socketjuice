import React from 'react'
import useLogout from '../../hooks/useLogout';
import { useNavigate } from 'react-router-dom';


const SignOutMenuItem = () => {

    const logout = useLogout();
    const navigate = useNavigate();

    const signOut = async (event) => {
        
        event.preventDefault();
        event.stopPropagation();

        const response = await logout();

        if(response){
            console.log("Thanks for using SocketJuice and being part of the community!")
        }
    }

    return (

        <button 
            className='h-12 hover:bg-gray-200 pl-4 pt-2 pb-2 
                w-full flex items-center'
            onClick={(event)=> signOut(event) }
            onKeyDown={(event) => {
                if (event.key === "Enter"){
                    signOut(event);
                }
        }}>

        <div className='flex flex-row items-center'>
          
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            strokeWidth="1.5" stroke="#8BEDF3" 
            className="w-6 h-6 mr-2">
            <path 
            strokeLinecap="round" strokeLinejoin="round" 
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" 
            />
        </svg>

          <p>Logout</p>

        </div>

        </button>

    )
}

export default SignOutMenuItem;
        