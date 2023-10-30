import React, { useEffect} from 'react';


export default function Activate() {
    
    useEffect( () => {
        document.title = 'Activated!'
    }, []) 

    return (
        <p>Account activated!</p>
    )
}


//Will need to add text-gray-base and text-red-primary to the tailwind config file
//Add text-blue-medium, bg-blue-medium
//Add border-gray-primary