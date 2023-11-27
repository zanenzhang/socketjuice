import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import socketjuice_full_logo from "../../images/SocketJuice.png";
import BraintreeDropIn from "../../components/payments/BraintreeDropIn";

import addSale from "../../helpers/Payments/addSale";
import getPaymentToken from "../../helpers/Payments/getPaymentToken";

const PaymentsPage = () => {

    const [paymentMethodNonce, setPaymentMethodNonce] = useState(null);

    const handlePaymentSuccess = (nonce) => {
        // Handle the payment success, e.g., send the nonce to your server for further processing
        setPaymentMethodNonce(nonce);
        console.log(nonce)
    };

    return (
        <div className="flex flex-col justify-center items-center w-full">
        <h1>React Braintree Integration</h1>

        <div className='flex items-center justify-center px-10 pb-6'>
            <img className='w-[200px]' src={socketjuice_full_logo} />
        </div>

        {paymentMethodNonce ? (
            <div>
            <h2>Payment Successful!</h2>
            <p>Nonce: {paymentMethodNonce}</p>
            </div>
        ) : (
            <BraintreeDropIn onPaymentMethodNonce={handlePaymentSuccess} />
        )}
        </div>
    );
}




export default PaymentsPage
