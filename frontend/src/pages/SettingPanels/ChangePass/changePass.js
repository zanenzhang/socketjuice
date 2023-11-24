import React from "react";
import useAuth from "../../../hooks/useAuth";
import Box from "@material-ui/core/Box";
import { useRef, useState, useEffect } from "react";
import axios from '../../../api/axios';
import useLogout from "../../../hooks/useLogout";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function ChangePass({loggedUserId}) {
  
  const passRef = useRef();
  const CHANGE_PASS = '/profile/userpass';

  const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,48}$/;

    const {auth} = useAuth();
    const logout = useLogout();
    const [oldPwd, setOldPwd] = useState('');
    const [validOldPwd, setValidOldPwd] = useState(false);
    const [oldPwdFocus, setOldPwdFocus] = useState(false);

    const [newPwd, setNewPwd] = useState('');
    const [validNewPwd, setValidNewPwd] = useState(false);
    const [newPwdFocus, setNewPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isInvalid = oldPwd === '' || newPwd ==='' || matchPwd ==='' ;

    useEffect(() => {
        setValidOldPwd(PWD_REGEX.test(oldPwd))
    })

    useEffect(() => {
        setValidNewPwd(PWD_REGEX.test(newPwd));
        setValidMatch(newPwd === matchPwd && newPwd !== '');
    }, [newPwd, matchPwd])

    useEffect(() => {
        setErrMsg('');
        setSuccess('');
    }, [oldPwd, newPwd, matchPwd])

    useEffect(() => {
        const ele = passRef.current
        ele.focus();
    }, [])

    const handleSubmit = async (e) => {

        e.preventDefault();
        if(isLoading){
            return
        }

        setIsLoading(true);

        // if button enabled with JS hack
        const v1 = PWD_REGEX.test(oldPwd);
        const v2 = PWD_REGEX.test(newPwd);
        if ( !v1 || !v2 ) {
            setErrMsg("Password is invalid!");
            return;
        }

        try {
            const response = await axios.patch(CHANGE_PASS,
                JSON.stringify({ loggedUserId: auth.userId, oldPwd, newPwd }),
                {
                    headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
                    'Content-Type': 'application/json'},
                    withCredentials: true
                }
            );

            if (response?.status === 200){

                setOldPwd("")
                setNewPwd("")
                setMatchPwd("")

                setIsLoading(false);
                setSuccess(true);
                
                toast.success("Reset successful!", {
                    position: "bottom-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                    });
            
            } else if (response?.status === 403){

                logout();
            }
            
            
        } catch (err) {

            console.log(err)
            
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status === 400) {
                setErrMsg('Reset not successful, please try again!');
            } else if (err.response?.status === 401) {
                setErrMsg('Unauthorized');
            } else {
                setErrMsg('Password reset failed!');
            }
            setIsLoading(false);
        }
    }
  
  return (
    <>
    <Box
        style={{display: "flex",
        height: "100%",
        width: "100%"}}>

        <div className='flex flex-col content-center items-center w-full h-full'>

            <form onSubmit={handleSubmit}>

                <div className="flex flex-col w-full px-4 md:px-0 md:w-[45vh]">
                    <div className="pt-2">
                        <label className='text-lg font-medium'>Enter Old Password:</label>
                    </div>
                    <div className="flex flex-row">
                        <input 
                            aria-label="Enter your old password" 
                            type="password" 
                            id="oldpassword"
                            ref={passRef}
                            placeholder="Old password"
                            className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                                border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                            onChange={ ( e ) => setOldPwd(e.target.value)}
                            value={oldPwd}
                            aria-invalid={validOldPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setOldPwdFocus(true)}
                            onBlur={() => setOldPwdFocus(false)}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col w-full px-4 md:px-0 md:w-[45vh]">
                    
                    <div className="pt-4">
                        <label className='text-lg font-medium'>Enter New Password:</label>
                    </div>
                    <div className="flex flex-row">
                        <input 
                            aria-label="Enter your new password" 
                            type="password" 
                            id="newpassword"
                            placeholder="New password"
                            className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                                border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                            onChange={ ( e ) => setNewPwd(e.target.value)}
                            value={newPwd}
                            aria-invalid={validNewPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setNewPwdFocus(true)}
                            onBlur={() => setNewPwdFocus(false)}
                            required
                        />
                    </div>
                </div>

                <div className='flex flex-row w-full px-4 md:px-0 md:w-[45vh] ml-2 gap-x-2 mt-2 mb-4'>
                    
                    {validNewPwd ? 
                        (
                            <>
                            <div className='flex flex-col justify-center'>
                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            </div>
                            <div className='flex flex-col justify-center'>
                                <span className="text-green-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                            </div>
                            </>
                        )
                        : 
                        ( 
                            <>
                            <div className='flex flex-col justify-center'>
                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" 
                                className="w-6 h-6" >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            </div>
                            <div className='flex flex-col justify-center'>
                                <span className="text-red-600">Please include at least 8 characters, lower and uppercase letters, a number and a special character</span>
                            </div>
                            </>
                        )
                    }
                </div>

                <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh]'>

                    <div className="pt-4">
                        <label className='text-lg font-medium'>Confirm Password:</label>
                    </div>
                    <div className="flex flex-row">
                        <input 
                            aria-label="Confirm new password" 
                            type="password" 
                            id="confirmnewpwd"
                            placeholder="Confirm new password"
                            className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                                border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                            onChange={ ( e ) => setMatchPwd(e.target.value)}
                            value={matchPwd}
                            aria-invalid={validMatch ? "false" : "true"}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                            required
                        />
                    </div>
                </div>


                <div className='flex flex-row w-full px-4 md:px-0 md:w-[45vh] ml-2 gap-x-2 mt-2 mb-4'>
                        
                {validMatch ? 
                    (
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-green-600">Please re-enter your password</span>
                        </div>
                        </>
                    )
                    : 
                    ( 
                        <>
                        <div className='flex flex-col justify-center'>
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#e53e3e" className="w-6 h-6" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div className='flex flex-col justify-center'>
                            <span className="text-red-600">Please re-enter your password</span>
                        </div>
                        </>
                    )
                }
            </div>

            {(success || errMsg) && <div className='w-full'>
                {success && <p className="text-base text-red-primary w-full self-center justify-self-center mb-2 text-center text-green-600">Password successfully reset!</p>}
                {errMsg && <p className='font-medium text-base text-center text-red-500 mt-8'>{errMsg}</p>}
            </div>}

                <div className="py-4 flex justify-center">

                <button 
                    disabled={!validOldPwd || !validNewPwd || !validMatch || isLoading || success ? true : false}
                    type="submit"
                    className={`align-center mb-4 px-4 py-4 text-[#8BEDF3] 
                    border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
                    hover:bg-[#8BEDF3] hover:text-white flex justify-center items-center gap-x-3
                    ${(!validOldPwd || !validNewPwd || !validMatch || isInvalid || isLoading || success) && 'opacity-50 cursor-not-allowed' }`}>
                        
                        {isLoading && 
                        <div aria-label="Loading..." role="status">
                            <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                            <path
                                className="fill-gray-200"
                                d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                            <path
                                className="fill-[#00D3E0]"
                                d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                            </svg>
                        </div>}
                        
                    Reset Password
                </button>
                </div>
            </form>
        </div>
    </Box>

    <ToastContainer
    toastStyle={{ backgroundColor: "#8BEDF3" }}
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
  );
}

