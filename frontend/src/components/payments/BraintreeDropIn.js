import React, { useState, useEffect } from 'react';
import DropIn from 'braintree-web-drop-in-react';
import getPaymentToken from '../../helpers/Payments/getPaymentToken';
import useAuth from "../../hooks/useAuth";


const BraintreeDropIn = ({ onPaymentMethodNonce }) => {
  
const [token, setToken] = useState('');
const [instance, setInstance] = useState('');
const { auth } = useAuth();

  useEffect(() => {
    // Fetch a client token from your server
    // Make a server-side request to generate a client token
    // using your server-side language of choice (Node.js, Python, PHP, etc.)
    // The client token is used to authenticate requests from the client to Braintree

    async function getToken(){

        const result = await getPaymentToken(auth.userId, auth.accessToken)

        if(result){
            console.log(result)
            setToken(result.data?.clientToken)
        }
    }

    setToken()

    if(auth.userId){
        getToken()
    }

  }, [auth]);

  const handleInstance = (instance) => {

    console.log(instance)
    setInstance(instance)
  }

  const handlePaymentMethodNonce = (payload) => {
    // Send the payment method nonce to your server
    // Handle the payment on your server-side logic
    onPaymentMethodNonce(payload.nonce);
  };

  return (
    <div>
    {token ? <DropIn
      options={{ authorization: token }}
      onInstance={(instance) => handleInstance(instance)}
      onPaymentMethodNonce={(e)=>handlePaymentMethodNonce(e)}
    />
    : <h1>Loading...</h1>}
    </div> 
  );
};

export default BraintreeDropIn;