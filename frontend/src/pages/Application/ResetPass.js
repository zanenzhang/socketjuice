import { useRef, useState, useEffect } from "react";
import axios from '../../api/axios';
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import socketjuice_full_logo from "../../images/SocketJuice.png";

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const RESET_PASSWORD_URL = process.env.RESET_PASSWORD_URL;
const RESEND_VERIFICATION_URL = process.env.RESEND_VERIFICATION_URL;


const ResetPass = () => {

    const captchaRef = useRef(null)
    const emailRef = useRef();

    const [resendActivate, setResendActivate] = useState(false)
    const [geoData, setGeoData] = useState({"data": ""});
    const [recapToken, setRecapToken] = useState(false);
    const [waiting, setWaiting] = useState(false);

    const [windowSize, setWindowSize] = useState({
        x: window.innerWidth,
        y: window.innerHeight
    });

    const [emailFocus, setEmailFocus] = useState(false);
    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setValidEmail(EMAIL_REGEX.test(email));
    }, [email])

    const handleRecaptcha = () =>{
        const recaptchaToken = captchaRef.current.getValue();
        if(recaptchaToken){
            setRecapToken(recaptchaToken)
        }
    }

    const isInvalid = email === '';

    var resendCount = 0;

    const handleResend = async (event) => {
        event.preventDefault();
        setWaiting(true);

        resendCount += 1

        try {
            const response = await axios.post(RESEND_VERIFICATION_URL,
                JSON.stringify({ email:email.toLowerCase(), geoData }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            
            if(response){
                setResendActivate(false);
                waiting = false;;
                alert("Resent activation email, please check your inbox!")
            }
            
        } catch (err) {
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else {
                setErrMsg('Resend Failed')
            }
        }
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const v1 = EMAIL_REGEX.test(email);

        if (!v1 ) {
            setErrMsg("Invalid Entry");
            return;
        }

        if(waiting){
            return
        }
        setWaiting(true);

        try {
            const response = await axios.post(RESET_PASSWORD_URL,
                JSON.stringify({ email:email.toLowerCase(), recapToken, geoData }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            
            if(response){
                alert("Password reset link has been sent, please check your inbox!")
                setSuccess(true);
                setWaiting(false);
            } else {
                alert("Operation not successful, please try again")
                setSuccess(false);
                setWaiting(false);
            }
            

        } catch (err) {
            setSuccess(false);
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status == 400) {
                setErrMsg('Please create an account!');
                setWaiting(false);
            } else if (err.response?.status == 401) {
                setErrMsg('Please activate your account!');
                setResendActivate(true);
                setWaiting(false);
            } else {
                setErrMsg('Operation failed')
            }
        }
    }

    return (

        <>

            <div className='flex flex-col items-center justify-center p-2 h-full'>

                <div className='w-full max-w-[700px] px-6 sm:px-8 md:px-10 py-10
                    rounded-xl md:rounded-none shadow-inner md:shadow-none'>

                    <div className='flex items-center justify-center px-10 pb-6'>
                        <img className='w-100' src={socketjuice_full_logo} />
                    </div>
                        
                    <div className='flex flex-col'>
                        <label className='text-base md:text-lg font-medium'>Email</label>
                        <input 
                            className='w-full border-2 border-[#00D3E0]/10 
                                rounded-xl p-4 mt-1 bg-white hover:scale-[1.01] ease-in-out'
                            placeholder="Enter your email"
                            aria-label="Enter your email address" 
                            type="text" 
                            ref={emailRef}
                            onChange={ ( {target} ) => setEmail(target.value)}
                            value={email}
                            required
                        />
                    </div>
                    

                    {errMsg && <p className='font-medium text-base md:text-lg text-center text-red-500 mt-8'>{errMsg}</p>}
                    { (resendActivate && resendCount <= 2) ?
                        (<div className='mt-2 flex flex-col gap-y-4'>
                        <button 
                            className='flex items-center justify-center gap-2 active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  ease-in-out transform py-4  rounded-xl
                                font-semibold text-base md:text-lg border-2 border-gray-100 text-blue-500'
                            onClick={(event)=>handleResend(event)} disabled={waiting}>
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>

                            Resend confirmation email</button>
                        </div>) : null
                    }

                    <div className='mt-8 flex flex-col gap-y-4'>
                        
                        <button className={`active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  
                            ease-in-out transform py-4 bg-[#00D3E0] rounded-xl text-white font-bold text-base md:text-lg
                            flex flex-row gap-x-2 justify-center items-center
                            ${(isInvalid || !validEmail ||!recapToken || success || waiting) && ' opacity-50' }`}
                            disabled={isInvalid || !validEmail || success || waiting || !recapToken}
                            onClick={handleSubmit}
                        >
                            {waiting && 
                            <div aria-label="Loading..." role="status">
                                <svg className="h-4 w-4 animate-spin" viewBox="3 3 18 18">
                                <path
                                    className="fill-gray-200"
                                    d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                                <path
                                    className="fill-[#00D3E0]"
                                    d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                                </svg>
                            </div>
                            }

                            Get Link To Reset Password
                        </button>

                        <div className={`${!validEmail ? 'hidden' : 'flex justify-center' }`}>
                            <ReCAPTCHA
                                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY} 
                                ref={captchaRef}
                                onChange={handleRecaptcha}
                            />
                        </div>
                        
                        <Link className="flex flex-col" to="/map" >
                        <button 
                            className='flex items-center justify-center gap-2 active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  ease-in-out transform py-4  rounded-xl text-gray-700 font-semibold text-base md:text-lg 
                                border-2 border-[#00D3E0]/10 bg-white '>

                                <div className='flex items-center justify-center gap-2'>        
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>

                                <p className='text-[#00D3E0]'>Back To Login</p>
                                </div>        
                        </button>
                        </Link>
                        

                    </div>
                    
                </div>
            </div>

            <div className="h-[100px] flex flex-grow">

            </div>
            
            <div className='w-full flex flex-col pt-16 justify-center pb-4 gap-y-2'>
                {/* <div className='flex flex-row justify-center gap-x-6'>
                    <Link to={"/map"} className='flex flex-col text-[#00D3E0] 
                        text-[12px] sm:text-sm md:text-base underline'> Home </Link>
                    <Link to={"/terms"} className='flex flex-col text-[#00D3E0] 
                        text-[12px] sm:text-sm md:text-base underline'> Terms of Service </Link>
                    <Link to={"/privacy"} className='flex flex-col text-[#00D3E0] 
                        text-[12px] sm:text-sm md:text-base underline'> Privacy Policy </Link>
                </div> */}
                <div className='flex justify-center flex-row'>
                    <p className='text-xs text-gray-500'>Copyright © 2023 SocketJuice</p>
                </div>
            </div>

        </>
        
    )
}

export default ResetPass
