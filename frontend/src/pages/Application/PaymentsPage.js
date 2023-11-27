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
      const [selectedOption, setSelectedOption] = useState("A");
      const [currencySymbol, setCurrencySymbol] = useState("$")

      const [waiting, setWaiting] = useState(false)
      
      useEffect( ()=> {

        console.log(auth)
        setIsLoaded(true)

      }, [auth])

      const handleSelectAmount = (e, value) => {

        setSelectedAmount(value)
      }

    return (
        
        <div className="flex flex-col justify-center items-center w-full">
            
            <img className="w-[200px]" src={socketjuice_full_logo} />

            <p>{currencySymbol}{selectedAmount}</p>

            <div className="flex flex-row gap-x-4">

                <button className="px-4 py-2 rounded-xl" 
                    onClick={(e)=>handleSelectAmount(e, 20, "A")}>
                    $20
                </button>

                <button className="px-4 py-2 rounded-xl"
                    onClick={(e)=>handleSelectAmount(e, 30, "B")}>
                    $30
                </button>

                <button className="px-4 py-2 rounded-xl"
                    onClick={(e)=>handleSelectAmount(e, 50, "C")}>
                    $50
                </button>

            </div>

            {waiting && <div className="flex flex-row gap-x-2">

                <p>Spinning</p>    
                <p>Loading</p>
                <p>{message}</p>

            </div>}

            {(isLoaded && auth.userId) ? 
            
            <div className="flex flex-col w-[375px] pt-4">
            <PayPalScriptProvider options={initialOptions}>

            <PayPalButtons
            style={{
                shape: "rect",
                //color:'blue' change the default color of the buttons
                layout: "vertical", //default value. Can be changed to horizontal
            }}
            createOrder={async () => {
                
                setWaiting(true);

                var cart = [
                    {
                        id: "PAYPAL_RELOAD",
                        quantity: "1",
                        option: `${selectedOption}`
                    },
                ]

                const orderData = await addPaypalOrder(cart, auth?.userId, auth?.accessToken)

                if(orderData){

                    try{

                        var orderDataId = orderData.id

                        if (orderDataId) {
                            
                            setWaiting(false)
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
