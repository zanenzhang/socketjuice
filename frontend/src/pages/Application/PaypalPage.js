import React, { useState, useEffect } from "react";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import useAuth from "../../hooks/useAuth";

import addPaypalOrder from "../../helpers/Paypal/addPaypalOrder";
import capturePaypalOrder from "../../helpers/Paypal/capturePaypalOrder";


const PaymentsPage = () => {

      const { auth } = useAuth();

      const [selectedCurrency, setSelectedCurrency] = useState("USD")
      const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState("$")

      const initialOptions = {
        "client-id": process.env.REACT_APP_PAYPAL_PUBLIC_ID,
        "enable-funding": "venmo",
        "currency": "USD"
      };
    
      const [paymentMessage, setPaymentMessage] = useState(""); 
      
      const [selectedAmount, setSelectedAmount] = useState(20);
      const [selectedServiceFee, setSelectedServiceFee] = useState(1.50);
      const [selectedTotal, setSelectedTotal] = useState(21.50);
      const [selectedOption, setSelectedOption] = useState("A");

      const [waitingPayment, setWaitingPayment] = useState(false)
      const [paymentSubmitted, setPaymentSubmitted] = useState(false)
      const [paymentSuccess, setPaymentSuccess] = useState(false)
      

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

            {!paymentSubmitted && <div className="flex flex-row gap-x-4 py-3">

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "A")} disabled={paymentSubmitted}>
                    $20
                </button>

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "B")} disabled={paymentSubmitted}>
                    $40
                </button>

                <button className={`px-4 py-2 rounded-xl text-lg ${selectedOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                    onClick={(e)=>handleSelectAmount(e, "C")} disabled={paymentSubmitted}>
                    $50
                </button>

            </div>}

            <div className="py-4 flex flex-col justify-center items-center">

                <p className="text-3xl font-bold">{selectedCurrencySymbol}{selectedAmount.toFixed(2)}</p>
                
                <p className="text-lg font-bold"> +Service Fee: {selectedCurrencySymbol}{selectedServiceFee.toFixed(2)} </p>

                <p className="flex flex-col w-[350px] text-center text-sm">Note: Service fee includes all processing charges for PayPal, credit cards, and bank transfers. </p>

                <p className="text-4xl font-bold pt-8 pb-4">Total: {selectedCurrencySymbol}{selectedTotal.toFixed(2)}</p>

            </div>

            {waitingPayment && <div className="flex flex-row gap-x-2">

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

            {paymentMessage && <p>{paymentMessage}</p>}

            {(auth.userId) ? 
            
            <div className="flex flex-col w-[375px] pt-4">
            <PayPalScriptProvider options={initialOptions}>

            <PayPalButtons
            forceReRender={[selectedCurrency, selectedOption, paymentSuccess]}
            disabled={paymentSuccess}
            style={{
                shape: "rect",
                //color:'blue' change the default color of the buttons
                layout: "vertical", //default value. Can be changed to horizontal
            }}
            createOrder={async (data, actions) => {
                
                setWaitingPayment(true);

                const orderData = await addPaypalOrder(selectedCurrency, selectedOption, auth?.userId, auth?.accessToken)

                if(orderData){

                    try{

                        var orderDataId = orderData.id

                        if (orderDataId) {
                            
                            setWaitingPayment(false)
                            setPaymentSubmitted(true)
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
                        setPaymentMessage(`Could not initiate PayPal Checkout...${error}`);
                    }
                } else {
                    setWaitingPayment(false)
                    setPaymentSuccess(true)
                    setPaymentMessage(`Could not initiate PayPal Checkout...Sorry, please refresh and try again`);
                    return 
                }
            }}
            onApprove={async (data, actions) => {
                
                try {
                    
                    const captureData = await capturePaypalOrder(data.orderID, auth.userId, auth.accessToken)

                    if(captureData){

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
                            setPaymentSuccess(true)
                            alert(`Success, your payment of ${captureData?.data?.orderData?.currency_code} ${captureData?.data?.orderData?.value} has been received!`)
                        }
                    }   

                } catch (error) {
                    console.error(error);
                    setPaymentMessage(
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



// const scrollCallbackIncoming = (entries) => {
    
//     if (entries[0].isIntersecting) {
//         if(!waitingIncoming && !scrollStopIncoming){
//             setPageNumberIncoming((prev)=> prev+100) 
//         } 
//     }
// };
  
// useEffect(() => {
    
//     if(incomingRef.current){
//         const { current } = incomingRef;
//         const observer = new IntersectionObserver(scrollCallbackIncoming, {
//             root: null,
//             threshold: 0.1,
//         });
//         observer.observe(current);
//         return () => {
//             observer.disconnect(current); 
//         }
//     } 
// }, [incomingRef.current]); 


// const scrollCallbackOutgoing = (entries) => {
    
//     if (entries[0].isIntersecting) {
//         if(!waitingOutgoing && !scrollStopOutgoing){
//             setPageNumberOutgoing((prev)=> prev+100) 
//         } 
//     }
// };

// useEffect(() => {

//     if(outgoingRef.current){
//         const { current } = outgoingRef;
//         const observer = new IntersectionObserver(scrollCallbackOutgoing, {
//             root: null,
//             threshold: 0.1,
//         });
//         observer.observe(current);
//         return () => {
//             observer.disconnect(current); 
//         }
//     } 
// }, [outgoingRef.current]); 

export default PaymentsPage
