import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const LoginIcon = () => {


    return (

        <Link to={'/map'} aria-label="Login">
            
            <svg 
                className="w-8 mr-6 text-black-light cursor-pointer"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" viewBox="0 0 24 24" 
                stroke="currentColor"
            >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>

        </Link>
    )
}

export default LoginIcon;