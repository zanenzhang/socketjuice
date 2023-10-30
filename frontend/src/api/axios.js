import axios from 'axios';

export default axios.create({
    baseURL: process.env.REACT_APP_API,
});

export const axiosPrivate = axios.create({
    baseURL: process.env.REACT_APP_API,
    headers: { 'Content-Type': 'application/json' }, 
    withCredentials: true
});