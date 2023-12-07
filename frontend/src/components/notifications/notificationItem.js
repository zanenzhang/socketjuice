import React, { useState, useEffect } from 'react';


function NotificationItem({notiLine}) {

    const [message, setMessage] = useState("")

    useEffect( ()=> {

        if(notiLine?.notificationType === "Requested"){

            setMessage(`Received a booking request starting at ${new Date(notiLine.start).toLocaleTimeString()}, ending at ${new Date(notiLine.end).toLocaleTimeString()}. Please review under the bookings page`)

        } else if(notiLine?.notificationType === "Rejected"){

            setMessage(`Apologies, your booking request at ${new Date(notiLine.start).toLocaleTimeString()} was not accepted or someone else beat you to the time slot. Please try another booking request`)

        } else if (notiLine?.notificationType === "Approved"){

            setMessage(`Awesome, your booking request at ${new Date(notiLine.start).toLocaleTimeString()} was approved. Happy charging!`)

        } else if (notiLine?.notificationType === "CancelSubmitted"){

            setMessage(`Your cancellation request at ${new Date(notiLine.start).toLocaleTimeString()} was submitted. `)

        } else if (notiLine?.notificationType === "Cancelled"){

            setMessage(`The booking at ${new Date(notiLine.start).toLocaleTimeString()} was cancelled and refunded. `)

        } else if (notiLine?.notificationType === "Completed"){

            setMessage(`The booking that started at ${new Date(notiLine.start).toLocaleTimeString()} has ended and you have received payment. `)
        
        } 

    }, [notiLine])


    return (

        <div key={notiLine._id} className='w-full flex flex-row h-25 pr-4 pl-5 border-b-2 
        border-solid items-center justify-start hover:bg-gray-200'>
        
            <div className='flex flex-col pl-4 pt-4 pb-4'>
                <p>{message}</p>
            </div>

        </div>
    )
}

export default NotificationItem;