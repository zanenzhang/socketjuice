import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNowStrict } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import getAllOrders from '../../helpers/Checkout/getAllOrders';
import getCreditRefundRequests from '../../helpers/Checkout/getCreditRefunds';

import editOrderContact from '../../helpers/Checkout/editOrderContact';
import editOrderStatus from '../../helpers/Checkout/editOrderStatus';
import editOrderCredit from '../../helpers/Checkout/editOrderCredit';
import editOrderRefund from '../../helpers/Checkout/editOrderRefund';

import AdminOrderLine from './AdminOrderLine';


const AdminOrders = () => {

    const boxStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 350,
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        pt: 2,
        px: 4,
        pb: 3,
        borderRadius: '25px'
    };

    const { auth } = useAuth();

    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate()-1);
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate()+1);

    const [dateStart, setDateStart] = useState((yesterday.toISOString()).slice(0,10));
    const [dateEnd, setDateEnd] = useState((tomorrow.toISOString()).slice(0,10));
    const [creditRequestedFilter, setCreditRequestedFilter] = useState('All');
    const [refundRequestedFilter, setRefundRequestedFilter] = useState('All');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [moqPreorderFilter, setMoqPreorderFilter] = useState('All');
    
    const [changedData, setChangedData] = useState(false);
    var waiting = false;
    const [imageURL, setImageURL] = useState('');
    const [orders, setOrders] = useState([]);

    const [contactModal, setContactModal] = useState(false);
    const [statusModal, setStatusModal] = useState(false);
    const [creditModal, setCreditModal] = useState(false);
    const [refundModal, setRefundModal] = useState(false);

    const [orderId, setOrderId] = useState("");
    
    const [name, setName] = useState("");
    const [productname, setProductname] = useState("");
    const [address, setAddress] = useState("");
    const [region, setRegion] = useState("");
    const [country, setCountry] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [zipCode, setZipCode] = useState("");

    const [orderStatus, setOrderStatus] = useState("");
    const [shippingStatus, setShippingStatus] = useState("");
    const [shippingDateEarly, setShippingDateEarly] = useState("");
    const [shippingDateLate, setShippingDateLate] = useState("");
    const [moqDeadline, setMoqDeadline] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [preorder, setPreorder] = useState("");

    const [profileUserId, setProfileUserId] = useState("");
    const [creditReq, setCreditReq] = useState("");
    const [refundReq, setRefundReq] = useState("");
    const [creditedAlready, setCreditedAlready] = useState("");
    const [refundedAlready, setRefundedAlready] = useState("");
    

    const openModalContact = (event, orderId, productname, name, address, region, country, phoneNumber, zipCode, imageLink) => {

        event.preventDefault();
        setOrderId(orderId) 
        setProductname(productname)
        setName(name)
        setAddress(address)
        setRegion(region)
        setCountry(country)
        setPhoneNumber(phoneNumber)
        setZipCode(zipCode)
        setImageURL(imageLink)

        setContactModal(true);
    }

    const closeModalContact = () => {

        setContactModal(false);
    }

    const openModalStatus = (event, orderId, productname, name, orderStatus, shippingStatus, trackingNumber, preorder, dateEarly, dateLate, orderDeadline, imageLink) => {

        event.preventDefault();
        setOrderId(orderId) 
        setProductname(productname)
        setName(name)
        setOrderStatus(orderStatus)
        setShippingStatus(shippingStatus)
        setShippingDateEarly(dateEarly)
        setShippingDateLate(dateLate)
        setMoqDeadline(orderDeadline)
        setTrackingNumber(trackingNumber)
        setPreorder(preorder)
        setImageURL(imageLink)

        setStatusModal(true);
    }

    const closeModalStatus = () => {
        setStatusModal(false);
    }

    const openModalCredits = (event, orderId, productname, name, profileUserId, creditsRequested, creditsCompleted, imageLink) => {

        event.preventDefault();
        setOrderId(orderId) 
        setProductname(productname)
        setName(name)
        setProfileUserId(profileUserId)
        setCreditReq(creditsRequested ? true : false)
        setCreditedAlready(creditsCompleted ? true : false)
        setImageURL(imageLink)

        setCreditModal(true);
    }

    const closeModalCredits = () => {

        setCreditModal(false);
    }

    const openModalRefund = (event, orderId, productname, name, profileUserId, refundRequested, refundCompleted, imageLink) => {

        event.preventDefault();
        setOrderId(orderId) 
        setProductname(productname)
        setName(name)
        setProfileUserId(profileUserId)
        setRefundReq(refundRequested ? true : false)
        setRefundedAlready(refundCompleted ? true: false)
        setImageURL(imageLink)

        setRefundModal(true);
    }

    const closeModalRefund = () => {

        setRefundModal(false);
    }
    

    function OrderContactModal({orderId, productname, name, address, region, country, phoneNumber, zipCode, imageURL}) {

        const [tempName, setTempName] = useState(name);
        const [tempAddress, setTempAddress] = useState(address);
        const [tempRegion, setTempRegion] = useState(region);
        const [tempCountry, setTempCountry] = useState(country);
        const [tempPhoneNum, setTempPhoneNum] = useState(phoneNumber);
        const [tempZipCode, setTempZipCode] = useState(zipCode);

        async function submitEditContact(event) {
            
            event.preventDefault()

            if(waiting){
                return
            }
            const result = await editOrderContact(orderId, tempName, tempAddress, tempRegion, tempCountry, tempPhoneNum, tempZipCode, auth.accessToken, auth.userId)
    
            if(result){
                waiting = false;
                setContactModal(false);
                setChangedData(!changedData);
            }
        }
      
        return (
          <React.Fragment>
            <Modal
              open={contactModal}
              onClose={closeModalContact}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyle, width: 350 }}>
    
                <div className='flex flex-col justify-center'>
                    <p>OrderId:{orderId}</p>
                    <p>Product Name:{productname}</p>

                    <img className='w-20' src={imageURL}/>
                    
                    <div className='pt-2'>
                    <p>Recipient Name</p>
                    <input
                        className='border border-[#8BEDF3]' 
                        placeholder='Recipient Name'
                        value={tempName}
                        onChange={event=>setTempName(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Address</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Address'
                        value={tempAddress}
                        onChange={event=>setTempAddress(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Region</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Region'
                        value={tempRegion}
                        onChange={event=>setTempRegion(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Country</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Country'
                        value={tempCountry}
                        onChange={event=>setTempCountry(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Phone Number</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Address'
                        value={tempPhoneNum}
                        onChange={event=>setTempPhoneNum(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Zip Code</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Zip Code'
                        value={tempZipCode}
                        onChange={event=>setTempZipCode(event.target.value)}
                    />
                    </div>

                    <div className='pt-6'>
                        <button
                            className='bg-gray-200 rounded-2xl px-4 py-2 hover:bg-[#8BEDF3] hover:text-white'
                            onClick={(event)=>submitEditContact(event)}>
                            Submit Edit Contact
                        </button>
                    </div>

                </div>
               
              </Box>
            </Modal>
          </React.Fragment>
        );
    }

    function OrderStatusModal({orderId, productname, name, orderStatus, shippingStatus, trackingNumber, preorder, shippingDateEarly, shippingDateLate, moqDeadline, imageURL}) {

        const [tempOrderStatus, setTempOrderStatus] = useState(orderStatus);
        const [tempShippingStatus, setTempShippingStatus] = useState(shippingStatus);

        const [tempShippingDateEarly, setTempShippingDateEarly] = useState(shippingDateEarly.slice(0,10));
        const [tempShippingDateLate, setTempShippingDateLate] = useState(shippingDateLate.slice(0,10));
        const [tempPreorderDeadline, setTempPreorderDeadline] = useState(moqDeadline?.slice(0,10));
        const [tempTrackingNumber, setTempTrackingNumber] = useState(trackingNumber);
        const [tempPreorder, setTempPreorder] = useState(preorder);

        async function submitEditStatus(event) {
            
            event.preventDefault()

            if(waiting){
                return
            }
            const result = await editOrderStatus(orderId, tempOrderStatus, tempShippingStatus, tempTrackingNumber, tempPreorder, tempShippingDateEarly, tempShippingDateLate, tempPreorderDeadline, auth.accessToken, auth.userId)
    
            if(result){
                waiting = false;
                setStatusModal(false);
                setChangedData(!changedData);
            }
        }
      
        return (
          <React.Fragment>
            <Modal
              open={statusModal}
              onClose={closeModalStatus}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyle, width: 350 }}>
    
              <div className='flex flex-col justify-center'>
                    <p>OrderId:{orderId}</p>
                    <p>Product Name:{productname}</p>
                    <p>Recipient Name:{name}</p>

                    <img className='w-20' src={imageURL}/>

                    <div className='pt-2'>
                    <p>Order Status</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Order Status'
                        value={tempOrderStatus}
                        onChange={event=>setTempOrderStatus(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Shipping Status</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Shipping Status'
                        value={tempShippingStatus}
                        onChange={event=>setTempShippingStatus(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Shipping Date Early</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                    type="date"
                        placeholder='Shipping Date Early'
                        value={tempShippingDateEarly}
                        onChange={event=>setTempShippingDateEarly(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Shipping Date Late</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        type="date"
                        placeholder='Shipping Date Late'
                        value={tempShippingDateLate}
                        onChange={event=>setTempShippingDateLate(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Preorder Deadline</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        type="date"
                        placeholder='Preorder Deadline'
                        value={tempPreorderDeadline}
                        onChange={event=>setTempPreorderDeadline(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Tracking Number</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Tracking Number'
                        value={tempTrackingNumber}
                        onChange={event=>setTempTrackingNumber(event.target.value)}
                    />
                    </div>

                    <div className='pt-2'>
                    <p>Preorder</p>
                    <input 
                    className='border border-[#8BEDF3]' 
                        placeholder='Preorder'
                        value={tempPreorder}
                        onChange={event=>setTempPreorder(event.target.value)}
                    />
                    </div>

                    <div className='pt-6'>
                        <button
                            className='bg-gray-200 rounded-2xl px-4 py-2 hover:bg-[#8BEDF3] hover:text-white'
                            onClick={(event)=>submitEditStatus(event)}>
                            Submit Edit Status
                        </button>
                    </div>

                </div>
               
              </Box>
            </Modal>
          </React.Fragment>
        );
    }

    function OrderCreditsModal({profileUserId, orderId, name, productname, creditReq, creditedAlready, imageURL}) {

        const [tempCreditsRequested, setTempCreditsRequested] = useState(creditReq ? true : false);
        const [approveCredit, setApproveCredit] = useState(creditedAlready ? true : false);

        async function submitEditCredit(event) {
            
            event.preventDefault()

            if(waiting){
                return
            }

            const result = await editOrderCredit(profileUserId, orderId, tempCreditsRequested, approveCredit, auth.accessToken, auth.userId)
    
            if(result){
                console.log(result)
                waiting = false;
                setCreditModal(false);
                setChangedData(!changedData);
            }
        }
      
        return (
          <React.Fragment>
            <Modal
              open={creditModal}
              onClose={closeModalCredits}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyle, width: 350 }}>
    
              <div className='flex flex-col justify-center'>
                    <p>OrderId:{orderId}</p>
                    <p>Product Name:{productname}</p>
                    <p>Recipient Name:{name}</p>
                    <p>Profile UserId:{profileUserId}</p>

                    <img className='w-20' src={imageURL}/>

                    <div className='pt-2'>
                    <p>Credit Requested?</p>
                    <FormControlLabel
                        value="Credit Requested?"
                        control={
                          <Checkbox checked={tempCreditsRequested}
                                onChange={()=>setTempCreditsRequested(!tempCreditsRequested)}
                                style ={{
                                  color: "#8BEDF3",
                                  transform: "scale(1.5)",
                              }}
                            />
                        }
                      />
                    </div>

                    <div className='pt-2'>
                    <p>Approve Credit Request?</p>
                    <FormControlLabel
                        value="Credit Approved?"
                        control={
                          <Checkbox checked={approveCredit}
                                onChange={()=>setApproveCredit(!approveCredit)}
                                style ={{
                                  color: "#8BEDF3",
                                  transform: "scale(1.5)",
                              }}
                            />
                        }
                      />
                    </div>

                    <div className='pt-6'>
                        <button
                            className='bg-gray-200 rounded-2xl px-4 py-2 hover:bg-[#8BEDF3] hover:text-white'
                            onClick={(event)=>submitEditCredit(event)}>
                            Submit Edit Credit
                        </button>
                    </div>

                </div>
               
              </Box>
            </Modal>
          </React.Fragment>
        );
    }

    function OrderRefundModal({profileUserId, orderId, name, productname, refundReq, refundedAlready, imageURL}) {

        const [tempRefundRequested, setTempRefundRequested] = useState(refundReq ? true : false);
        const [approveRefund, setApproveRefund] = useState(refundedAlready ? true : false);

        async function submitEditRefund(event) {
            
            event.preventDefault()

            if(waiting){
                return
            }
            const result = await editOrderRefund(orderId, tempRefundRequested, approveRefund, auth.accessToken, auth.userId)
    
            if(result){
                waiting = false;
                setRefundModal(false);
                setChangedData(!changedData);
            }
        }
      
        return (
          <React.Fragment>
            <Modal
              open={refundModal}
              onClose={closeModalRefund}
              onClick={(event)=>{event.stopPropagation()}}
              aria-labelledby="child-modal-title"
              aria-describedby="child-modal-description"
            >
              <Box sx={{ ...boxStyle, width: 350 }}>
    
              <div className='flex flex-col justify-center'>
                    <p>OrderId:{orderId}</p>
                    <p>Product Name:{productname}</p>
                    <p>Recipient Name:{name}</p>
                    <p>Profile UserId:{profileUserId}</p>

                    <img className='w-20' src={imageURL}/>

                    <div className='pt-2'>
                    <p>Refund Requested?</p>
                    <FormControlLabel
                        value="Refund Requested?"
                        control={
                          <Checkbox checked={tempRefundRequested}
                                onChange={()=>setTempRefundRequested(!tempRefundRequested)}
                                style ={{
                                  color: "#8BEDF3",
                                  transform: "scale(1.5)",
                              }}
                            />
                        }
                      />
                    </div>

                    <div className='pt-2'>
                    <p>Approve Refund Request?</p>
                    <FormControlLabel
                        value="Refund Approved?"
                        control={
                          <Checkbox checked={approveRefund}
                                onChange={()=>setApproveRefund(!approveRefund)}
                                style ={{
                                  color: "#8BEDF3",
                                  transform: "scale(1.5)",
                              }}
                            />
                        }
                      />
                    </div>

                    <div className='pt-6'>
                        <button
                            className='bg-gray-200 rounded-2xl px-4 py-2 hover:bg-[#8BEDF3] hover:text-white'
                            onClick={(event)=>submitEditRefund(event)}>
                            Submit Edit Refund
                        </button>
                    </div>

                </div>
               
              </Box>
            </Modal>
          </React.Fragment>
        );
    }


    async function getOrderData(){

        const orderData = await getAllOrders(dateStart, dateEnd, creditRequestedFilter, refundRequestedFilter, orderStatusFilter, moqPreorderFilter, auth.accessToken, auth.userId)

        if(orderData){

            var postsHash = {}

            if(orderData.data.foundPosts?.length > 0){

                for(let i=0; i<orderData.data.foundPosts?.length; i++){
                    if(postsHash[orderData.data.foundPosts[i]._id] === undefined){
                        postsHash[orderData.data.foundPosts[i]._id] = orderData.data.foundPosts[i]
                    }
                }
            }

            if(orderData.data.foundOrders?.length > 0){
                for(let i=0; i<orderData.data.foundOrders?.length;i++){
                    orderData.data.foundOrders[i].previewMediaURL = postsHash[orderData.data.foundOrders[i]._postId].previewMediaURL
                }   
            }

            setOrders(orderData.data.foundOrders)
        }
    }

    useEffect( ()=> {

        if(orders?.length > 0){
            getOrderData()
        }

    }, [changedData])
    


    return(
        <>
        <div>
            <div className="flex w-full gap-x-4 justify-center pt-4 overflow-auto">

                <div className="flex flex-col">
                
                <label className="flex justify-start 
                    text-[#8BEDF3] font-bold">Date Start (Required):</label>
                    <input 
                        aria-label="dateStart" 
                        type="date" 
                        id="dateStart"
                        placeholder="Start Date"
                        className={`text-sm text-gray-base w-full mr-3 py-5 px-4 h-10
                        border border-gray-primary rounded focus:outline-[#8BEDF3]
                        ${(!dateStart) ? 'text-gray-400' : 'text-black'}
                        `}
                        onChange={ ( e ) => setDateStart(e.target.value)}
                        value={dateStart}
                    />
                </div>

                <div className="flex flex-col">
                
                <label className="flex justify-start 
                    text-[#8BEDF3] font-bold">Date End (Required):</label>
                
                <input 
                    aria-label="dateEnd" 
                    type="date" 
                    id="dateEnd"
                    placeholder="End Date"
                    className={`text-sm text-gray-base w-full mr-3 py-5 px-4 h-10
                        border border-gray-primary rounded focus:outline-[#8BEDF3]
                        ${(!dateEnd) ? 'text-gray-400' : 'text-black'}
                        `}
                    onChange={ ( e ) => setDateEnd(e.target.value)}
                    value={dateEnd}
                />

                </div>

                <div className='flex flex-col'>
                    <label className="flex justify-start text-base font-bold text-[#8BEDF3]">Credits Requested Filter:</label>    
                    <select 
                        onChange={(event) => setCreditRequestedFilter(event.target.value)}
                        value={creditRequestedFilter}
                        className={`text-sm w-full mr-4 h-10 text-black
                        border border-gray-primary rounded mb-2 focus:outline-[#8BEDF3] pl-3
                        `}
                    >
                        <option key={`0Credits`} value={"All"}>{'All'}</option>
                        <option key={`1Credits`} value={"Yes"}>{'Yes'}</option>
                        <option key={`2Credits`} value={"No"}>{'No'}</option>
                    </select> 
                </div>

                <div className='flex flex-col'>
                    <label className="flex justify-start text-base font-bold text-[#8BEDF3]">Refund Requested Filter:</label>    
                    <select 
                        onChange={(event) => setRefundRequestedFilter(event.target.value)}
                        value={refundRequestedFilter}
                        className={`text-sm w-full mr-4 h-10 text-black
                        border border-gray-primary rounded mb-2 focus:outline-[#8BEDF3] pl-3
                        `}
                    >
                        <option key={`0Refund`} value={"All"}>{'All'}</option>
                        <option key={`1Refund`} value={"Yes"}>{'Yes'}</option>
                        <option key={`2Refund`} value={"No"}>{'No'}</option>
                    </select> 
                </div>

                <div className='flex flex-col'>
                    <label className="flex justify-start text-base font-bold text-[#8BEDF3]">Order Status Filter:</label>    
                    <select 
                        onChange={(event) => setOrderStatusFilter(event.target.value)}
                        value={orderStatusFilter}
                        className={`text-sm w-full mr-4 h-10 text-black
                        border border-gray-primary rounded mb-2 focus:outline-[#8BEDF3] pl-3
                        `}
                    >
                        <option key={`0orderstatus`} value={'All'}>{'All'}</option>
                        <option key={`1orderstatus`} value={'Unfulfilled'}>{'1) Unfulfilled'}</option>
                        <option key={`2orderstatus`} value={'Forwarded'}>{'2) Forwarded'}</option>
                        <option key={`3orderstatus`} value={'Shipping'}>{'3) Shipping'}</option>
                        <option key={`4orderstatus`} value={'Delivered'}>{'4) Delivered'}</option>
                        <option key={`5orderstatus`} value={'Delivered'}>{'4) Cancelled'}</option>
                        <option key={`6orderstatus`} value={'Delivered'}>{'4) Credited'}</option>
                        <option key={`7orderstatus`} value={'Delivered'}>{'4) Refunded'}</option>

                    </select> 
                </div>

                <div className='flex flex-col'>
                    <label className="flex justify-start text-base font-bold text-[#8BEDF3]">MOQ Preorders Reached Filter:</label>    
                    <select 
                        onChange={(event) => setMoqPreorderFilter(event.target.value)}
                        value={moqPreorderFilter}
                        className={`text-sm w-full mr-4 h-10 text-black
                        border border-gray-primary rounded mb-2 focus:outline-[#8BEDF3] pl-3
                        `}
                    >
                        <option key={`0orderstatus`} value={'All'}>{'All'}</option>
                        <option key={`1orderstatus`} value={'Reached'}>{'Reached'}</option>

                    </select> 
                </div>

                <button className='rounded-2xl bg-gray-200 px-4 py-1 hover:bg-[#8BEDF3] hover:text-white' onClick={(event)=>{getOrderData(event)}}>
                    Get Orders
                </button>
                </div>
        </div>

        <div className='container w-[3000px]'>
            <p className='text-2xl py-6 pl-4'>All Orders Data</p>

            <div className='grid grid-cols-12 py-4 w-[3000px] px-6 sticky top-0 opacity-100 bg-white'>

                <div className='col-span-1'> <span className='w-10'/>{"Order Id / Product Name"}</div>
                <div className='col-span-1'>Picture Here</div>
                <div className='col-span-1'><p>{"PaymentIntentId"} / {"Order Date"}</p></div>
                <div className='col-span-1'> <p className='w-30'>{"email"}</p></div>
                <div className='col-span-1'> <span className='w-10'/>{"postId / supplier"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"Shipping Cost / paidSubtotalPrice / paidCurrency"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"paidTotalPrice"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"address_line1"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"address_line2"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"address_region / zipCode"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"address_country"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"phoneNumber"}</div>
            
            </div>

            {orders?.length > 0 ?

                orders.map( (order) => (

                    <div className='grid grid-cols-12 py-4 w-[3000px] overflow-auto px-6' key={`${order._id}_data`}>

                        <div className='col-span-1'><p className='text-sm break-all'>{order._id}</p> <p> {order.productname}</p><p>{order.username}</p></div>
                        <div className='col-span-1'><img className='h-20' src={order.previewMediaURL}/></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.PaymentIntentId}</p><p>{format(new Date(order.createdAt), "ccc',' LLLL d',' yyyy")}</p><p>{formatDistanceToNowStrict(new Date(order.createdAt), {addSuffix: true})}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.email}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order._postId}</p><p> {order.supplier}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.paidShipping} / {order.paidSubtotalPrice} / {order.paidCurrency}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.paidTotalPrice}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.address_line1}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.address_line2}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.address_region} / {order.zipCode}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.address_country}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.phoneNumber}</p></div>
                        
                    </div>

                ))

                :

                null
            }

            <p className='text-2xl py-6 pl-4'>All Orders + Buttons</p>

            <div className='grid grid-cols-12 py-4 w-[3000px] px-6 sticky top-0 opacity-100 bg-white'>

                <div className='col-span-1'> <span className='w-10'/>{"Order Id / Productname"}</div>
                <div className='col-span-1'>Picture Here</div>
                <div className='col-span-1'><p>{"MOQ / preorders / preorderDeadline"}</p></div>
                <div className='col-span-1'> <p className='w-30'>{"trackingNumber"}</p></div>
                <div className='col-span-1'> <span className='w-10'/>{"Shipping Status / Shipping Offered / Shipping Early / Shipping Late"}</div>
                <div className='col-span-1 text-center'> <span className='w-10'/>{"orderStatus"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"credits/refund Requested"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"shippingCost_amountTotal / paidSubtotalPrice / paidCurrency"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"Edit Contact"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"Edit Order Status"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"Return Credits"}</div>
                <div className='col-span-1'> <span className='w-10'/>{"Return Refund"}</div>
            
            </div>

            {orders?.length > 0 ?

                orders.map( (order) => (

                    <div className='grid grid-cols-12 py-4 w-[3000px] overflow-auto px-6' key={`${order._id}_button`}>

                        <div className='col-span-1'><p className='text-sm break-all'>{order._id}</p> <p>{order.productname}</p><p>{order.username}</p></div>
                        <div className='col-span-1'><img className='h-20' src={order.previewMediaURL}/></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.preorderSwitch === 0 ? ' Not a Preorder ' : ' Yes Preorder '}{order.minimumOrderQuantity} / {order.preordersCount}</p><p>{order.preorderSwitch === 1 && format(new Date(order.preorderDeadline), "ccc',' LLLL d',' yyyy")}</p><p>{order.preorderSwitch === 1 && formatDistanceToNowStrict(new Date(order.preorderDeadline), {addSuffix: true})}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.trackingNumber}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.shippingStatus} / {order.shippingSwitch === 1 ? "Shipping" : "No Shipping" } </p> <p>{formatDistanceToNowStrict(new Date(order.shippingDateEarly), {addSuffix: true})} ({format(new Date(order.shippingDateEarly), "ccc',' LLLL d',' yyyy")})</p><p>{formatDistanceToNowStrict(new Date(order.shippingDateLate), {addSuffix: true})} ({format(new Date(order.shippingDateLate), "ccc',' LLLL d',' yyyy")})</p></div>
                        <div className='col-span-1'><p className='text-sm break-all text-center'>{order.orderStatus}</p><p className='text-center'>{order.orderStatus === 1 && "To Be Shipped"}{order.orderStatus === 2 && "In Transit"}{order.orderStatus === 3 && "Out For Delivery"}{order.orderStatus === 4 && "Delivered"}{order.orderStatus === 5 && "Cancelled"}{order.orderStatus === 6 && "Credited"}{order.orderStatus === 7 && "Refunded"}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.creditsRequested ? 1 : 0} / {order.refundRequested ? 1 : 0}</p></div>
                        <div className='col-span-1'><p className='text-sm break-all'>{order.paidShipping} / {order.paidSubtotalPrice} / {order.paidTotalPrice} / {order.paidCurrency}</p></div>
                        
                        <div className='col-span-1'>
                            <button  
                                onClick={(event)=>{openModalContact(event, order._id, order.productname, order.recipient, order.address_line1, order.address_region, 
                                    order.address_country, order.phoneNumber, order.zipCode, order.previewMediaURL)}}
                                className='bg-gray-200 hover:bg-[#8BEDF3] hover:text-white rounded-2xl px-2 py-1'><p className='text-sm break-all'>Edit Contact</p>
                            </button></div>
                        
                        
                        <div className='col-span-1'>
                            <button 
                            onClick={(event)=>{openModalStatus(event, order._id, order.productname, order.recipient, order.orderStatus, order.shippingStatus, 
                                order.trackingNumber, order.preorderSwitch, order.shippingDateEarly, order.shippingDateLate, order.preorderDeadline, order.previewMediaURL)}}
                                className='bg-gray-200 hover:bg-[#8BEDF3] hover:text-white rounded-2xl px-2 py-1'><p className='text-sm break-all'>Edit Status</p>
                            </button></div>
                        
                        
                        <div className='col-span-1'>
                            <button
                             onClick={(event)=>{openModalCredits(event, order._id, order.productname, order.recipient, order._userId, order.creditsRequested, 
                                order.creditsCompleted, order.previewMediaURL)}}
                            className='bg-gray-200 hover:bg-[#8BEDF3] hover:text-white rounded-2xl px-2 py-1'>
                                <p className='text-sm break-all'>
                                Return Credits</p>
                            </button>
                            <p>ProfileUserId:</p>
                            <p>{order._userId}</p>
                            <p>Credits Returned:</p>
                            <p>{order.creditsCompleted ? "Yes" : "No"}</p>
                        </div>
                        
                        
                        <div className='col-span-1'>
                            <button 
                            onClick={(event)=>{openModalRefund(event, order._id, order.productname, order.recipient, order._userId, order.refundRequested, 
                                order.refundCompleted, order.previewMediaURL)}}
                                className='bg-gray-200 hover:bg-[#8BEDF3] hover:text-white rounded-2xl px-2 py-1'><p className='text-sm break-all'>Return Refund</p>
                                </button>
                            <p>Refunded:</p>
                            <p>{order.refundCompleted ? "Yes" : "No"}</p>
                        </div>
                    </div>

                ))

                :

                null
            }

            
        </div>

        <OrderContactModal orderId={orderId} name={name} address={address} productname={productname}
            region={region} country={country} phoneNumber={phoneNumber} zipCode={zipCode} imageURL={imageURL} />
        
        <OrderStatusModal orderId={orderId} name={name}  productname={productname}
            orderStatus={orderStatus} shippingStatus={shippingStatus} shippingDateEarly={shippingDateEarly} shippingDateLate={shippingDateLate}
            moqDeadline={moqDeadline} trackingNumber={trackingNumber} preorder={preorder} imageURL={imageURL}/>
        
        <OrderCreditsModal orderId={orderId} name={name}  productname={productname}
            profileUserId={profileUserId} creditReq={creditReq} creditedAlready={creditedAlready} imageURL={imageURL}/>
        
        <OrderRefundModal orderId={orderId} name={name}  productname={productname}
            profileUserId={profileUserId} refundReq={refundReq} refundedAlready={refundedAlready} imageURL={imageURL}/>

        </>
    )
}

export default AdminOrders
