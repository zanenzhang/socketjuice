import React, {useState, useEffect, useRef} from "react";
import Tabs from "@material-ui/core/Tabs";
import MainHeader from "../../components/mainHeader/mainHeader";
import useAuth from "../../hooks/useAuth";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import socketjuice_full_logo from "../../images/SocketJuice.png";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
import Box from "@material-ui/core/Box";

import addPayoutRequest from "../../helpers/Paypal/addPayoutRequest";
import addPaypalOrder from "../../helpers/Paypal/addPaypalOrder";
import capturePaypalOrder from "../../helpers/Paypal/capturePaypalOrder";
import getIncomingPayments from "../../helpers/Payments/getIncomingPayments";
import getOutgoingPayments from "../../helpers/Payments/getOutgoingPayments";
import getUserData from "../../helpers/Userdata/getUserData";
// add payment/user flag


export default function PaymentsPage() {

    const { auth, setAuth } = useAuth();

    const incomingRef = useRef(null);
    const outgoingRef = useRef(null);
    const [changed, setChanged] = useState(false)
    const [userCurrencies, setUserCurrencies] = useState([])
    const [accountBalance, setAccountBalance] = useState("")
    const [escrowBalance, setEscrowBalance] = useState("")

    const [payoutCurrency, setPayoutCurrency] = useState("USD")
    const [paymentCurrency, setPaymentCurrency] = useState("USD")

    const [payoutCurrencySymbol, setPayoutCurrencySymbol] = useState("$")
    const [paymentCurrencySymbol, setPaymentCurrencySymbol] = useState("$")

      const [payoutMessage, setPayoutMessage] = useState(""); 
      const [selectedPayoutAmount, setSelectedPayoutAmount] = useState(20);
      const [selectedPayoutFee, setSelectedPayoutFee] = useState(1.00);
      const [selectedTotalPayout, setSelectedTotalPayout] = useState(19.00);
      const [selectedPayoutOption, setSelectedPayoutOption] = useState("A");
      const [waitingPayout, setWaitingPayout] = useState(false)
      const [submittedPayout, setSubmittedPayout] = useState(false)
      const [payoutSuccess, setPayoutSuccess] = useState(false)

      const [tabValue, setTabValue] = useState("0");
    const [drawerState, setDrawerState] = useState({
        left: true
    })

      const initialOptions = {
        "client-id": process.env.REACT_APP_PAYPAL_PUBLIC_ID,
        "enable-funding": "venmo",
        "currency": "USD"
      };
    
      const [paymentMessage, setPaymentMessage] = useState(""); 
      const [selectedPaymentAmount, setSelectedPaymentAmount] = useState(20);
      const [selectedServiceFee, setSelectedServiceFee] = useState(1.50);
      const [selectedPaymentTotal, setSelectedPaymentTotal] = useState(21.50);
      const [selectedPaymentOption, setSelectedPaymentOption] = useState("A");
      const [waitingPayment, setWaitingPayment] = useState(false)
      const [paymentSubmitted, setPaymentSubmitted] = useState(false)
      const [paymentSuccess, setPaymentSuccess] = useState(false)

      const [incomingPayments, setIncomingPayments] = useState([])
      const [waitingIncoming, setWaitingIncoming] = useState(false)
      const [scrollStopIncoming, setScrollStopIncoming] = useState(false)
      const [pageNumberIncoming, setPageNumberIncoming] = useState(0)
      const [pickerDateIncomingStart, setPickerDateIncomingStart] = useState(new Date())
      const [pickerDateIncomingEnd, setPickerDateIncomingEnd] = useState(new Date())

      const [outgoingPayments, setOutgoingPayments] = useState([])
      const [waitingOutgoing, setWaitingOutgoing] = useState(false)
      const [scrollStopOutgoing, setScrollStopOutgoing] = useState(false)
      const [pageNumberOutgoing, setPageNumberOutgoing] = useState(0)
      const [pickerDateOutgoingStart, setPickerDateOutgoingStart] = useState(new Date())
      const [pickerDateOutgoingEnd, setPickerDateOutgoingEnd] = useState(new Date())


    const scrollCallbackIncoming = (entries) => {
    
        if (entries[0].isIntersecting) {
            if(!waitingIncoming && !scrollStopIncoming){
                setPageNumberIncoming((prev)=> prev+100) 
            } 
        }
    };
      
    useEffect(() => {
        
        if(incomingRef.current){
            const { current } = incomingRef;
            const observer = new IntersectionObserver(scrollCallbackIncoming, {
                root: null,
                threshold: 0.1,
            });
            observer.observe(current);
            return () => {
                observer.disconnect(current); 
            }
        } 
    }, [incomingRef.current]); 


    const scrollCallbackOutgoing = (entries) => {
        
        if (entries[0].isIntersecting) {
            if(!waitingOutgoing && !scrollStopOutgoing){
                setPageNumberOutgoing((prev)=> prev+100) 
            } 
        }
    };
  
    useEffect(() => {
    
        if(outgoingRef.current){
            const { current } = outgoingRef;
            const observer = new IntersectionObserver(scrollCallbackOutgoing, {
                root: null,
                threshold: 0.1,
            });
            observer.observe(current);
            return () => {
                observer.disconnect(current); 
            }
        } 
    }, [outgoingRef.current]); 


    const handleSelectPaymentAmount = (e, value) => {

        e.preventDefault()

        if(value === "A"){
            
            setSelectedPaymentOption("A")
            setSelectedPaymentAmount(20)
            setSelectedServiceFee(1.50)
            setSelectedPaymentTotal(21.50)

        } else if(value === "B"){
            
            setSelectedPaymentOption("B")
            setSelectedPaymentAmount(40)
            setSelectedServiceFee(2.00)
            setSelectedPaymentTotal(42.00)

        } else if(value === "C"){
            
            setSelectedPaymentOption("C")
            setSelectedPaymentAmount(50)
            setSelectedServiceFee(2.50)
            setSelectedPaymentTotal(52.50)
        }
    }
      
      useEffect( ()=> {

        async function getIncoming(){

            if(waitingIncoming){
                return
            }

            setWaitingIncoming(true)

            const incoming = await getIncomingPayments(auth.userId, pageNumberIncoming, pickerDateOutgoingStart, pickerDateOutgoingEnd, auth.accessToken)

            if(incoming && !incoming.stop){
                console.log(incoming)
                setIncomingPayments(incoming?.paymentsFound)
                setWaitingIncoming(false)
            } else {
                setScrollStopIncoming(true)
                setWaitingIncoming(false)
            }
        }

        async function getOutgoing(){

            if(waitingOutgoing){
                return
            }

            setWaitingOutgoing(true)

            const outgoing = await getOutgoingPayments(auth.userId, pageNumberOutgoing, pickerDateOutgoingStart, pickerDateOutgoingEnd, auth.accessToken)

            if(outgoing && !outgoing.stop){
                console.log(outgoing)
                setOutgoingPayments(outgoing?.paymentsFound)
                setWaitingOutgoing(false)
            } else {
                setScrollStopOutgoing(true)
                setWaitingOutgoing(false)
            }
        }

        async function updateUserData(){

            const userdata = getUserData(auth.accessToken, auth.userId)

            if(userdata){
                console.log(userdata)
                //Update auth here
            }
        }

        if(auth && tabValue){

            console.log(tabValue)

            var currencies = []
            if(auth.credits?.length){
                for(let i=0; i<auth.credits?.length; i++){
                    currencies.push({currency: auth.credits[i].currency, currencySymbol: auth.credits[i].currencySymbol})
                }
                setUserCurrencies(currencies)
            }
    
            if(auth.userId){
                updateUserData()
            }
            
            if(tabValue === "0"){
                getIncoming()
            } else if(tabValue === "1"){
                getOutgoing()
            }
        }

      }, [auth, tabValue, changed])



      const handleSelectPayoutAmount = (e, value) => {

        e.preventDefault()

        if(auth.requestedPayout){
            return
        }

        if(value === "A"){
            
            setSelectedPayoutOption("A")
            setSelectedPayoutAmount(20)
            setSelectedPayoutFee(1.00)
            setSelectedTotalPayout(19.00)

        } else if(value === "B"){
            
            setSelectedPayoutOption("B")
            setSelectedPayoutAmount(40)
            setSelectedPayoutFee(1.00)
            setSelectedTotalPayout(39.00)

        } else if(value === "C"){
            
            setSelectedPayoutOption("C")
            setSelectedPayoutAmount(50)
            setSelectedPayoutFee(1.00)
            setSelectedTotalPayout(49.00)
        }
      }


    const handleRequestPayout = async (e) => {

        e.preventDefault()

        const requested = await addPayoutRequest(auth.userId, payoutCurrency, selectedPayoutOption, auth.accessToken)

        if(requested){
            console.log(requested)
            setChanged(!changed)
        }
    }


  const handleDrawerOpen = (event) => {

    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
        return;
    }

    // toggleDrawer('left', true)
    setDrawerState({ ...drawerState, ['left']: true });
  }

