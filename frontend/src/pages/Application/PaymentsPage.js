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


export default function PaymentsPage() {

    const { auth, setAuth } = useAuth();

    const currencyList = [
        {currency: "usd", currencySymbol: "$"},
        {currency: "cad", currencySymbol: "$"},
        // {currency: "eur", currencySymbol: "€"},
        // {currency: "gbp", currencySymbol: "£"},
        // {currency: "inr", currencySymbol: "₹"},
        // {currency: "jpy", currencySymbol: "¥"},
        // {currency: "cny", currencySymbol: "¥"},
        // {currency: "aud", currencySymbol: "$"},
        // {currency: "nzd", currencySymbol: "$"},
    ]

    const incomingRef = useRef(null);
    const outgoingRef = useRef(null);
    const [changed, setChanged] = useState(0)
    const [userCurrencies, setUserCurrencies] = useState([])
    const [accountBalance, setAccountBalance] = useState(0)
    const [escrowBalance, setEscrowBalance] = useState(0)

    const [payoutCurrency, setPayoutCurrency] = useState("")
    const [paymentCurrency, setPaymentCurrency] = useState("")
    const [payoutCurrencySymbol, setPayoutCurrencySymbol] = useState("$")
    const [paymentCurrencySymbol, setPaymentCurrencySymbol] = useState("$")
    const [payoutDisplay, setPayoutDisplay] = useState([100, 200, 300])
    const [paymentDisplay, setPaymentDisplay] = useState([20, 40, 50])

      const [payoutMessage, setPayoutMessage] = useState(""); 
      const [selectedPayoutAmount, setSelectedPayoutAmount] = useState("");
      const [selectedPayoutFee, setSelectedPayoutFee] = useState("");
      const [selectedTotalPayout, setSelectedTotalPayout] = useState("");
      const [selectedPayoutOption, setSelectedPayoutOption] = useState("");
      const [waitingPayout, setWaitingPayout] = useState(false)
      const [submittedPayout, setSubmittedPayout] = useState(false)

      const [tabValue, setTabValue] = useState("0");
    const [drawerState, setDrawerState] = useState({
        left: true
    })

    const [initialOptions, setInitialOptions] = useState({
        "client-id": (auth?.currency === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
        "currency": auth?.currency?.toUpperCase()
      });
    
      const [paymentMessage, setPaymentMessage] = useState(""); 
      const [selectedPaymentAmount, setSelectedPaymentAmount] = useState("");
      const [selectedServiceFee, setSelectedServiceFee] = useState("");
      const [selectedPaymentTotal, setSelectedPaymentTotal] = useState("");
      const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
      const [waitingPayment, setWaitingPayment] = useState(false)
      const [paymentSubmitted, setPaymentSubmitted] = useState(false)
      const [paymentSuccess, setPaymentSuccess] = useState(false)

      var today = new Date();
      const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);

      const [lockedCurrency, setLockedCurrency] = useState(false)
      const [incomingPayments, setIncomingPayments] = useState([])
      const [waitingIncoming, setWaitingIncoming] = useState(false)
      const [scrollStopIncoming, setScrollStopIncoming] = useState(false)
      const [pageNumberIncoming, setPageNumberIncoming] = useState(0)
      const [pickerDateIncomingStart, setPickerDateIncomingStart] = useState(oneWeekAgo)
      const [pickerDateIncomingEnd, setPickerDateIncomingEnd] = useState(new Date())

      const [requestedPayout, setRequestedPayout] = useState(false)
      const [outgoingPayments, setOutgoingPayments] = useState([])
      const [waitingOutgoing, setWaitingOutgoing] = useState(false)
      const [scrollStopOutgoing, setScrollStopOutgoing] = useState(false)
      const [pageNumberOutgoing, setPageNumberOutgoing] = useState(0)
      const [pickerDateOutgoingStart, setPickerDateOutgoingStart] = useState(oneWeekAgo)
      const [pickerDateOutgoingEnd, setPickerDateOutgoingEnd] = useState(new Date())


      async function updateIncoming(pageNumber){

        var number = 0

        if(pageNumber === 0){
            number = 0
            setPageNumberIncoming(100)
        } else {
            number = pageNumberIncoming
            setPageNumberIncoming(pageNumberIncoming + 100)
        }
            
        const incoming = await getIncomingPayments(auth.userId, number, pickerDateIncomingStart, pickerDateIncomingEnd, auth.accessToken, auth.userId)

        if(incoming && !incoming.stop){
            
            var userHash = {}
            for(let i=0; i<incoming?.userData?.length; i++){
                if(userHash[incoming?.userData[i]._id] === undefined ){
                    userHash[incoming.userData[i]._id] = incoming.userData[i]
                }
            }

            for(let i=0; i<incoming?.foundPayments?.length; i++){
                if(userHash[incoming?.foundPayments[i]._sendingUserId] !== undefined ){
                    incoming.foundPayments[i].userData = userHash[incoming?.foundPayments[i]._sendingUserId]
                }
            }
            
            if(pageNumber === 0){
                setIncomingPayments([...incoming?.foundPayments])
            } else {
                setIncomingPayments([...incomingPayments, ...incoming?.foundPayments])
            }
            
            setWaitingIncoming(false)

        } else {

            if(pageNumber === 0){
                setIncomingPayments([])
            }
            setScrollStopIncoming(true)
            setWaitingIncoming(false)
        }
    }

    async function updateOutgoing(pageNumber){

        var number = 0

        if(pageNumber === 0){
            number = 0
            setPageNumberOutgoing(100)
        } else {
            number = pageNumberOutgoing
            setPageNumberOutgoing(pageNumberOutgoing + 100)
        }
            
        const outgoing = await getOutgoingPayments(auth.userId, number, pickerDateOutgoingStart, pickerDateOutgoingEnd, auth.accessToken, auth.userId)

        if(outgoing && !outgoing.stop){

            var userHash = {}
            for(let i=0; i<outgoing?.userData?.length; i++){
                if(userHash[outgoing?.userData[i]._id] === undefined ){
                    userHash[outgoing.userData[i]._id] = outgoing.userData[i]
                }
            }

            for(let i=0; i<outgoing?.foundPayments?.length; i++){
                if(userHash[outgoing?.foundPayments[i]._receivingUserId] !== undefined ){
                    outgoing.foundPayments[i].userData = userHash[outgoing?.foundPayments[i]._receivingUserId]
                }
            }

            if(pageNumber === 0){
                setOutgoingPayments([...outgoing?.foundPayments])
            } else {
                setOutgoingPayments([...outgoingPayments, ...outgoing?.foundPayments])
            }
            
            setWaitingOutgoing(false)

        } else {

            if(pageNumber === 0){
                setOutgoingPayments([])
            }
            setScrollStopOutgoing(true)
            setWaitingOutgoing(false)
        }
    }

      const handleUpdateIncoming = (e, pageNumber) => {

        e.preventDefault()

        if(waitingIncoming || (pageNumber > 0 && scrollStopIncoming)){
            return
        }

        setWaitingIncoming(true)
        updateIncoming(pageNumber)   
      }

      const handleUpdateOutgoing = (e, pageNumber) => {

        e.preventDefault()

        if(waitingOutgoing || (pageNumber > 0 && scrollStopOutgoing)){
            return
        }

        setWaitingOutgoing(true)
        updateOutgoing(pageNumber)        
      }

    const handlePayCurrency = (e) => {

        setSelectedPaymentOption("")

        setInitialOptions({
            "client-id": (e.target.value.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
            "currency": e.target.value.toUpperCase()
          })

        setPayoutCurrency(e.target.value.toLowerCase())
        setPaymentCurrency(e.target.value.toLowerCase())

        var currencySymbol = "$"

        if(e.target.value === "usd"){
            
            currencySymbol = "$"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])
            

        } else if(e.target.value === "cad"){

            currencySymbol = "$"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])


        } else if(e.target.value === "eur"){
            
            currencySymbol = "€"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])


        } else if(e.target.value === "gbp"){
            
            currencySymbol = "£"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])


        } else if(e.target.value === "inr"){
            
            currencySymbol = "₹"
            setPaymentDisplay([2000, 4000, 5000])
            setPayoutDisplay([10000, 20000, 30000])

        } else if(e.target.value === "jpy"){
            
            currencySymbol = "¥"
            setPaymentDisplay([3000, 6000, 8000])
            setPayoutDisplay([15000, 30000, 40000])

        } else if(e.target.value === "cny"){
            
            currencySymbol = "¥"
            setPaymentDisplay([100, 200, 300])
            setPayoutDisplay([300, 600, 900])

        } else if(e.target.value === "aud"){
            
            currencySymbol = "$"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])

        } else if(e.target.value === "nzd"){
            
            currencySymbol = "$"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])

        } else {
            
            currencySymbol = "$"
            setPaymentDisplay([20, 40, 50])
            setPayoutDisplay([100, 200, 300])
        }

        setPayoutCurrencySymbol(currencySymbol)
        setPaymentCurrencySymbol(currencySymbol)

    }

    const handleSelectPayoutAmount = (e, value) => {

        e.preventDefault()

        if(auth.requestedPayout){
            return
        }

        var payoutCurrencyLocal = ""
        if(!payoutCurrency){
            setPayoutCurrency(userCurrencies[0].currency.toLowerCase())
            payoutCurrencyLocal = userCurrencies[0].currency.toLowerCase()

            setInitialOptions({
                "client-id": (userCurrencies[0].currency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
                "currency": userCurrencies[0].currency.toUpperCase()
              })

        } else {
            payoutCurrencyLocal = payoutCurrency
        }

        if(value === "A"){

            if(payoutCurrencyLocal === "usd"){

                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else if(payoutCurrencyLocal === "cad"){
    
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else if(payoutCurrencyLocal === "eur"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else if(payoutCurrencyLocal === "gbp"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else if(payoutCurrencyLocal === "inr"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(10000.00)
                setSelectedPayoutFee(500.00)
                setSelectedTotalPayout(9500.00)
    
            } else if(payoutCurrencyLocal === "jpy"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(15000.00)
                setSelectedPayoutFee(1000.00)
                setSelectedTotalPayout(14000.00)
    
            } else if(payoutCurrencyLocal === "cny"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(15.00)
                setSelectedTotalPayout(285.00)
    
            } else if(payoutCurrencyLocal === "aud"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else if(payoutCurrencyLocal === "nzd"){
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
    
            } else {
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(100.00)
                setSelectedPayoutFee(5.00)
                setSelectedTotalPayout(95.00)
            }

        } else if(value === "B"){

            if(payoutCurrencyLocal === "usd"){

                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else if(payoutCurrencyLocal === "cad"){
    
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else if(payoutCurrencyLocal === "eur"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else if(payoutCurrencyLocal === "gbp"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else if(payoutCurrencyLocal === "inr"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(20000.00)
                setSelectedPayoutFee(1000.00)
                setSelectedTotalPayout(19000.00)
    
            } else if(payoutCurrencyLocal === "jpy"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(30000.00)
                setSelectedPayoutFee(1500.00)
                setSelectedTotalPayout(28500.00)
    
            } else if(payoutCurrencyLocal === "cny"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(600.00)
                setSelectedPayoutFee(30.00)
                setSelectedTotalPayout(570.00)
    
            } else if(payoutCurrencyLocal === "aud"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else if(payoutCurrencyLocal === "nzd"){
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
    
            } else {
                
                setSelectedPayoutOption("B")
                setSelectedPayoutAmount(200.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(190.00)
            }

        } else if(value === "C"){
            
            if(payoutCurrencyLocal === "usd"){

                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else if(payoutCurrencyLocal === "cad"){
    
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else if(payoutCurrencyLocal === "eur"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else if(payoutCurrencyLocal === "gbp"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else if(payoutCurrencyLocal === "inr"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(30000.00)
                setSelectedPayoutFee(1500.00)
                setSelectedTotalPayout(28500.00)
    
            } else if(payoutCurrencyLocal === "jpy"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(40000.00)
                setSelectedPayoutFee(2000.00)
                setSelectedTotalPayout(38000.00)
    
            } else if(payoutCurrencyLocal === "cny"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(900)
                setSelectedPayoutFee(30.00)
                setSelectedTotalPayout(870.00)
    
            } else if(payoutCurrencyLocal === "aud"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else if(payoutCurrencyLocal === "nzd"){
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
    
            } else {
                
                setSelectedPayoutOption("C")
                setSelectedPayoutAmount(300.00)
                setSelectedPayoutFee(10.00)
                setSelectedTotalPayout(290.00)
            }
        }

        setLockedCurrency(true)
      }

    const handleSelectPaymentAmount = (e, value) => {

        e.preventDefault()

        var paymentCurrencyLocal = ""
        if(!paymentCurrency){
            setPaymentCurrency(currencyList[0].currency.toLowerCase())
            paymentCurrencyLocal = currencyList[0].currency.toLowerCase()

            setInitialOptions({
                "client-id": (currencyList[0].currency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
                "currency": currencyList[0].currency.toUpperCase()
              })
              
        } else {
            paymentCurrencyLocal = paymentCurrency
        }

        if(value === "A"){

            if(paymentCurrencyLocal === "usd"){

                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else if(paymentCurrencyLocal === "cad"){
    
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else if(paymentCurrencyLocal === "eur"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else if(paymentCurrencyLocal === "gbp"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else if(paymentCurrencyLocal === "inr"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(200.00)
                setSelectedServiceFee(15.00)
                setSelectedPaymentTotal(215.00)
    
            } else if(paymentCurrencyLocal === "jpy"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(3000)
                setSelectedServiceFee(200)
                setSelectedPaymentTotal(3200)
    
            } else if(paymentCurrencyLocal === "cny"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(100.00)
                setSelectedServiceFee(5.00)
                setSelectedPaymentTotal(105.00)
    
            } else if(paymentCurrencyLocal === "aud"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else if(paymentCurrencyLocal === "nzd"){
                
                setSelectedPaymentOption("A")
                setSelectedPaymentAmount(20.00)
                setSelectedServiceFee(1.50)
                setSelectedPaymentTotal(21.50)
    
            } else {
                
                setSelectedPayoutOption("A")
                setSelectedPayoutAmount(20.00)
                setSelectedPayoutFee(1.00)
                setSelectedTotalPayout(19.00)
            }

        } else if(value === "B"){

            if(paymentCurrencyLocal === "usd"){

                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else if(paymentCurrencyLocal === "cad"){
    
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else if(paymentCurrencyLocal === "eur"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else if(paymentCurrencyLocal === "gbp"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else if(paymentCurrencyLocal === "inr"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(400.00)
                setSelectedServiceFee(20.00)
                setSelectedPaymentTotal(420.00)
    
            } else if(paymentCurrencyLocal === "jpy"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(6000.00)
                setSelectedServiceFee(40.00)
                setSelectedPaymentTotal(6400.00)
    
            } else if(paymentCurrencyLocal === "cny"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(200.00)
                setSelectedServiceFee(10.00)
                setSelectedPaymentTotal(210.00)
    
            } else if(paymentCurrencyLocal === "aud"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else if(paymentCurrencyLocal === "nzd"){
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
    
            } else {
                
                setSelectedPaymentOption("B")
                setSelectedPaymentAmount(40.00)
                setSelectedServiceFee(2.00)
                setSelectedPaymentTotal(42.00)
            }

        } else if(value === "C"){
            
            if(paymentCurrencyLocal === "usd"){

                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else if(paymentCurrencyLocal === "cad"){
    
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else if(paymentCurrencyLocal === "eur"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else if(paymentCurrencyLocal === "gbp"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50.00)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else if(paymentCurrencyLocal === "inr"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(500.00)
                setSelectedServiceFee(25.00)
                setSelectedPaymentTotal(525.00)
    
            } else if(paymentCurrencyLocal === "jpy"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(8000.00)
                setSelectedServiceFee(500.00)
                setSelectedPaymentTotal(8500.00)
    
            } else if(paymentCurrencyLocal === "cny"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(300.00)
                setSelectedServiceFee(15.00)
                setSelectedPaymentTotal(315.00)
    
            } else if(paymentCurrencyLocal === "aud"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50.00)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else if(paymentCurrencyLocal === "nzd"){
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50.00)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
    
            } else {
                
                setSelectedPaymentOption("C")
                setSelectedPaymentAmount(50.00)
                setSelectedServiceFee(2.50)
                setSelectedPaymentTotal(52.50)
            }
        }

        setLockedCurrency(true)
    }
      
      useEffect( ()=> {

        async function getIncoming(){

            if(waitingIncoming || scrollStopIncoming){
                return
            }

            setWaitingIncoming(true)

            const incoming = await getIncomingPayments(auth.userId, pageNumberIncoming, pickerDateOutgoingStart, pickerDateOutgoingEnd, auth.accessToken, auth.userId)

            if(incoming && !incoming.stop){

                var userHash = {}
                for(let i=0; i<incoming?.userData?.length; i++){
                    if(userHash[incoming?.userData[i]._id] === undefined ){
                        userHash[incoming.userData[i]._id] = incoming.userData[i]
                    }
                }

                for(let i=0; i<incoming?.foundPayments?.length; i++){
                    if(userHash[incoming?.foundPayments[i]._sendingUserId] !== undefined ){
                        incoming.foundPayments[i].userData = userHash[incoming?.foundPayments[i]._sendingUserId]
                    }
                }

                setIncomingPayments([...incoming?.foundPayments])
                setWaitingIncoming(false)

            } else {

                setScrollStopIncoming(true)
                setWaitingIncoming(false)
            }

            if(auth.credits?.length){
                for(let i=0; i<auth.credits?.length; i++){
                    if(auth.credits[i].currency.toLowerCase() === paymentCurrency){
                        setPaymentCurrencySymbol(auth.credits[i].currencySymbol)
                        setAccountBalance(auth.credits[i].amount)
                    }
                }
                for(let i=0; i<auth.escrow?.length; i++){
                    if(auth.escrow[i].currency.toLowerCase() === paymentCurrency){
                        setEscrowBalance(auth.escrow[i].amount)
                    }
                }
            }
        }

        async function getOutgoing(){

            if(waitingOutgoing || scrollStopOutgoing){
                return
            }

            setWaitingOutgoing(true)

            const outgoing = await getOutgoingPayments(auth.userId, pageNumberOutgoing, pickerDateOutgoingStart, pickerDateOutgoingEnd, auth.accessToken, auth.userId)

            if(outgoing && !outgoing.stop){

                var userHash = {}
                for(let i=0; i<outgoing?.userData?.length; i++){
                    if(userHash[outgoing?.userData[i]._id] === undefined ){
                        userHash[outgoing.userData[i]._id] = outgoing.userData[i]
                    }
                }

                for(let i=0; i<outgoing?.foundPayments?.length; i++){
                    if(userHash[outgoing?.foundPayments[i]._receivingUserId] !== undefined ){
                        outgoing.foundPayments[i].userData = userHash[outgoing?.foundPayments[i]._receivingUserId]
                    }
                }

                setOutgoingPayments([...outgoing?.foundPayments])
                setWaitingOutgoing(false)

            } else {

                setScrollStopOutgoing(true)
                setWaitingOutgoing(false)
            }

            if(auth.credits?.length){
                for(let i=0; i<auth.credits?.length; i++){
                    if(auth.credits[i].currency.toLowerCase() === payoutCurrency){
                        setPayoutCurrencySymbol(auth.credits[i].currencySymbol)
                        setAccountBalance(auth.credits[i].amount)
                    }
                }
                for(let i=0; i<auth.escrow?.length; i++){
                    if(auth.escrow[i].currency.toLowerCase() === payoutCurrency){
                        setEscrowBalance(auth.escrow[i].amount)
                    }
                }
            }
        }

        if(auth && tabValue !== undefined && (paymentCurrency || payoutCurrency)){

            setPaymentSuccess(false);
            setSelectedPaymentOption("")
            setLockedCurrency(false)
            setPaymentSubmitted(false)

            if(tabValue === "0"){
                
                getOutgoing()

                setInitialOptions({
                    "client-id": (paymentCurrency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
                    "currency": paymentCurrency.toUpperCase()
                  })

            } else if(tabValue === "1"){
                
                getIncoming()

                setInitialOptions({
                    "client-id": (paymentCurrency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
                    "currency": paymentCurrency.toUpperCase()
                  })
            
            }
        }

        if(auth && tabValue !== undefined && (!paymentCurrency && !payoutCurrency)){

            setPaymentSuccess(false);

            if(tabValue === "3"){

                if(auth?.currency){

                    setPaymentCurrency(auth?.currency.toLowerCase())

                    setInitialOptions({
                        "client-id": (auth?.currency.toLowerCase() === "usd" ? process.env.REACT_APP_PAYPAL_PUBLIC_ID_USD : process.env.REACT_APP_PAYPAL_PUBLIC_ID_CAD),
                        "currency": auth?.currency.toUpperCase()
                      })
                }
            } 
        }

      }, [auth, tabValue, paymentCurrency, payoutCurrency])


      useEffect( () => {

        var today = new Date();
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7);
        setPickerDateIncomingStart(oneWeekAgo)
        setPickerDateIncomingEnd(new Date()) 

      }, [])


      useEffect( ()=> {

        async function updateUserData(){

            const userdata = await getUserData(auth.accessToken, auth.userId)

            if(userdata){
                
                setAuth(prev => {
            
                    return {
                        ...prev,
                        credits: userdata.foundUser?.credits,
                        escrow: userdata.foundUser?.escrow,
                        requestedPayout: userdata.foundUser?.requestedPayout,
                        requestedPayoutCurrency: userdata.foundUser?.requestedPayoutCurrency,
                        requestedPayoutOption: userdata.foundUser?.requestedPayoutOption,
                    }
                });
            }
        }

        if(auth.userId && changed > 0){
            updateUserData()
        }

      }, [changed])


      useEffect( () => {

        if(auth.userId && tabValue !== "3"){

            var currencies = []
            if(auth.credits?.length){
                for(let i=0; i<auth.credits?.length; i++){
                    if(auth.credits[i].currency.toLowerCase() === "usd" || auth.credits[i].currency.toLowerCase() === "cad"){
                        currencies.push({currency: auth.credits[i].currency, currencySymbol: auth.credits[i].currencySymbol})
                    }
                }
                setUserCurrencies(currencies)
            }
        }

      }, [auth, tabValue])



    const handleRequestPayout = async (e) => {

        e.preventDefault()

        if(waitingPayout || auth.requestedPayout){
            return
        }

        var checked = false;
        for(let i=0; i< auth?.credits?.length; i++){
            if(auth.credits[i].currency.toLowerCase() === payoutCurrency.toLowerCase()){
                if(auth.credits[i].amount > selectedTotalPayout){
                    checked = true;
                    break
                }
            }
        }

        if(checked){

            setWaitingPayout(true)

            const requested = await addPayoutRequest(auth.userId, payoutCurrency, selectedPayoutOption, auth.accessToken)

            if(requested){
                setWaitingPayout(false)
                setSubmittedPayout(true)
                setChanged(changed + 1)
            } else {
                setWaitingPayout(false)
            }

        } else {
            
            alert("Insufficient funds in account for payout request")
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
                value={"0"}
                onClick={(event) => {handleChange(event, "0")}}> 
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
                className={`${tabValue === '1' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                    flex flex-row items-center`}
                value={"1"}
                onClick={(event) => {handleChange(event, "1")}}> 
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
                className={`${tabValue === '2' ? 'bg-[#8BEDF3] border-2 border-black' : 
                'bg-[#c1f2f5] border-2 border-gray-300'} 
                px-4 py-6 text-base font-semibold font-['system-ui'] rounded-r-lg
                flex flex-row items-center`}
                value={"2"}
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
                value={"3"}
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

                                    <select onChange={(event)=>handlePayCurrency(event)}
                                    disabled={lockedCurrency}
                                    value={paymentCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                        {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                                            
                                            <option key={`${e.currency}_outgoing`} value={`${e.currency.toLowerCase()}`}>
                                                {e.currencySymbol}{e.currency.toUpperCase()}</option>
                                        )}

                                    </select> 

                                </div>

                                <p className="text-3xl py-4">Account Balance </p>

                                <p className="text-lg">In Wallet: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{accountBalance.toFixed(2)}</p>
                                <p className="text-lg">On Hold: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{escrowBalance.toFixed(2)}</p>

                                <p className="text-3xl pt-6">Incoming Payments</p>


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
                                            onChange={(date) => setPickerDateIncomingStart(new Date(date))}
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
                                            onChange={(date) => setPickerDateIncomingEnd(new Date(date))}
                                            />

                                        </LocalizationProvider>
                                    </div>

                                    <div className="flex flex-col items-center justify-center pt-10 pl-4">
                                        <button className="border border-[#00D3E0] hover:bg-[#00D3E0] text-black px-4 py-2 rounded-xl 
                                        flex flex-row gap-x-2"
                                        onClick={(e)=>handleUpdateIncoming(e, 0)}>

                                            <svg xmlns="http://www.w3.org/2000/svg" 
                                                viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                            </svg>

                                            Refresh
                                        </button>
                                    </div>

                                </div>

                                {incomingPayments?.length > 0 && 

                                    incomingPayments?.map( (payment) =>
                                        
                                        <div key={`${payment._id}_incoming`} className="flex flex-row gap-x-2 py-3 px-4
                                            border-y border-gray-300 items-center justify-center">
                                            
                                            <p>From: {payment?.userData?.firstName}</p>
                                            <div className="flex flex-col w-[50px]">
                                                <img className="flex flex-col w-[50px] rounded-full" src={payment?.userData?.profilePicURL} />
                                            </div>
                                            <p>{new Date(payment?.createdAt).toLocaleDateString()} {new Date(payment?.createdAt).toLocaleTimeString()}</p>
                                            <p>{payment.currency.toUpperCase()} {payment.currencySymbol}{payment?.amount.toFixed(2)}</p>

                                        </div>
                                    )
                                }   
                                
                                {incomingPayments?.length > 0 && 

                                <div className="flex flex-col items-center justify-center pt-10 pl-4">
                                    <button className="border border-[#00D3E0] hover:bg-[#00D3E0] text-black 
                                        px-4 py-2 rounded-xl flex flex-row gap-x-2"
                                    disabled={waitingIncoming} onClick={(e)=>handleUpdateIncoming(e, 1)}>

                                        <svg xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                        </svg>

                                        Load More
                                    </button>
                                </div>}

                            </div>

                        </TabPanel>

                        <TabPanel value="1" style={{width: '100%'}}>
                            
                            <div className="flex flex-col items-center gap-y-1 sm:gap-y-2" >

                                <div className="flex flex-row justify-center items-center gap-x-2">

                                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                                    <select onChange={(event)=>handlePayCurrency(event)}
                                    disabled={lockedCurrency}
                                    value={paymentCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                        {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                                            
                                            <option key={`${e.currency}_outgoing`} value={`${e.currency.toLowerCase()}`}>
                                                {e.currencySymbol}{e.currency.toUpperCase()}</option>
                                        )}

                                    </select> 

                                </div>

                                <p className="text-3xl py-4">Account Balance </p>

                                <p className="text-lg">In Wallet: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{accountBalance.toFixed(2)}</p>
                                <p className="text-lg">On Hold: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{escrowBalance.toFixed(2)}</p>

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
                                            value={dayjs(pickerDateOutgoingStart)}
                                            onChange={(date) => setPickerDateOutgoingStart(new Date(date))}
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
                                            value={dayjs(pickerDateOutgoingEnd)}
                                            onChange={(date) => setPickerDateOutgoingEnd(new Date(date))}
                                            />

                                        </LocalizationProvider>
                                    </div>

                                    <div className="flex flex-col items-center justify-center pt-10 pl-4">
                                        <button className="border border-[#00D3E0] hover:bg-[#00D3E0] text-black 
                                            px-4 py-2 rounded-xl flex flex-row gap-x-2"
                                            onClick={(e)=>handleUpdateOutgoing(e, 0)}>

                                            <svg xmlns="http://www.w3.org/2000/svg" 
                                                viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                            </svg>

                                            Refresh
                                        </button>
                                    </div>

                                </div>

                                {outgoingPayments?.length > 0 && 

                                    outgoingPayments?.map( (payment) =>
                                        
                                        <div key={`${payment._id}_outgoing`} className="flex flex-row gap-x-2 py-3 px-4
                                            border-y border-gray-300 items-center justify-center">

                                            <p>To: {payment?.userData?.firstName}</p>
                                            <div className="flex flex-col w-[50px]">
                                                <img className="flex flex-col w-[50px] rounded-full" src={payment?.userData?.profilePicURL} />
                                            </div>
                                            <p>{new Date(payment?.createdAt).toLocaleDateString()} {new Date(payment?.createdAt).toLocaleTimeString()}</p>
                                            <p>{payment.currency.toUpperCase()} {payment.currencySymbol}{payment?.amount.toFixed(2)}</p>

                                        </div>
                                    )
                                }   

                                {outgoingPayments?.length > 0 && 

                                <div className="flex flex-col items-center justify-center pt-10 pl-4">
                                    <button className="border border-[#00D3E0] hover:bg-[#00D3E0] text-black 
                                        px-4 py-2 rounded-xl flex flex-row gap-x-2"
                                    disabled={waitingOutgoing} onClick={(e)=>handleUpdateOutgoing(e, 1)}>

                                        <svg xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                        </svg>

                                        Load More
                                    </button>
                                </div>}

                            </div>

                        </TabPanel>

                        <TabPanel value="2" style={{width: '100%'}}>
                            
                            {auth.requestedPayout ? 
                            
                            <div className="flex flex-col justify-center items-center w-full">

                                <img className="w-[200px]" src={socketjuice_full_logo} />

                                <p className="text-2xl pt-4">Your payout request was submitted and will be reviewed!</p>

                            </div>
                            
                            : <div className="flex flex-col justify-center items-center w-full">
                
                                <img className="w-[200px]" src={socketjuice_full_logo} />

                                

                                <div className="flex flex-row justify-center items-center gap-x-2 py-4">

                                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                                    <select onChange={(event)=>handlePayCurrency(event)}
                                    disabled={lockedCurrency}
                                    value={payoutCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                        {userCurrencies?.length>0 && userCurrencies.map( (e) =>
                                            
                                            <option key={`${e.currency}_outgoing`} value={`${e.currency.toLowerCase()}`}>
                                                {e.currencySymbol}{e.currency.toUpperCase()}</option>
                                        )}

                                    </select> 

                                </div>

                                <div className="pt-2 pb-6 flex flex-col justify-center items-center">

                                    <p className="text-3xl">Account Balance </p>

                                    <p className="text-lg">In Wallet: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{accountBalance.toFixed(2)}</p>
                                    <p className="text-lg">On Hold: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{escrowBalance.toFixed(2)}</p>
                                </div>

                                
                                {accountBalance > 0 ? 

                                    <div className="flex w-full flex-col justify-center items-center">
                                        
                                        <p className="text-2xl">Select Withdrawal Amount:</p>

                                        { (!submittedPayout) && 
                                        <div className="flex flex-row gap-x-4 py-3">

                                            <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                                : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                                onClick={(e)=>handleSelectPayoutAmount(e, "A")} disabled={submittedPayout}>
                                                {payoutCurrencySymbol}{payoutDisplay[0]}
                                            </button>

                                            <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                                : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                                onClick={(e)=>handleSelectPayoutAmount(e, "B")} disabled={submittedPayout}>
                                                {payoutCurrencySymbol}{payoutDisplay[1]}
                                            </button>

                                            <button className={`px-4 py-2 rounded-xl text-lg ${selectedPayoutOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' 
                                                : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                                onClick={(e)=>handleSelectPayoutAmount(e, "C")} disabled={submittedPayout}>
                                                {payoutCurrencySymbol}{payoutDisplay[2]}
                                            </button>

                                        </div>}

                                        
                                        {selectedTotalPayout && <div className="py-4 flex flex-col justify-center items-center">

                                            <p className="text-3xl font-bold">{payoutCurrencySymbol}{selectedPayoutAmount?.toFixed(2)}</p>
                                            
                                            <p className="text-lg font-bold"> -Service Fee: {payoutCurrencySymbol}{selectedPayoutFee?.toFixed(2)} </p>

                                            <p className="flex flex-col w-[375px] text-center text-sm">Note: Service fee includes taxes and all processing charges for PayPal, credit cards, and bank transfers. </p>

                                            <p className="text-4xl font-bold pt-8 pb-4">Net Payout: {payoutCurrencySymbol}{selectedTotalPayout?.toFixed(2)}</p>

                                        </div>}

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
                                        
                                        <div className="flex flex-col w-[375px] pt-4 pb-6">
                                        
                                            <button className="py-2 px-4 border border-gray-400 rounded-lg hover:bg-[#8BEDF3]" 
                                                disabled={auth.requestedPayout || waitingPayout}
                                                onClick={(e)=>handleRequestPayout(e)}>

                                                Submit Withdrawal Request

                                            </button>

                                        </div>
                                        
                                        : null }

                                    </div>
                                : 
                                
                                <div className="flex w-full flex-col justify-center items-center">
                                        
                                        <p className="text-2xl">You have no money to withdraw</p>

                                </div>
                                
                                }

                            </div>}

                        </TabPanel>

                        <TabPanel value="3" style={{width: '100%'}}>
                            
                            <div className="flex flex-col justify-center items-center w-full">
                
                                <img className="w-[200px]" src={socketjuice_full_logo} />

                                <div className="flex flex-row justify-center items-center gap-x-2 py-4">

                                    <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

                                    <select onChange={(event)=>handlePayCurrency(event)}
                                    disabled={lockedCurrency}
                                    value={paymentCurrency}
                                    className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

                                        {currencyList?.length>0 && currencyList.map( (e) =>
                                        
                                            <option key={`${e.currency}_outgoing`} value={`${e.currency.toLowerCase()}`}>
                                                {e.currencySymbol}{e.currency.toUpperCase()}</option>
                                            )}

                                    </select> 

                                </div>

                                <p className="text-2xl">Select Fund Amount:</p>

                                {!paymentSubmitted && <div className="flex flex-row gap-x-4 py-3">

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "A" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "A")} disabled={paymentSubmitted}>
                                        {paymentCurrencySymbol}{paymentDisplay[0]}
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "B" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "B")} disabled={paymentSubmitted}>
                                        {paymentCurrencySymbol}{paymentDisplay[1]}
                                    </button>

                                    <button className={`px-4 py-2 rounded-xl text-lg ${selectedPaymentOption === "C" ? 'border-2 border-black bg-[#8BEDF3] ' : 'border border-gray-400 ' }  hover:bg-[#8BEDF3]`}
                                        onClick={(e)=>handleSelectPaymentAmount(e, "C")} disabled={paymentSubmitted}>
                                        {paymentCurrencySymbol}{paymentDisplay[2]}
                                    </button>

                                </div>}

                                {selectedPaymentAmount && <div className="py-4 flex flex-col justify-center items-center">

                                    <p className="text-3xl font-bold">{paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{selectedPaymentAmount?.toFixed(2)}</p>
                                    
                                    <p className="text-lg font-bold"> +Service Fee: {paymentCurrencySymbol}{selectedServiceFee?.toFixed(2)} </p>

                                    <p className="flex flex-col w-[350px] text-center text-sm">Note: Service fee includes taxes and all processing charges for PayPal, credit cards, and bank transfers. </p>

                                    <p className="text-4xl font-bold pt-8 pb-4">Total: {paymentCurrency.toUpperCase()} {paymentCurrencySymbol}{selectedPaymentTotal?.toFixed(2)}</p>

                                </div>}

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

                                {(auth.userId && paymentCurrency && selectedPaymentOption) ? 
                                
                                <div className="flex flex-col w-[375px] pt-4">
                                <PayPalScriptProvider options={initialOptions}>

                                <PayPalButtons
                                    forceReRender={[paymentCurrency, selectedPaymentOption, paymentSuccess]}
                                    disabled={paymentSuccess || waitingPayment}
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

                                                    setWaitingPayment(false)

                                                    throw new Error(errorMessage);
                                                }

                                            } catch (error) {
                                                console.error(error);
                                                setWaitingPayment(false)
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

                                            setWaitingPayment(true)
                                            
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
                                                    setWaitingPayment(false)
                                                    alert(`Success, your payment of ${captureData?.data?.orderData?.currency_code} ${captureData?.data?.orderData?.value} has been received!`)
                                                    setChanged(changed + 1)
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
