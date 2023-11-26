import React, { useState, useEffect } from 'react';
import DropIn from 'braintree-web-drop-in-react';
import getPaymentToken from '../../helpers/Payments/getPaymentToken';


const BraintreeDropIn = ({ onPaymentMethodNonce }) => {
  const [token, setToken] = useState('');

  useEffect(() => {
    // Fetch a client token from your server
    // Make a server-side request to generate a client token
    // using your server-side language of choice (Node.js, Python, PHP, etc.)
    // The client token is used to authenticate requests from the client to Braintree

    async function getToken(){

        const result = await getPaymentToken(auth.userId)

        if(result){
            console.log(result)
        }
    }

    setToken()

    if(auth.userId){
        getToken()
    }

  }, [auth]);

  const handlePaymentMethodNonce = (payload) => {
    // Send the payment method nonce to your server
    // Handle the payment on your server-side logic
    onPaymentMethodNonce(payload.nonce);
  };

  return (
    <DropIn
      options={{ authorization: token, paypal: { flow: 'vault' } }}
      onInstance={(instance) => (window.dropinInstance = instance)}
      onPaymentMethodNonce={handlePaymentMethodNonce}
    />
  );
};

export default BraintreeDropIn;