const toggleDrawer = (anchor, open) => (event) => {
  
    setDrawerState({ ...drawerState, [anchor]: open });
  };

const handleChange = (event, newValue) => {
  setTabValue(newValue);
};


const list = (anchor) => (
    <div className="flex flex-grow">
    <Box
    sx={{
        bgcolor: "#8BEDF3",
        display: "flex",
        alignItems: 'center',
        height: '100%',
        width: 300,
        fontFamily: "Segoe UI",
    }}
    >
        <div className="w-full h-full pt-[12vh] sm:pt-[13vh] md:pt-[15vh] bg-[#c1f2f5]">
        <Tabs
            orientation="vertical"
            variant="scrollable"
            value={tabValue}
            onChange={handleChange}
            aria-label="Payments Tabs"
            sx={{ 
                borderRight: 1, 
                borderColor: "divider",
                fontFamily: 'ui-sans-serif',
            }}
            TabIndicatorProps={{style: {background:'#8BEDF3'}}}
        >
            <button
                className={`${tabValue === '0' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                    flex flex-row items-center`}
                onClick={(event) => {handleChange(event, "0")}}> 
                <div className="pr-2 pl-4">

                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                        viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" 
                        className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                </div>
                <div className="">
                    <p>Outgoing Payments</p>
                </div>
            </button>
            <button
                className={`${tabValue === '1' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                flex flex-row items-center`}
                onClick={(event) => {handleChange(event, "1")}}> 
                <div className="pr-2 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    strokeWidth="1.5" stroke="black" 
                    className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                </div>
                <div className="">
                    <p>Incoming Payments</p>
                </div>
            </button>
            <button
                className={`${tabValue === '2' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                flex flex-row items-center`}
                onClick={(event) => {handleChange(event, "2")}}> 
                <div className="pr-2 pl-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                    viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
                </div>
                <div className="">
                    <p>Withdrawal</p>
                </div>
            </button>
            <button
                className={`${tabValue === '3' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                flex flex-row items-center`}
                onClick={(event) => {handleChange(event, "3")}}> 
                <div className="pr-2 pl-4">
                <svg
                    fill="black"
                    viewBox="0 0 16 16"
                    height="2em"
                    width="2em"
                    >
                    <path d="M5 6.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm1.138-1.496A6.613 6.613 0 017.964 4.5c.666 0 1.303.097 1.893.273a.5.5 0 00.286-.958A7.602 7.602 0 007.964 3.5c-.734 0-1.441.103-2.102.292a.5.5 0 10.276.962z" />
                    <path
                        fillRule="evenodd"
                        d="M7.964 1.527c-2.977 0-5.571 1.704-6.32 4.125h-.55A1 1 0 00.11 6.824l.254 1.46a1.5 1.5 0 001.478 1.243h.263c.3.513.688.978 1.145 1.382l-.729 2.477a.5.5 0 00.48.641h2a.5.5 0 00.471-.332l.482-1.351c.635.173 1.31.267 2.011.267.707 0 1.388-.095 2.028-.272l.543 1.372a.5.5 0 00.465.316h2a.5.5 0 00.478-.645l-.761-2.506C13.81 9.895 14.5 8.559 14.5 7.069c0-.145-.007-.29-.02-.431.261-.11.508-.266.705-.444.315.306.815.306.815-.417 0 .223-.5.223-.461-.026a.95.95 0 00.09-.255.7.7 0 00-.202-.645.58.58 0 00-.707-.098.735.735 0 00-.375.562c-.024.243.082.48.32.654a2.112 2.112 0 01-.259.153c-.534-2.664-3.284-4.595-6.442-4.595zM2.516 6.26c.455-2.066 2.667-3.733 5.448-3.733 3.146 0 5.536 2.114 5.536 4.542 0 1.254-.624 2.41-1.67 3.248a.5.5 0 00-.165.535l.66 2.175h-.985l-.59-1.487a.5.5 0 00-.629-.288c-.661.23-1.39.359-2.157.359a6.558 6.558 0 01-2.157-.359.5.5 0 00-.635.304l-.525 1.471h-.979l.633-2.15a.5.5 0 00-.17-.534 4.649 4.649 0 01-1.284-1.541.5.5 0 00-.446-.275h-.56a.5.5 0 01-.492-.414l-.254-1.46h.933a.5.5 0 00.488-.393zm12.621-.857a.565.565 0 01-.098.21.704.704 0 01-.044-.025c-.146-.09-.157-.175-.152-.223a.236.236 0 01.117-.173c.049-.027.08-.021.113.012a.202.202 0 01.064.199z"
                    />
                    </svg>
                </div>
                <div className="">
                    <p>Fund Account</p>
                </div>
            </button>
        </Tabs>
        </div>
    </Box>
    </div>
    )

  
  return (
    <>
    <section>
    <div style={{height:'100svh'}}
        className="flex flex-col bg-gray-background">

        <MainHeader loggedUserId={auth.userId} />
    
        <div className='flex flex-col sm:h-full pt-[8vh] sm:pt-[9vh] md:pt-[10vh]'>

            <div className="flex flex-row justify-center pt-4 pb-4 border-b border-gray-400">

                <div className='flex flex-row items-center justify-center gap-x-4'>
                    <p className='text-2xl font-bold'>Payments</p>
                    <button
                    className='flex flex-row text-black gap-x-1 p-1 rounded-lg px-2'
                    onClick={(e)=>handleDrawerOpen(e)}
                        >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 18.25H15C14.59 18.25 14.25 17.91 14.25 17.5C14.25 17.09 14.59 16.75 15 16.75H22C22.41 16.75 22.75 17.09 22.75 17.5C22.75 17.91 22.41 18.25 22 18.25Z" fill="black"/>
                            <path d="M5 18.25H2C1.59 18.25 1.25 17.91 1.25 17.5C1.25 17.09 1.59 16.75 2 16.75H5C5.41 16.75 5.75 17.09 5.75 17.5C5.75 17.91 5.41 18.25 5 18.25Z" fill="black"/>
                            <path d="M22 7.25H19C18.59 7.25 18.25 6.91 18.25 6.5C18.25 6.09 18.59 5.75 19 5.75H22C22.41 5.75 22.75 6.09 22.75 6.5C22.75 6.91 22.41 7.25 22 7.25Z" fill="black"/>
                            <path d="M9 7.25H2C1.59 7.25 1.25 6.91 1.25 6.5C1.25 6.09 1.59 5.75 2 5.75H9C9.41 5.75 9.75 6.09 9.75 6.5C9.75 6.91 9.41 7.25 9 7.25Z" fill="black"/>
                            <path d="M13 21.25H7C5.28 21.25 4.25 20.22 4.25 18.5V16.5C4.25 14.78 5.28 13.75 7 13.75H13C14.72 13.75 15.75 14.78 15.75 16.5V18.5C15.75 20.22 14.72 21.25 13 21.25ZM7 15.25C6.11 15.25 5.75 15.61 5.75 16.5V18.5C5.75 19.39 6.11 19.75 7 19.75H13C13.89 19.75 14.25 19.39 14.25 18.5V16.5C14.25 15.61 13.89 15.25 13 15.25H7Z" fill="black"/>
                            <path d="M17 10.25H11C9.28 10.25 8.25 9.22 8.25 7.5V5.5C8.25 3.78 9.28 2.75 11 2.75H17C18.72 2.75 19.75 3.78 19.75 5.5V7.5C19.75 9.22 18.72 10.25 17 10.25ZM11 4.25C10.11 4.25 9.75 4.61 9.75 5.5V7.5C9.75 8.39 10.11 8.75 11 8.75H17C17.89 8.75 18.25 8.39 18.25 7.5V5.5C18.25 4.61 17.89 4.25 17 4.25H11Z" fill="black"/>
                        </svg>

                        More Options
                    </button>
                </div>
            </div>

            <div className='overflow-auto 
                    h-full flex flex-row
                    justify-center'>

                <Box style={{appContainer: {
                    display: "flex",
                    width: "93vw",
                    height: "100vh"
                    }}}>

                    <TabContext value={tabValue}>  

                        <Box style={{display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%"}}>

                        <TabPanel value="0" style={{width: '100%'}}>
                            
                            <div className="flex flex-col items-center gap-y-1 sm:gap-y-2" >

                                <div className="flex flex-row justify-center items-center gap-x-2">

                                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                                    <select onChange={(event)=>setPaymentCurrency(event.target.value)}
                                    value={paymentCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                        {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                                        
                                            <option value={`${e.currency.toLowerCase()}`}>{e.currencySymbol}{e.currency.toUpperCase()}</option>
                                        )}

                                    </select> 

                                    </div>

                                <p className="text-3xl py-4">Account Balance </p>

                                <p>In Wallet: {paymentCurrencySymbol}{paymentCurrency}{accountBalance}</p>
                                <p>On Hold: {paymentCurrencySymbol}{paymentCurrency}{escrowBalance}</p>

                                <p className="text-3xl pt-6">Outgoing Payments</p>


                            <div className="flex flex-row py-4 gap-x-2">

                                <div className="flex flex-col items-center justify-center">
                                    <p className='text-base text-center font-semibold pt-4 pb-2'> Start Date: </p>

                                    <LocalizationProvider dateAdapter={AdapterDayjs}>

                                        <DatePicker
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                              '& fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                              '&:hover fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                              '&.Mui-focused fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                            },
                                          }}
                                        value={dayjs(pickerDateIncomingStart)}
                                        onChange={(date) => setPickerDateIncomingStart(dayjs(new Date(date)))}
                                        />

                                    </LocalizationProvider>
                                </div>

                                <div className="flex flex-col items-center justify-center">
                                <p className='text-base text-center font-semibold pt-4 pb-2'> End Date: </p>
                                    <LocalizationProvider sx={{borderColor: "#8BEDF3", outlineColor: "#8BEDF3"}} dateAdapter={AdapterDayjs}>

                                        <DatePicker
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                              '& fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                              '&:hover fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                              '&.Mui-focused fieldset': {
                                                borderColor: '#8BEDF3',
                                              },
                                            },
                                          }}
                                        value={dayjs(pickerDateIncomingEnd)}
                                        onChange={(date) => setPickerDateIncomingEnd(dayjs(new Date(date)))}
                                        />

                                    </LocalizationProvider>
                                </div>

                            </div>

                            {incomingPayments?.length > 0 && 

                                incomingPayments?.map( (payment) =>
                                    
                                    <div key={payment._id} className="flex flex-row">

                                        <p>{payment.currencySymbol}{payment.currency}{payment.amount}</p>

                                    </div>
                                )
                            }   
                            
                            {incomingPayments?.length > 0 && 

                                <div className='flex flex-row py-2 sm:py-3 md:py-4 z-10 my-1'>
                                        <span key={"lastIncoming"} ref={incomingRef} className="my-2 py-2" />
                                </div>}

                            </div>

                        </TabPanel>

                        <TabPanel value="1" style={{width: '100%'}}>
                            
                            <div className="flex flex-col items-center gap-y-1 sm:gap-y-2" >

                                <div className="flex flex-row justify-center items-center gap-x-2">

                                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                                    <select onChange={(event)=>setPayoutCurrency(event.target.value)}
                                    value={payoutCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                    {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                                        
                                        <option value={`${e.currency.toLowerCase()}`}>{e.currencySymbol}{e.currency}</option>
                                    )}

                                    </select> 

                                </div>

                                <div className="flex flex-row py-4">

                                <LocalizationProvider dateAdapter={AdapterDayjs}>

                                    <DatePicker
                                    value={dayjs(pickerDateOutgoingStart)}
                                    onChange={(date) => setPickerDateOutgoingStart(dayjs(new Date(date)))}
                                    />

                                </LocalizationProvider>

                                <LocalizationProvider dateAdapter={AdapterDayjs}>

                                    <DatePicker
                                    value={dayjs(pickerDateOutgoingEnd)}
                                    onChange={(date) => setPickerDateOutgoingEnd(dayjs(new Date(date)))}
                                    />

                                </LocalizationProvider>

                                </div>

                                {outgoingPayments?.length > 0 && 

                                    outgoingPayments?.map( (payment) =>
                                        
                                        <div key={payment._id} className="flex flex-row">

                                            <p>{payment.currencySymbol}{payment.currency}{payment.amount}</p>

                                        </div>
                                    )
                                }   

                                {outgoingPayments?.length > 0 && 

                                    <div className='flex flex-row py-2 sm:py-3 md:py-4 z-10 my-1'>
                                            <span key={"lastOutgoing"} ref={outgoingRef} className="my-2 py-2" />
                                    </div>}

                                </div>

                        </TabPanel>

                        <TabPanel value="2" style={{width: '100%'}}>
                            
                            <div className="flex flex-col justify-center items-center w-full">
                
                                <img className="w-[200px]" src={socketjuice_full_logo} />

                                <p className="text-2xl">Withdrawal Amount:</p>

                                {!submittedPayout && <div className="flex flex-row gap-x-4 py-3">

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                        : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPayoutAmount(e, "A")} disabled={submittedPayout}>
                                        $20
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                        : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPayoutAmount(e, "B")} disabled={submittedPayout}>
                                        $40
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                        : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPayoutAmount(e, "C")} disabled={submittedPayout}>
                                        $50
                                    </button>

                                </div>}

                                <div className="py-4 flex flex-col justify-center items-center">

                                    <p className="text-4xl font-bold pt-8 pb-4">Current Balance: </p>

                                    <p className="text-3xl font-bold">{payoutCurrencySymbol}{selectedPayoutAmount.toFixed(2)}</p>
                                    
                                    <p className="text-lg font-bold"> -Service Fee: {payoutCurrencySymbol}{selectedPayoutFee.toFixed(2)} </p>

                                    <p className="flex flex-col w-[375px] text-center text-sm">Note: Service fee includes all processing charges for PayPal, credit cards, and bank transfers. </p>

                                    <p className="text-4xl font-bold pt-8 pb-4">Net Payout: {payoutCurrencySymbol}{selectedTotalPayout.toFixed(2)}</p>

                                </div>

                                {waitingPayout && <div className="flex flex-row gap-x-2">

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

                                {payoutMessage && <p>{payoutMessage}</p>}

                                {(auth.userId) ? 
                                
                                <div className="flex flex-col w-[375px] pt-4 gap-y-4">
                                
                                    <button className="py-2 px-4 border border-gray-400 rounded-lg hover:bg-[#8BEDF3]" 
                                        onClick={(e)=>handleRequestPayout(e)}>

                                        Submit Withdrawal Request

                                    </button>

                                </div>
                                
                                : null }

                            </div>

                        </TabPanel>

                        <TabPanel value="3" style={{width: '100%'}}>
                            
                            <div className="flex flex-col justify-center items-center w-full">
                
                                <img className="w-[200px]" src={socketjuice_full_logo} />

                                <p className="text-2xl">Reload Amount:</p>

                                {!paymentSubmitted && <div className="flex flex-row gap-x-4 py-3">

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "A")} disabled={paymentSubmitted}>
                                        $20
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "B")} disabled={paymentSubmitted}>
                                        $40
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "C")} disabled={paymentSubmitted}>
                                        $50
                                    </button>

                                </div>}

                                <div className="py-4 flex flex-col justify-center items-center">

                                    <p className="text-3xl font-bold">{paymentCurrencySymbol}{selectedPaymentAmount.toFixed(2)}</p>
                                    
                                    <p className="text-lg font-bold"> +Service Fee: {paymentCurrencySymbol}{selectedServiceFee.toFixed(2)} </p>

                                    <p className="flex flex-col w-[350px] text-center text-sm">Note: Service fee includes all processing charges for PayPal, credit cards, and bank transfers. </p>

                                    <p className="text-4xl font-bold pt-8 pb-4">Total: {paymentCurrencySymbol}{selectedPaymentTotal.toFixed(2)}</p>

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
                                    forceReRender={[paymentCurrency, selectedPaymentOption, paymentSuccess]}
                                    disabled={paymentSuccess}
                                    style={{
                                        shape: "rect",
                                        //color:'blue' change the default color of the buttons
                                        layout: "vertical", //default value. Can be changed to horizontal
                                    }}
                                    createOrder={async (data, actions) => {
                                        
                                        setWaitingPayment(true);

                                        const orderData = await addPaypalOrder(paymentCurrency, selectedPaymentOption, auth?.userId, auth?.accessToken)

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
                                                    setChanged(!changed)
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

                        </TabPanel>

                        </Box>

                    </TabContext>
                </Box>
            </div>

        </div>

    </div>

    <SwipeableDrawer
          anchor={'left'}
          open={drawerState['left']}
          onClose={toggleDrawer('left', false)}
          onOpen={toggleDrawer('left', true)}
      >
          {list('left')}
    </SwipeableDrawer>

    </section>

    </>
  );
}
