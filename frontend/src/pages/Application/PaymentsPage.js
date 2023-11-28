import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "../../api/axios";
import useAuth from "../../hooks/useAuth";

import addPaypalOrder from "../../helpers/Paypal/addPaypalOrder";
import capturePaypalOrder from "../../helpers/Paypal/capturePaypalOrder";


const PaymentsPage = () => {

      const { auth } = useAuth();

      const initialOptions = {
        "client-id": process.env.REACT_APP_PAYPAL_PUBLIC_ID,
        "enable-funding": "venmo",
        "data-sdk-integration-source": "integrationbuilder_sc",
      };
    
      const [message, setMessage] = useState(""); 
      const [isLoaded, setIsLoaded] = useState(false);
      
      const [selectedAmount, setSelectedAmount] = useState(20);
      const [selectedServiceFee, setSelectedServiceFee] = useState(1.50);
      const [selectedTotal, setSelectedTotal] = useState(21.50);

      const [selectedOption, setSelectedOption] = useState("A");
      const [currency, setCurrency] = useState("USD")
      const [currencySymbol, setCurrencySymbol] = useState("$")

      const [waiting, setWaiting] = useState(false)
      const [submitted, setSubmitted] = useState(false)
      const [success, setSuccess] = useState(false)
      
      useEffect( ()=> {

        console.log(auth)
        setIsLoaded(true)

      }, [auth])

      const handleSelectAmount = (e, value) => {

        e.preventDefault()

        if(value === "A"){
            
            setSelectedOption("A")
            setSelectedAmount(20)
            setSelectedServiceFee(1.50)
            setSelectedTotal(21.50)

        } else if(value === "B"){
            
            setSelectedOption("B")
            setSelectedAmount(40)
            setSelectedServiceFee(2.00)
            setSelectedTotal(42.00)

        } else if(value === "C"){
            
            setSelectedOption("C")
            setSelectedAmount(50)
            setSelectedServiceFee(2.50)
            setSelectedTotal(52.50)
        }
        
      }

    return (
        
        <div className="flex flex-col justify-center items-center w-full">
            
            <img className="w-[200px]" src={socketjuice_full_logo} />

            <p className="text-2xl">Reload Amount:</p>

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
                
                <p className="text-lg font-bold"> +Service Fee: {currencySymbol}{selectedServiceFee.toFixed(2)} </p>

                <p className="flex flex-col w-[375px] text-center text-sm">Note: Service fee includes all processing charges for PayPal, credit cards, and bank transfers. </p>

                <p className="text-4xl font-bold pt-8 pb-4">Total: {currencySymbol}{selectedTotal.toFixed(2)}</p>

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
            
            <div className="flex flex-col w-[375px] pt-4">
            <PayPalScriptProvider options={initialOptions}>

            <PayPalButtons
            forceReRender={[currency, selectedOption, success]}
            disabled={success}
            style={{
                shape: "rect",
                //color:'blue' change the default color of the buttons
                layout: "vertical", //default value. Can be changed to horizontal
            }}
            createOrder={async () => {
                
                setWaiting(true);

                console.log(selectedAmount, selectedOption)

                const orderData = await addPaypalOrder(currency, selectedOption, auth?.userId, auth?.accessToken)

                if(orderData){

                    try{

                        var orderDataId = orderData.id

                        if (orderDataId) {
                            
                            setWaiting(false)
                            setSubmitted(true)
                            return orderDataId;

                        } else {
                            const errorDetail = orderData?.details?.[0];
                            const errorMessage = errorDetail
                            ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                            : JSON.stringify(orderData);

                            throw new Error(errorMessage);
                        }

                    } catch (error) {
                        console.error(error);
                        setMessage(`Could not initiate PayPal Checkout...${error}`);
                    }
                }
            }}
            onApprove={async (data, actions) => {
                
                try {

                    console.log(data.orderID)
                    
                    const captureData = await capturePaypalOrder(data.orderID, auth.userId, auth.accessToken)

                    if(captureData){

                        console.log(captureData)

                        const errorDetail = captureData?.details?.[0];

                        // Three cases to handle:
                        //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                        //   (2) Other non-recoverable errors -> Show a failure message
                        //   (3) Successful transaction -> Show confirmation or thank you message

                        if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                            // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                            // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                            return actions.restart();
                        } else if (errorDetail) {
                            // (2) Other non-recoverable errors -> Show a failure message
                            throw new Error(
                            `${errorDetail.description} (${captureData.debug_id})`,
                            );
                        } else if (captureData?.status === 201) {
                            // (3) Successful transaction -> Show confirmation or thank you message
                            // Or go to another URL:  actions.redirect('thank_you.html');
                            setSuccess(true)
                            alert("Success, payment has been received!")
                        }
                    }   

                } catch (error) {
                    console.error(error);
                    setMessage(
                        `Sorry, your transaction could not be processed...${error}`,
                    );
                }
            }}
            />
        </PayPalScriptProvider>

        </div> : null}

        

        </div>
    );
}




export default PaymentsPage
