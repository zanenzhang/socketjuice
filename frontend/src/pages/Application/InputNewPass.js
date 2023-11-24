import { useRef, useState, useEffect } from "react";
import axios from "../../api/axios";
import { useLocation } from 'react-router';
import socketjuice_full_logo from "../../images/SocketJuice.png";
import { useNavigate } from 'react-router-dom';


const InputNewPassword = () => {

    const PWD_REGEX = /^(?=(.*[0-9]))(?=.*[!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,48}$/;

    const navigate = useNavigate();
    
    const search = useLocation().search;
    const pwdRef = useRef();
    const captchaRef = useRef(null)
    const userId = new URLSearchParams(search).get("userId");
    const hash = new URLSearchParams(search).get("hash");

    const INPUT_NEW_PASS = 'http://localhost:5500/api/inputnewpassword';

    const [geoData, setGeoData] = useState(false);
    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [waiting, setWaiting] = useState(false);

    const [windowSize, setWindowSize] = useState({
        x: window.innerWidth,
        y: window.innerHeight
    });

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    
    useEffect(() => {
        setValidPwd(PWD_REGEX.test(pwd));
        setValidMatch((pwd === matchPwd) && (matchPwd != ''));
    }, [pwd, matchPwd])

    useEffect(() => {
        setErrMsg('');
    }, [pwd, matchPwd])


    const isInvalid = pwd === '' || matchPwd ==='' ;

    const handleSubmit = async (e) => {

        e.preventDefault();
        // if button enabled with JS hack
        const v1 = PWD_REGEX.test(pwd);
        if ( !v1 ) {
            setErrMsg("Password is invalid!");
            return;
        }

        if(waiting){
            return
        }

        setWaiting(true);

        try {
            const response = await axios.post(INPUT_NEW_PASS,
                JSON.stringify({ userId, hash, pwd }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if(response && response.status === 200){
                setSuccess(true);
                alert("Successful! Password has been reset!")
                setPwd("")
                setMatchPwd("")
                setWaiting(false);
                navigate("/map")
            
            } else {
                setSuccess(false);
                setErrMsg("Something went wrong, please try again!")
                setWaiting(false);
            }

        } catch (err) {

            console.log(err)
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status === 400) {
                setSuccess(false);
                setErrMsg('Your reset password link has expired! Please get a new link!');
            } else if (err.response?.status === 401) {
                setErrMsg('Unauthorized');
                setSuccess(false);
            } else {
                setErrMsg('Password reset failed!');
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
                        <label className='text-lg font-medium'>New Password</label>
                        <input 
                            className='w-full border-2 border-[#00D3E0]/10 rounded-xl p-4 mt-1 
                                bg-white hover:scale-[1.01] ease-in-out'
                            placeholder="Enter your password"
                            aria-label="Enter your password" 
                            type={"password"}
                            id="password"

                            onChange={ ( e ) => setPwd(e.target.value)}
                            value={pwd}
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                            required
                        />
                    </div>

                    <div className='flex flex-row ml-5 gap-x-2 mt-4'>
                        
                        {validPwd ? 
                            (
                                <>
                                <div className='flex flex-col'>
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                </div>
                                <div className='flex flex-col'>
                                    <span className="text-green-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                                </div>
                                </>
                            )
                            : 
                            ( 
                                <>
                                <div className='flex flex-col'>
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                </div>
                                <div className='flex flex-col'>
                                    <span className="text-red-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                                </div>
                                </>
                            )
                        }
                    </div>

                    <div className='flex flex-col mt-4'>
                        <label className='text-lg font-medium'>Confirm Password</label>
                        <input 
                            className='w-full border-2 border-gray-100 rounded-xl p-4 mt-1 
                                bg-white hover:scale-[1.01] ease-in-out'
                            placeholder="Confirm your password"
                            aria-label="Confirm your password" 
                            type={"password"}
                            id="confirmpwd"

                            onChange={ ( e ) => setMatchPwd(e.target.value)}
                            value={matchPwd}
                            aria-invalid={validMatch ? "false" : "true"}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                            required
                        />
                    </div>

                    <div className='flex flex-row ml-5 gap-x-2 mt-4'>
                        
                        {validMatch ? 
                            (
                                <>
                                <div className='flex flex-col'>
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                </div>
                                <div className='flex flex-col'>
                                    <span className="text-green-600">Please re-enter your password</span>
                                </div>
                                </>
                            )
                            : 
                            ( 
                                <>
                                <div className='flex flex-col'>
                                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                </div>
                                <div className='flex flex-col'>
                                    <span className="text-red-600">Please re-enter your password</span>
                                </div>
                                </>
                            )
                        }
                    </div>

                    {errMsg && <p className='font-medium text-lg text-center text-red-500 mt-8'>{errMsg}</p>}
                    

                    <div className='mt-8 flex flex-col gap-y-4'>
                        
                        <button className={`active:scale-[.98] active:duration-75 transition-all hover:scale-[1.01]  
                            ease-in-out transform py-4 bg-[#00D3E0] rounded-xl text-white font-bold text-lg
                            flex flex-row justify-center items-center gap-x-2
                            ${(isInvalid || !validPwd || !validMatch || success || waiting) && ' opacity-50' }`}
                            disabled={isInvalid || !validPwd || !validMatch || success || waiting}
                            onClick={(e)=>handleSubmit(e)}
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
                            Reset Password
                        </button>

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


export default InputNewPassword;