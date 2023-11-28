import React, { useState, useEffect } from "react";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import useAuth from "../../hooks/useAuth";

import addPayoutRequest from "../../helpers/Paypal/addPayoutRequest";
import addNewPayout from "../../helpers/Paypal/addNewPayout";


const PayoutsPage = () => {

      const { auth } = useAuth();

      const [message, setMessage] = useState(""); 
      const [isLoaded, setIsLoaded] = useState(false);
      
      const [selectedAmount, setSelectedAmount] = useState(20);
      const [selectedServiceFee, setSelectedServiceFee] = useState(1.00);
      const [selectedTotal, setSelectedTotal] = useState(19.00);

      const [selectedOption, setSelectedOption] = useState("A");
      const [currency, setCurrency] = useState("USD")
      const [currencySymbol, setCurrencySymbol] = useState("$")

      const [waiting, setWaiting] = useState(false)
      const [submitted, setSubmitted] = useState(false)
      const [success, setSuccess] = useState(false)

      useEffect( ()=> {

        setIsLoaded(true)

      }, [auth])

      const handleSelectAmount = (e, value) => {

        e.preventDefault()

        if(value === "A"){
            
            setSelectedOption("A")
            setSelectedAmount(20)
            setSelectedServiceFee(1.00)
            setSelectedTotal(19.00)

        } else if(value === "B"){
            
            setSelectedOption("B")
            setSelectedAmount(40)
            setSelectedServiceFee(1.00)
            setSelectedTotal(39.00)

        } else if(value === "C"){
            
            setSelectedOption("C")
            setSelectedAmount(50)
            setSelectedServiceFee(1.00)
            setSelectedTotal(49.00)
        }
        
      }


    const handleRequestPayout = async (e) => {

        e.preventDefault()

        const requested = await addPayoutRequest(auth.userId, currency, selectedOption, auth.accessToken)

        if(requested){
            console.log(requested)
        }

    }


    const handleSubmitPayout = async (e) => {

        e.preventDefault()

        const submitted = await addNewPayout(auth?.userId, auth?.accessToken)

        if(submitted){
            console.log(submitted)
        }

    }
      

    return (
        
        <div className="flex flex-col justify-center items-center w-full">
            
            <img className="w-[200px]" src={socketjuice_full_logo} />

            <p className="text-2xl">Payout Amount:</p>

            {!submitted && <div className="flex flex-row gap-x-4 py-3">

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "A")} disabled={submitted}>
                    $20
                </button>

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "B")} disabled={submitted}>
                    $40
                </button>

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "C")} disabled={submitted}>
                    $50
                </button>

            </div>}

            <div className="py-4 flex flex-col justify-center items-center">

                <p className="text-3xl font-bold">{currencySymbol}{selectedAmount.toFixed(2)}</p>
                
                <p className="text-lg font-bold"> -Service Fee: {currencySymbol}{selectedServiceFee.toFixed(2)} </p>

                <p className="flex flex-col w-[375px] text-center text-sm">Note: Service fee includes all processing charges for PayPal, credit cards, and bank transfers. </p>

                <p className="text-4xl font-bold pt-8 pb-4">Net Payout: {currencySymbol}{selectedTotal.toFixed(2)}</p>

            </div>

            {waiting && <div className="flex flex-row gap-x-2">

                <div aria-label="Loading..." role="status">
                    <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                    <path
                        className="fill-gray-200"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                    <path
                        className="fill-[#00D3E0]"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                    </svg>
                </div>
                <p className="text-lg">Loading...</p>

            </div>}

            {message && <p>{message}</p>}

            {(isLoaded && auth.userId) ? 
            
            <div className="flex flex-col w-[375px] pt-4 gap-y-4">
             
                <button className="py-2 px-4 border border-gray-400 rounded-lg hover:bg-[#8BEDF3]" 
                    onClick={(e)=>handleRequestPayout(e)}>

                    Add Payout Request

                </button>

                <button className="py-2 px-4 border border-gray-400 rounded-lg hover:bg-[#8BEDF3]" 
                    onClick={(e)=>handleSubmitPayout(e)}>

                    Approve Payout Request

                </button>

             </div>
             
             : null }

        </div>
    );
}


export default PayoutsPage
