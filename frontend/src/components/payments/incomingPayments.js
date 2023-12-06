import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { ToastContainer, toast } from 'react-toastify';


const PurchasesDisplay = (loggedUserId, loggedUsername, profilePicURL, roles) => {

    const boxStyleOrder = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 350,
        minHeight: 'auto',
        maxHeight: 500,
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: 'background.paper',
        border: '2px solid #00D3E0',
        boxShadow: 24,
        pt: 2,
        px: 4,
        pb: 3,
        borderRadius: '25px'
    };

    const StyledRating = styled(Rating)({
        '& .MuiRating-iconFilled': {
            color: '#00D3E0',
        },
        '& .MuiRating-iconHover': {
            color: '#00D3E0',
        },
    });

    
    const {auth, socket, setCurrentPost, currentPost, geoData} = useAuth();
    const navigate = useNavigate();
    const commentRef = useRef();

    const [bookmarkedList, setBookmarkedList] = useState([])
    const [ownedProductList, setOwnedProductList] = useState([])
    const [flaggedPosts, setFlaggedPosts] = useState([]);
    
    const [valuesToggle, setValuesToggle] = useState(false);
    const [ownedProductToggle, setOwnedProductToggle] = useState(null);
    const [bookmarkedToggle, setBookmarkedToggle] = useState(null);
    const [isPostFlagged, setIsPostFlagged] = useState(false);
    
    const [values, setValues] = useState(0);
    const [count, setCount] = useState(0);
    const [inputFocus, setInputFocus] = useState(false);

    const [finalPrice, setFinalPrice] = useState(null);
    const [finalPreorderPrice, setFinalPreorderPrice] = useState(null);
    const [currencySymbol, setCurrencySymbol] = useState("$");

    const [notiText, setNotiText] = useState("");
    const [notiPreviewText, setNotiPreviewText] = useState("");
    const [notiLink, setNotiLink] = useState("")
    
    const [openPostModal, setOpenPostModal] = useState(false);
    const [numBookmarks, setNumBookmarks] = useState(0);
    const [numBought, setNumBought] = useState(0);

    const [selectedSize, setSelectedSize] = useState("")
    const [selectedColor, setSelectedColor] = useState("")
    const [selectedModel, setSelectedModel] = useState("")
    
    const [content, setContent] = useState(false);

    const boxStylePost = {
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 360,
        padding: 2,
        bgcolor: 'background.paper',
        border: '2px solid #00D3E0',
        boxShadow: 24,
        borderRadius: '10px',
        display: "flex",
          flexDirection: "column",
          height: '550px',
        overflow: "hidden",
        overflowY: "scroll",
      };

    useEffect( ()=> {

        if(auth.currency && auth.FXRates && content.currency 
            && auth.showFXPriceSetting && content.totalPrice){

            if(auth.showFXPriceSetting === 1){

                if( content.currency !== auth.currency ){

                    const rateConv = `${content.currency}per${auth.currency}`
                    const rates = auth.FXRates[auth.currency]
                    const rateToUse = rates[rateConv]
                    let convPrice = content.totalPrice / rateToUse
                    let convPreorderPrice = content.preorderPrice / rateToUse

                    setFinalPrice(convPrice)
                    setFinalPreorderPrice(convPreorderPrice)
                
                } else {

                    setFinalPrice(content.totalPrice)
                    setFinalPreorderPrice(content.preorderPrice)
                }

                if(auth.currency === 'USD'){
                    setCurrencySymbol('$')
                } else if (auth.currency === 'CAD') {
                    setCurrencySymbol('$')
                } else if (auth.currency === 'EUR'){
                    setCurrencySymbol('€')
                } else if (auth.currency === 'GBP'){
                    setCurrencySymbol('£')
                } else if (auth.currency === 'INR'){
                    setCurrencySymbol('₹')
                } else if (auth.currency === 'JPY'){
                    setCurrencySymbol('¥')
                } else if (auth.currency === 'CNY'){
                    setCurrencySymbol('¥')
                } else if (auth.currency === 'AUD'){
                    setCurrencySymbol('$')
                } else if (auth.currency === 'NZD'){
                    setCurrencySymbol('$')
                } else if (auth.currency === 'ETH'){
                    setCurrencySymbol('Ξ')
                } else if (auth.currency === 'ADA'){
                    setCurrencySymbol('₳')
                } else if (auth.currency === 'DOGE'){
                    setCurrencySymbol('Ɖ')
                } else {
                    setCurrencySymbol('$')
                }
            }

            if( auth.showFXPriceSetting === 2 ){

                setFinalPrice(content.totalPrice)
                setFinalPreorderPrice(content.preorderPrice)

                if(content.currency === 'USD'){
                    setCurrencySymbol('$')
                } else if (content.currency === 'CAD') {
                    setCurrencySymbol('$')
                } else if (content.currency === 'EUR'){
                    setCurrencySymbol('€')
                } else if (content.currency === 'GBP'){
                    setCurrencySymbol('£')
                } else if (content.currency === 'INR'){
                    setCurrencySymbol('₹')
                } else if (content.currency === 'JPY'){
                    setCurrencySymbol('¥')
                } else if (content.currency === 'CNY'){
                    setCurrencySymbol('¥')
                } else if (content.currency === 'AUD'){
                    setCurrencySymbol('$')
                } else if (content.currency === 'NZD'){
                    setCurrencySymbol('$')
                } else if (content.currency === 'ETH'){
                    setCurrencySymbol('Ξ')
                } else if (content.currency === 'ADA'){
                    setCurrencySymbol('₳')
                } else if (content.currency === 'DOGE'){
                    setCurrencySymbol('Ɖ')
                } else {
                    setCurrencySymbol('$')
                }
            }
        }

    }, [auth.currency, auth.FXRates, content, auth.showFXPriceSetting])


    useEffect( () => {

        if(openPostModal && Object.keys(socket).length > 0 && content) {

            if(currentPost !== '' && currentPost !== 'closed' && currentPost !== content._id){

                socket.emit("closePost", {postId: currentPost})
            } 
        
            socket.emit("openPost", {postId: content._id})

            socket.on("connectedPost", () => {
                console.log("Post link is connected!")
                setCurrentPost(content._id)
            })
        }

    }, [openPostModal, socket, content])


    const logout = useLogout();

    const [creditBalance, setCreditBalance] = useState([]);

    var tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate()+1);
    var oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [dateStart, setDateStart] = useState(oneYearAgo);
    const [dateEnd, setDateEnd] = useState(tomorrow);
    const [validDateStart, setValidDateStart] = useState(false);
    const [validDateEnd, setValidDateEnd] = useState(false);

    const [userOrStore, setUserOrStore] = useState(null)
    const [postId, setPostId] = useState("")
    const [sentInvite, setSentInvite] = useState(false);
    
    const [changedData, setChangedData] = useState(false);
    var waiting = false;
    const [imageURL, setImageURL] = useState('');
    const [orders, setOrders] = useState([]);

    const [summaryModal, setSummaryModal] = useState(false);
    
    const [inquiryModal, setInquiryModal] = useState(false);
    const [creditModal, setCreditModal] = useState(false);
    const [refundModal, setRefundModal] = useState(false);
    const [ratingsModal, setRatingsModal] = useState(false);    

    const [subtotalCost, setSubtotalCost] = useState(false);
    const [shippingCost, setShippingCost] = useState(false);
    const [totalCost, setTotalCost] = useState(false);
    const [orderDate, setOrderDate] = useState(false);

    const [orderId, setOrderId] = useState("");
    
    const [name, setName] = useState("");
    const [productname, setProductname] = useState("");
    const [numberOfItems, setNumberOfItems] = useState(0);
    const [addressline1, setAddressline1] = useState("");
    const [addressline2, setAddressline2] = useState("");
    const [region, setRegion] = useState("");
    const [country, setCountry] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [zipCode, setZipCode] = useState("");

    const [completedOrder, setCompletedOrder] = useState("")
    const [refundedOrder, setRefundedOrder] = useState("")
    const [creditedOrder, setCreditedOrder] = useState("")
    const [deliveryEarly, setDeliveryEarly] = useState("")
    const [deliveryLate, setDeliveryLate] = useState("")
    const [orderStatus, setOrderStatus] = useState("")
    const [supplier, setSupplier] = useState("")
    const [preorder, setPreorder] = useState("")
    const [preorderDeadline, setPreorderDeadline] = useState("")
    const [orderCurrency, setOrderCurrency] = useState("")
    const [currencyAbbre, setCurrencyAbbre] = useState("")

    const DATESTART_REGEX = /^.{0,25}$/;
    const DATEEND_REGEX = /^.{0,25}$/;

    useEffect( ()=> {

        setCreditBalance(auth.credits)

    }, [auth.credits])


    useEffect(() => {
        if(dateEnd && dateEnd < dateStart) {
          setValidDateStart(false);
        } else if (dateEnd && dateEnd > dateStart) {
            setValidDateStart(DATESTART_REGEX.test(dateStart));
            setValidDateEnd(DATEEND_REGEX.test(dateEnd));
        } else {
          setValidDateStart(DATESTART_REGEX.test(dateStart));
        }
      }, [dateStart, dateEnd])

    useEffect( () => {

        if(auth?.roles?.includes(3780)){
    
            setUserOrStore(2)
    
        } else {
            setUserOrStore(1)
        }
    
      }, [auth?.roles])


    useEffect ( () => {

        var tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate()+1);

        var oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        setDateStart(oneYearAgo.toISOString().slice(0,10));
        setDateEnd(tomorrow.toISOString().slice(0,10));

    }, [])
    

    const openModalSummary = (event, orderId, productname, count, name, addressline1, addressline2, region, country, phoneNumber, zipCode, 
            orderPostId, ordersubtotal, ordershipping, ordertotalcost, currencysym, currencyabb, dateoforder, completedOrderToggle, refundedOrderToggle, 
            creditedOrderToggle, shippingDateEarly, shippingDateLate, supplierId, orderPhase, preorderSwitch, lastPreorder, size, color, model, imageLink) => {

        event.preventDefault();
        setOrderId(orderId) 
        setProductname(productname)
        
        setNumberOfItems(count)
        setSelectedSize(size)
        setSelectedColor(color)
        setSelectedModel(model)

        setName(name)
        setAddressline1(addressline1)
        setAddressline2(addressline2)
        setRegion(region)
        setCountry(country)
        setPhoneNumber(phoneNumber)
        setZipCode(zipCode)
        setPostId(orderPostId)
        
        setSubtotalCost(ordersubtotal)
        setShippingCost(ordershipping)
        setTotalCost(ordertotalcost)
        setOrderCurrency(currencysym)
        setCurrencyAbbre(currencyabb)
        setOrderDate(dateoforder)

        setDeliveryEarly(shippingDateEarly)
        setDeliveryLate(shippingDateLate)

        setOrderStatus(orderPhase)
        setSupplier(supplierId)
        setPreorder((preorderSwitch == 1 ? true : false))
        setPreorderDeadline(lastPreorder)
        
        setImageURL(imageLink)

        setCompletedOrder(completedOrderToggle)
        setRefundedOrder(refundedOrderToggle)
        setCreditedOrder(creditedOrderToggle)

        setSummaryModal(true);
    }

    const closeModalSummary = () => {

        setSummaryModal(false);
    }

    const openModalInquiry = (event) => {

        event.preventDefault();

        setInquiryModal(true);
    }

    const closeModalInquiry = () => {
        setInquiryModal(false);
    }

    const handleCloseRatingsModal = () => {
        setRatingsModal(false);
    };

    async function handleSubmitRatings(event, starRating, caption, postId) {

        if(waiting || ownedProductToggle || userOrStore === 2){
            return
        }

        waiting = true;

        if(starRating && caption){
            
            profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);

            const profanityCheck = profanity.exists(caption)
            
            if(!profanityCheck){

                if(userOrStore === 1){

                    const ownedDone = await addUserOwnedProduct(auth.userId, postId, starRating, caption, auth.accessToken)

                    if(ownedDone){
                        waiting = false;
                        setRatingsModal(false);
                        setChangedData(changedData + 1)
                    }
                
                } else {

                    const ownedDone = await addStoreOwnedProduct(auth.userId, postId, starRating, caption, auth.accessToken)

                    if(ownedDone){
                        waiting = false;
                        setRatingsModal(false);
                        setChangedData(changedData + 1)
                    }
                }
            
            } else {

                toast.error("This post appears to have inappropriate language, please try again", {
                    position: "bottom-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
            }

        }
    }

    const openModalCredits = (event) => {

        event.preventDefault();

        setCreditModal(true);
    }

    const closeModalCredits = () => {

        setCreditModal(false);
    }

    const openModalRefund = (event) => {

        event.preventDefault();

        setRefundModal(true);
    }

    const closeModalRefund = () => {

        setRefundModal(false);
    }
    

    function OrderSummaryModal() {

        //Rate, email, request refund buttons

        async function openRatingsModal(event) {
            
            event.preventDefault()

            setRatingsModal(true);
            
        }

        return (
          <React.Fragment>
            <Modal
              open={summaryModal}
              onClose={closeModalSummary}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyleOrder, width: 350 }}>
    
                <div className='flex flex-col gap-y-2'>
                    <div className='flex flex-col w-full items-center'>

                        <p className='text-center py-3'><b>Status:</b> {orderStatus === 1 && "To Be Shipped"}{orderStatus === 2 && "In Transit"}{orderStatus === 3 && "Out For Delivery"}{orderStatus === 4 && "Delivered"}{orderStatus === 5 && "Cancelled"}{orderStatus === 6 && "Credited"}{orderStatus === 7 && "Refunded"}</p>

                        <p className='text-center py-2'><b>Product:</b> {productname}</p>
                        <p className='text-center'>Items: {numberOfItems}</p>
                        <p className='text-center'>Size: {selectedSize}</p>
                        <p className='text-center'>Color: {selectedColor}</p>
                        <p className='text-center pb-2'>Model: {selectedModel}</p>

                        <img className='w-[242px] rounded-xl' src={imageURL}/>
                    </div>

                    {(!completedOrder && preorder && preorderDeadline) && <div className='text-sm pt-3'>
                        <p><b>Group Buy</b> </p>
                        <p><b>Preorder Deadline:</b> {format(new Date(preorderDeadline), "ccc',' LLLL d',' yyyy")}</p>
                    </div>}

                    {(!preorder) && <div className='text-sm pt-3'>
                        <p><b>Solo Buy</b> </p>
                    </div>}
                    
                    {(!completedOrder && deliveryEarly && deliveryLate) && <div className='text-sm pt-3'>
                        <p><b>Estimated Delivery Window:</b> </p>
                        <p>{format(new Date(deliveryEarly), "ccc',' LLLL d',' yyyy")} to </p>
                        <p>{format(new Date(deliveryLate), "ccc',' LLLL d',' yyyy")}</p>
                    </div>}

                    <div className='text-sm pt-2'>
                        <p><b>Recipient Name:</b> {name}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Address:</b> {addressline1} {addressline2}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Region:</b> {region}</p>
                    </div>

                    <div className='text-sm  pt-2'>
                        <p><b>Country:</b> {country}</p>
                    </div>

                    <div className='text-sm  pt-2'>
                        <p><b>Phone Number:</b> {phoneNumber}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Zip Code:</b> {zipCode}</p>
                    </div>

                    <div className='text-sm pt-6'>
                        <p><b>Subtotal:</b> {orderCurrency}{Number(subtotalCost).toFixed(2)}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Shipping Cost:</b> {orderCurrency}{Number(shippingCost).toFixed(2)}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Total Price:</b> {currencyAbbre.toUpperCase()}{orderCurrency}{Number(totalCost).toFixed(2)}</p>
                    </div>

                    <div className='text-sm pt-2'>
                        <p><b>Order Date:</b> {format(new Date(orderDate), "ccc',' LLLL d',' yyyy h':'mm bbb")}</p>
                    </div>

                    <div className='flex flex-col items-center justify-center w-full'>
                        <div className='pt-6'>
                            <button
                                className={`bg-gray-200 rounded-2xl px-4 py-2 gap-x-2 flex flex-row ${ (completedOrder && orderStatus === 4) ?  ' hover:cursor-pointer hover:bg-[#00D3E0] hover:text-white ' : ' hover:cursor-not-allowed bg-gray-200 text-gray-500' }`}
                                onClick={(event)=>openRatingsModal(event)}
                                disabled={ !completedOrder || orderStatus !== 4}
                                >
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
                                    stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>   
                                Rate Completed Order
                            </button>
                        </div>

                        <div className='pt-2'>
                            <button
                                className='bg-gray-200 rounded-2xl px-4 py-2 hover:bg-[#00D3E0] hover:text-white gap-x-2 flex flex-row'
                                onClick={(event)=>openModalInquiry(event)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                                    strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" 
                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>

                                Issue With The Order?
                            </button>
                        </div>
                    </div>

                </div>
               
              </Box>
            </Modal>
          </React.Fragment>
        );
    }

    function OrderInquiryModal() {

        const MESSAGE_REGEX = /^.{1,2000}$/;

        const [message, setMessage] = useState('');

        const [validMessage, setValidMessage] = useState(false);
        const [messageFocus, setMessageFocus] = useState(false);
        
        useEffect(() => {
            setValidMessage(MESSAGE_REGEX.test(message));
        }, [message])


        const handleEmailReport = async (event) => {

            event.preventDefault();
        
            if(waiting){
              return
            }
        
            waiting = true;;
        
            profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);
            const profanityCheck = profanity.exists(message)
        
            if(!profanityCheck){
        
              const submitted = await addEmailOrders(auth.userId, orderId, message, auth.accessToken)
            
              if(submitted){
              
                toast.success("Message sent!", {
                  position: "bottom-center",
                  autoClose: 1500,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                  });
        
                setSentInvite(true);
                waiting = false;;
        
                setInquiryModal(false);
        
              } else {
        
                toast.error("Sorry, message was not sent, please try again", {
                  position: "bottom-center",
                  autoClose: 1500,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                  });
        
                const warnUser = await addWarnings(auth.userId, auth.accessToken)
                if(warnUser?.status === 202){
                  logout();
                } else {
                  waiting = false;;
                } 

                setInquiryModal(false);
              }
        
            }else {
              toast.error("This post appears to have inappropriate language, please try again", {
                position: "bottom-center",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
                });
        
                const warnUser = await addWarnings(auth.userId, auth.accessToken)
                if(warnUser?.status === 202){
                  logout();
                } else {
                  waiting = false;;
                } 
            }
          }
      
        return (
          <React.Fragment>
            <Modal
              open={inquiryModal}
              onClose={closeModalInquiry}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyleOrder, width: 350 }}>

                <div className='flex flex-col items-center justify-center'>
                    <p className='text-center pt-4 text-xl font-semibold pb-2 text-[#00D3E0]'>Report An Issue</p>

                    <div className="flex flex-col w-full">

                        <div className='py-2'>
                            <p className='font-semibold'>Message:</p>
                            <textarea
                                aria-label="message" 
                                type="text" 
                                id="firstname"
                                autoComplete="off"
                                placeholder="Message (2000 character limit):"
                                className='inline-block text-sm text-gray-base focus:outline-[#00D3E0]
                                w-full mr-3 h-40 py-3 px-3 border border-gray-primary rounded mb-2' 
                                onChange={ ( e ) => setMessage(e.target.value)}
                                value={message}
                                aria-invalid={validMessage ? "false" : "true"}
                                onFocus={() => setMessageFocus(true)}
                                onBlur={() => setMessageFocus(false)}
                            />
                            </div>
                            
                            <div className='flex flex-row gap-x-8 py-4'>
                            
                                <button 
                                    className={`${!validMessage  || sentInvite || waiting
                                        ? "bg-gray-100 text-gray-400" : "bg-[#00D3E0] text-white"}  
                                        w-full rounded-xl py-3 font-bold border-solid border-2 flex justify-center 
                                        items-center gap-x-3`}
                                    disabled={ (!validMessage  || sentInvite || waiting ) 
                                        ? true : false}
                                    onClick={(event)=>handleEmailReport(event)}
                                    onKeyDown={(event)=>{
                                        if (event.key === "Enter") {
                                        handleEmailReport(event);
                                        }
                                    }}
                                    >
                                    {waiting && 
                                        <div aria-label="Loading..." role="status">
                                            <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                                            <path
                                                className="fill-gray-200"
                                                d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                                            <path
                                                className="fill-gray-800"
                                                d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                                            </svg>
                                        </div>
                                    }
                                    
                                    Send
                                </button>
                                <button 
                                    className={`align-center px-4 py-4 text-black
                                    border-2 rounded-xl border-black bg-white text-base font-semibold
                                    hover:bg-orange-200 hover:text-black`}
                                    onClick={closeModalInquiry}
                                    onKeyDown={(event)=>{
                                        if (event.key === "Enter") {
                                        closeModalInquiry();
                                        }
                                    }}
                                    >
                                        Close
                                </button>
                            </div>

                        </div>

                    </div>

                    </Box>
            </Modal>
          </React.Fragment>
        );
    }

    function OrderRatingsModal({postId}) {

        const [starRating, setStarRating] = useState(5);
        const [validStarRating, setValidStarRating] = useState(false);
    
        const [caption, setCaption] = useState('');
        const [validCaption, setValidCaption] = useState(false);
        const [captionFocus, setCaptionFocus] = useState(false);
    
        const STAR_RATING_REGEX = /^[1-5.]+$/;
        const CAPTION_REGEX = /^.{1,70}$/;

        useEffect(() => {
            setValidCaption(CAPTION_REGEX.test(caption));
          }, [caption])
    
        useEffect(() => {
            setValidStarRating(STAR_RATING_REGEX.test(starRating));
          }, [starRating])
      
        return (
          <React.Fragment>
            <Modal
              open={ratingsModal}
              onClose={handleCloseRatingsModal}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyleOrder, width: 400 }}>
    
              <div className="flex flex-col pt-4">

              <label className='text-base font-semibold pl-2 pb-2'>New Caption:</label>
                
                <input 
                  aria-label="Caption" 
                  type="text" 
                  id="caption"
                  placeholder="Caption"
                  className='text-sm text-gray-base w-full mr-3 py-5 px-4 h-2 border 
                    border-gray-primary rounded mb-2 focus:outline-[#00D3E0]' 
                  onChange={ ( e ) => setCaption(e.target.value)}
                  value={caption}
                  aria-invalid={validCaption ? "false" : "true"}
                  onFocus={() => setCaptionFocus(true)}
                  onBlur={() => setCaptionFocus(false)}
                />

              <label className='text-base font-semibold pl-2 pt-4'>New Rating:</label>
    
                <div className="flex flex-row items-center justify-center pb-4">
    
                  <StyledRating
                    name="rating"
                    value={starRating}
                    size="large"
                    onChange={(event, newValue) => {
                      setStarRating(newValue);
                    }}
                    defaultValue={1.0} 
                    precision={0.5}
                    max={5}
                  />
                    
                  <div className="flex flex-row justify-center items-center pl-6">
                    <select className="h-9 border border-gray-primary rounded" 
                      value={starRating}
                      onChange={(event) => {
                        setStarRating(event.target.value);
                      }}>
                      <option value={0.5}>0.5 / 5.0</option>
                      <option value={1.0}>1.0 / 5.0</option>
                      <option value={1.5}>1.5 / 5.0</option>
                      <option value={2.0}>2.0 / 5.0</option>
                      <option value={2.5}>2.5 / 5.0</option>
                      <option value={3.0}>3.0 / 5.0</option>
                      <option value={3.5}>3.5 / 5.0</option>
                      <option value={4.0}>4.0 / 5.0</option>
                      <option value={4.5}>4.5 / 5.0</option>
                      <option value={5.0}>5.0 / 5.0</option>
                    </select>
                  </div>  
                </div>
                <div className='flex justify-between pt-2'>
                    <button 
                        className={`align-center mb-4 px-4 py-2 text-[#00D3E0] 
                        border-2 rounded-xl border-[#00D3E0] bg-white text-base font-semibold
                        hover:bg-[#00D3E0] hover:text-white flex justify-center items-center gap-x-2
                        ${((caption && !validCaption) || !validStarRating || waiting ) && 'opacity-50' }`}
                        onClick={(event)=>handleSubmitRatings(event, starRating, caption, postId)}
                        disabled={( (caption && !validCaption) || !validStarRating || waiting)}>
                        {waiting && 
                            <div aria-label="Loading..." role="status">
                                <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                                <path
                                    className="fill-gray-200"
                                    d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                                <path
                                    className="fill-gray-800"
                                    d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                                </svg>
                            </div>
                        }
                        Submit
                    </button>
                    <button 
                        className={`align-center mb-4 px-4 py-2 text-black
                        border-2 rounded-xl border-black bg-white text-base font-semibold
                        hover:bg-orange-200 hover:text-black`}
                        onClick={handleCloseRatingsModal}>
                            Cancel
                    </button>
                </div>

                </div>
              </Box>
            </Modal>
          </React.Fragment>
        );
    }

    async function getOrderData(){

        const orderData = await getUserOrders(auth.userId, dateStart, dateEnd, auth.accessToken, auth.userId)

        if(orderData){

            var postsHash = {}
            var productsHash = {}

            if(orderData.data.foundPosts?.length > 0){

                for(let i=0; i<orderData.data.foundPosts?.length; i++){
                    if(postsHash[orderData.data.foundPosts[i]._id] === undefined){
                        postsHash[orderData.data.foundPosts[i]._id] = orderData.data.foundPosts[i]
                        productsHash[orderData.data.foundPosts[i]._productId] = orderData.data.foundPosts[i]._productId
                    }
                }
            }

            if(orderData.data.foundOrders?.length > 0){
                for(let i=0; i<orderData.data.foundOrders?.length;i++){
                    orderData.data.foundOrders[i].previewMediaURL = postsHash[orderData.data.foundOrders[i]._postId].previewMediaURL
                }   
            }

            if(orderData.data.ownedProducts?.length > 0){
                for(let i=0; i<orderData.data.ownedProducts?.length; i++){
                    if(productsHash[orderData.data.ownedProducts[i]._productId] !== undefined){
                        setOwnedProductToggle(true)
                    }
                }
            }

            setOrders(orderData.data.foundOrders)
        }
    }

    useEffect( ()=> {

        getOrderData()        

    }, [changedData])


    const handlePostClick = (event, postId) => {

        event.preventDefault();
        event.stopPropagation();

        async function getPostData(){

            const post = await getSinglePost(postId, auth.accessToken, auth.userId)
            
            if(post){

                setFlaggedPosts(post.data.flaggedPosts)
                setOwnedProductList(post.data.ownedProductsFound?.products)
                setBookmarkedList(post.data.userBookmarks?.bookmarks)
                
                if(post.data.userData){
                    post.data.postData.userProfilePicURL = post.data.userData.profilePicURL
                }

                if(post.data.foundProducts){
                    post.data.postData.ownedByCount = post.data.foundProducts.ownedByCount
                }

                setContent(post.data.postData)
                setValues(post.data.postData.valuesCount)
                setCount(post.data.postData.commentsCount)

                setOpenPostModal(true)

                if(auth.userId !== post.data.postData._userId && (post.data.postData.postClass === 1 || post.data.postData.postClass === 2 )){
                    userView()
                }
            }
        }

        getPostData();        

    }

    const handlePostModalClose = () => {

        if(Object.keys(socket).length !== 0 && currentPost !== 'closed'){
    
            if(currentPost !== ''){
              socket.emit("closePost", {postId: currentPost, userId: auth.userId})
              setCurrentPost("closed")
            } 
        }

        setOpenPostModal(false);
    }


    useEffect( ()=> {

        if(content){

            if(content.valuedBy?.some(e=>e._userId === auth.userId)){
                setValuesToggle(true);
            } else{
                setValuesToggle(false);
            } 
        }

    }, [content])


    useEffect( () => {

        if(ownedProductList && content){
            
            if(ownedProductList.some(e=>e._productId === content._productId)){
                setOwnedProductToggle(true);
            } else{
                setOwnedProductToggle(false);
            } 
        }

    }, [ownedProductList, content])


    useEffect( ()=> {

        if(content.ownedByCount){
            setNumBought(content.ownedByCount)
        }

    }, [content])


    useEffect( () => {

        if(bookmarkedList){
            
            if(bookmarkedList.some(e=>e._postId === content._id)){
                setBookmarkedToggle(true);
            } else{
                setBookmarkedToggle(false);
            } 
        }

    }, [bookmarkedList, content])


    useEffect( ()=> {

        if(content.bookmarksCount){
            setNumBookmarks(content.bookmarksCount)
        }

    }, [content])

    async function userView(postId){
                
        const addedView = await addUserViewed(auth.userId, postId, geoData?.IPv4, auth.accessToken)
        
        if(addedView){
            console.log("Added to views")
        }
    }

    
    useEffect( ()=> {

        if(flaggedPosts?.some(e=>e._postId === content._id)){
            setIsPostFlagged(true)
        } else {
            setIsPostFlagged(false)
        }

    }, [flaggedPosts, content])
    

    return(
        <>
        <div className='flex flex-col w-full justify-center mx-auto'>

            <div className='text-2xl text-center pt-2'>
                <p>Account Credits:</p>
            </div>

            <div className="flex flex-row overflow-auto gap-x-3 sm:gap-x-4 justify-center items-center pb-6">

                {creditBalance?.length > 0 ? creditBalance.map(function(item) {

                    return (
                        <>
                        <div className='text-2xl'>
                            <span key={item._id}>{item.currency}</span>
                            <span key={item._id}>{item.currencySymbol ? item.currencySymbol : '$' }</span>
                            <span key={item._id}>{Number(item.amount).toFixed(2)}</span>
                        </div>
                        </>
                    )

                }) : 

                    <div className='text-2xl'>
                        <p>{auth.currency}{currencySymbol}0.00</p>
                    </div>
                }

            </div>
            
            <div className="flex flex-row gap-x-1 sm:gap-x-4 justify-center items-center pb-6">

                <div className="flex flex-col">
                
                <label className="flex justify-start text-sm sm:text-base
                    text-[#00D3E0] font-bold">Date Start (Required):</label>
                    <input 
                        aria-label="dateStart" 
                        type="date" 
                        id="dateStart"
                        placeholder="Start Date"
                        className={`text-sm text-gray-base w-[150px] sm:w-[200px] mr-1 sm:mr-3 py-5 px-4 h-10
                        border border-gray-primary rounded focus:outline-[#00D3E0]
                        ${(!dateStart) ? 'text-gray-400' : 'text-black'}
                        `}
                        onChange={ ( e ) => setDateStart(e.target.value)}
                        value={dateStart}
                    />
                </div>

                <div className="flex flex-col">
                
                <label className="flex justify-start text-sm sm:text-base
                    text-[#00D3E0] font-bold">Date End (Required):</label>
                
                <input 
                    aria-label="dateEnd" 
                    type="date" 
                    id="dateEnd"
                    placeholder="End Date"
                    className={`text-sm text-gray-base mr-1 sm:mr-3 w-[150px] sm:w-[200px] py-5 px-4 h-10
                        border border-gray-primary rounded focus:outline-[#00D3E0]
                        ${(!dateEnd) ? 'text-gray-400' : 'text-black'}
                        `}
                    onChange={ ( e ) => setDateEnd(e.target.value)}
                    value={dateEnd}
                />

                </div>

                <button className={`flex items-center text-sm sm:text-base 
                    rounded-2xl bg-gray-200 h-12 px-2 sm:px-4 py-1 hover:bg-[#00D3E0] 
                    hover:text-white ${(!validDateStart || !validDateEnd) ? 'text-gray-400 cursor-not-allowed' : 'text-black cursor-pointer'}`} 
                    onClick={(event)=>{getOrderData(event)}}
                    disabled={!validDateStart || !validDateEnd}>
                    Retrieve Purchases
                </button>
            </div>

            <div className='flex sticky top-0 opacity-100 flex-col md:flex-row w-full border-y-2 md:border-0'>

                <div className='flex flex-row items-center justify-evenly py-4 
                    sticky top-0 opacity-100 bg-white w-full md:border-y-2'>

                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Product"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Order \n Options"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Shipping \n Status"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Order \n Status"}</p></div>
                    
                </div>
                
                <div className='flex flex-row items-center justify-evenly py-4 
                    sticky top-0 opacity-100 bg-white w-full md:border-y-2'>
                    
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Estimated \n Delivery"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Total \n Price"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Purchase \n Currency"}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line flex items-center justify-center'> <p className='text-center text-[#00D3E0] font-semibold'>{"Order \n Date"}</p></div>
                </div>

            </div>

            {orders?.length > 0 ?

                orders.map( (order, index) => (

                <div className='flex flex-col md:flex-row hover:cursor-pointer hover:bg-gray-100 w-full border-b-2 md:border-0'
                    key={`${order._id}_button`}
                    onClick={(event)=>{openModalSummary(event, order._id, order.productname, order.numberOfItems, order.recipient, order.address_line1, order.address_line2, order.address_region, 
                        order.address_country, order.phoneNumber, order.zipCode, order._postId, order.paidSubtotalPrice, order.paidShipping, order.paidTotalPrice, 
                        order.currencySymbol, order.paidCurrency, order.createdAt, !order.active, order.refundCompleted, order.creditsCompleted, order.shippingDateEarly, order.shippingDateLate, 
                        order.supplier, order.orderStatus, order.preorderSwitch, order.preorderDeadline, order.selectedSize, order.selectedColor, order.selectedModel, order.previewMediaURL)}}
                    >

                <div className='flex flex-row items-center justify-evenly md:border-b w-full py-4'>

                    <div className='w-[80px] md:w-[150px] whitespace-pre-line hover:bg-gray-300 rounded-xl py-2'
                        onClick={(event)=>handlePostClick(event, order._postId)}
                        > 
                        <div className='flex flex-col justify-center items-center'>
                            <p className='text-center text-xs sm:text-sm'>{order.productname}</p>
                            <img className='rounded-xl w-16 h-16 md:w-20 md:h-20' src={order.previewMediaURL}/>
                        </div>
                    </div>

                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'>
                        <div className='flex flex-col justify-center items-center'>
                            <p className='text-center text-xs sm:text-sm'># of Items: {order.numberOfItems}</p>
                            <p className='text-center text-xs sm:text-sm'>Size: {order.selectedSize}</p>
                            <p className='text-center text-xs sm:text-sm'>Color: {order.selectedColor}</p>
                            <p className='text-center text-xs sm:text-sm'>Model: {order.selectedModel}</p>
                        </div>
                    </div>

                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'> 
                        <div className='flex flex-col justify-center items-center'>
                            <p className='text-center text-xs sm:text-sm'>{order.shippingStatus}</p> 
                            <p className='text-center text-xs sm:text-sm'>Tracking #: {order.trackingNumber}</p>
                        </div>
                    </div>

                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'> 
                        <div className='flex flex-col justify-center items-center'>
                            <p className='text-center text-xs sm:text-sm'>{order.orderStatus === 1 && "To Be Shipped"}{order.orderStatus === 2 && "In Transit"}{order.orderStatus === 3 && "Out For Delivery"}{order.orderStatus === 4 && "Delivered"}{order.orderStatus === 5 && "Cancelled"}{order.orderStatus === 6 && "Credited"}{order.orderStatus === 7 && "Refunded"}</p>
                            <p className='text-center text-xs sm:text-sm'>{order.preorderSwitch ? "Group Buy" : 'Solo Buy'}</p>
                        </div>
                    </div>
                </div>
                
                <div className='flex flex-row items-center justify-evenly md:border-b w-full py-4'
                    onClick={(event)=>{openModalSummary(event, order._id, order.productname, order.numberOfItems, order.recipient, order.address_line1, order.address_line2, order.address_region, 
                        order.address_country, order.phoneNumber, order.zipCode, order._postId, order.paidSubtotalPrice, order.paidShipping, order.paidTotalPrice, 
                        order.currencySymbol, order.paidCurrency, order.createdAt, !order.active, order.refundCompleted, order.creditsCompleted, order.shippingDateEarly, order.shippingDateLate, 
                        order.supplier, order.orderStatus, order.preorderSwitch, order.preorderDeadline, order.selectedSize, order.selectedColor, order.selectedModel, order.previewMediaURL)}}>
                    
                <div className='w-[80px] md:w-[150px] whitespace-pre-line'> <p className='text-center text-xs sm:text-sm'>{order.shippingDateEarly ? `${format(new Date(order.shippingDateEarly), "cccc',' LLLL d',' yy")}-${format(new Date(order.shippingDateLate), "cccc',' LLLL d',' yy")}` : 'Not Available'}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'> <p className='text-center text-xs sm:text-sm'>{order.currencySymbol}{Number(order.paidTotalPrice).toLocaleString('en',{minimumFractionDigits:2, maximumFractionDigits:2})}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'> <p className='text-center text-xs sm:text-sm'>{order.paidCurrency.toUpperCase()}</p></div>
                    <div className='w-[80px] md:w-[150px] whitespace-pre-line'> <p className='text-center text-xs sm:text-sm'>{format(new Date(order.createdAt), "cccc',' LLLL d',' yyyy h':'mm bb")}</p></div>
                </div>

            </div>

                ))

                :

                null
            }

            </div>


        <OrderSummaryModal orderId={orderId} name={name} productname={productname} numberOfItems={numberOfItems}
            region={region} country={country} phoneNumber={phoneNumber} zipCode={zipCode} imageURL={imageURL} />
        
        <OrderInquiryModal />
        
        <OrderRatingsModal postId={postId} />

        <Modal
            style={
                {zIndex: 10001}
            }
            open={openPostModal}
            disableAutoFocus={true}
            // onClick={(event)=>event.nativeEvent.stopImmediatePropagation()}
        
            onClose={handlePostModalClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            >
            <Box sx={boxStylePost} style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '6px'}}>
            
                <PostHeaderPostModal postUsername={content.username} profilePicURL={content.userProfilePicURL}
                postPrice={finalPrice} currencySymbol={currencySymbol} postProduct={content.productname} postStore={content.storename} 
                postRatings={content.starRating} postMeasurement={content.measurement} postProductId={content._productId}
                postBrand={content.brand} loggedUserId={loggedUserId} userOrStore={userOrStore} 
                content={content} flaggedPosts={flaggedPosts} setFlaggedPosts={setFlaggedPosts}
                postClass={content.postClass} caption={content.caption} isStorePost={content.isStorePost}
                />
                
                <PostImagePostModal mediaURLs={content.mediaCarouselURLs} src={content.previewMediaURL} 
                coverIndex={content.coverIndex} handlePostModalClose={handlePostModalClose}
                />

                <PostFooterPostModal caption={content.caption} postRatings={content.starRating}  
                    posted={content.createdAt} postClass={content.postClass} 
                    city={content.city} link={content.link} postDescription={content.description} 
                    preordersCount={content.preordersCount} minimumOrderQuantity={content.minimumOrderQuantity}
                    preorderDeadline={content.preorderDeadline} orderedList={content.orderedBy}
                    postId={content._id} postCurrency={content.currency} productname={content.productname}
                    previewMediaURL={content.previewMediaURL} postTotalPrice={finalPrice} postNumberOfItems={content.numberOfItems}
                    preorderPrice={finalPreorderPrice} buyNowSwitch={content.buyNowSwitch} preorderSwitch={content.preorderSwitch} 
                    currencySymbol={currencySymbol} canReceivePayments={content.canReceivePayments}
                />

                <PostActionsPostModal loggedUserId={loggedUserId} loggedUsername={loggedUsername} 
                    postUserId={content._userId} postUsername={content.username} postId={content._id} 
                    valuesToggle={valuesToggle} setValuesToggle={setValuesToggle} 
                    values={values} setValues={setValues} postCaption={content.caption} 
                    userOrStore={userOrStore} productId={content._productId}
                    ownedProductToggle={ownedProductToggle} bookmarkedToggle={bookmarkedToggle}
                    setNumBought={setNumBought} setNumBookmarks={setNumBookmarks}
                    numBought={numBought} numBookmarks={numBookmarks}
                    setBookmarkedList={setBookmarkedList} setOwnedProductList={setOwnedProductList}
                    bookmarkedList={bookmarkedList} ownedProductList={ownedProductList}
                    isPostFlagged={isPostFlagged} postClass={content.postClass}
                />

                <PostComments loggedUserId={loggedUserId} loggedUsername={loggedUsername}  
                    postUserId={content._userId} postUsername={content.username} postId={content._id} 
                    count={count} setCount={setCount} inputFocus={inputFocus}
                    commentRef={commentRef} caption={content.caption} 
                    postDescription={content.description} postTaxChargesIncluded={content.taxChargesIncluded}
                    postOpenToResell={content.openToResell}
                    postClass={content.postClass}
                />
                
            </Box>
        </Modal>

        <ToastContainer
        toastStyle={{ backgroundColor: "#00D3E0" }}
          position="bottom-center"
          autoClose={1500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          />

        </>
    )
}

export default PurchasesDisplay
