import React, { useState, useEffect, useRef, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';

const AdminOrderLine = (order) => {

    useEffect( ()=> {

        console.log(order.order)
        console.log(order.order.PaymentIntentId)
        console.log(order.order.StripeSessionId)

    }, [order])

    const { auth } = useAuth();
    
    return (
        
        <div className='grid col-span-8'>
            <div className='col-span-1'> <img className='w-10' src={order.order.previewMediaURL}/></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
            <div className='col-span-1'><p className='text-xs'>{order.order._id}</p></div>
        </div>
        
    )
}

export default AdminOrderLine
