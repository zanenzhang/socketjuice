import React from 'react';
import { useNavigate } from 'react-router-dom';


const PaymentsMenuItem = () => {

  const navigate = useNavigate();

    const goToPurchases = () => {
        navigate(`/payments`);
    }

    return (

        <React.Fragment>

        <button 
            className='h-12 hover:bg-gray-200 hover:cursor-pointer 
            pl-4 pt-2 pb-2 
            w-full flex items-center'
            onClick={()=>goToPurchases()}
            onKeyDown={(event) => {
                if (event.key === "Enter"){
                  goToPurchases();
                }
            }}>
        
        <div className='flex flex-row items-center'>
        
        <svg xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            strokeWidth="1.5" stroke="#8BEDF3" 
            className="w-6 h-6 mr-2">
            <path strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>

          <p>Payments</p>

        </div>

        </button>

    </React.Fragment>

    )
}

export default PaymentsMenuItem;
        