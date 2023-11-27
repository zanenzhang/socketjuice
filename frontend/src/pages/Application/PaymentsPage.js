import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "../../api/axios";
import useAuth from "../../hooks/useAuth";

import addPaypalOrder from "../../helpers/Paypal/addPaypalOrder";
import capturePaypalOrder from "../../helpers/Paypal/capturePaypalOrder";


function Message({ content }) {
    return <p>{content}</p>;
  }

const PaymentsPage = () => {

      const { auth } = useAuth();

      const initialOptions = {
        "client-id": process.env.REACT_APP_PAYPAL_PUBLIC_ID,
        "enable-funding": "venmo",
        "data-sdk-integration-source": "integrationbuilder_sc",
      };
    
      const [message, setMessage] = useState(""); 
      const [isLoaded, setIsLoaded] = useState(false) 
      const [selectedAmount, setSelectedAmount] = useState(0)
      
      useEffect( ()=> {

        console.log(auth)
        setIsLoaded(true)

      }, [auth])

    return (
        
        <div className="flex flex-col justify-center items-center w-full">
            
            <img className="w-[200px]" src={socketjuice_full_logo} />

            <p></p>

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
                
                var cart = [
                    {
                        id: "TEST_ID",
                        quantity: "1",
                        option: "A"
                    },
                ]

                const orderData = await addPaypalOrder(cart, auth?.userId, auth?.accessToken)

                if(orderData){

                    console.log(orderData)

                    try{

                        var orderDataId = orderData.id

                        if (orderDataId) {
                            console.log(orderDataId)
                            return orderDataId;
                        } 

                    } catch (error) {
                        console.error(error);
                        setMessage(`Could not initiate PayPal Checkout...${error}`);
                    }
                }
            }}
            onApprove={async (data, actions) => {
                try {
                    
                const response = capturePaypalOrder(data.orderID, auth.userId, auth.accessToken)

                if(response){

                    console.log(response.data)
                    var orderData = response.data
                }

                // Three cases to handle:
                //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                //   (2) Other non-recoverable errors -> Show a failure message
                //   (3) Successful transaction -> Show confirmation or thank you message

                        // const errorDetail = orderData?.details?.[0];

                        // if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                        //     // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                        //     // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                        //     return actions.restart();
                        // } else if (errorDetail) {
                        //     // (2) Other non-recoverable errors -> Show a failure message
                        //     throw new Error(
                        //     `${errorDetail.description} (${orderData.debug_id})`,
                        //     );
                        // } else {
                        //     // (3) Successful transaction -> Show confirmation or thank you message
                        //     // Or go to another URL:  actions.redirect('thank_you.html');
                        //     const transaction =
                        //     orderData.purchase_units[0].payments.captures[0];
                        //     setMessage(
                        //          `Transaction ${transaction.status}: ${transaction.id}. See console for all available details`,
                        //     );
                        //     console.log(
                                    // "Capture result",
                                    // orderData,
                                    // JSON.stringify(orderData, null, 2),
                        //     );
                        // }

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

        <Message content={message} />    

        </div>
    );
}




export default PaymentsPage
