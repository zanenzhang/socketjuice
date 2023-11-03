import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import axios from '../../api/axios';
import addCodeRequest from '../../helpers/Twilio/addCodeRequest';
import addCodeVerify from '../../helpers/Twilio/addCodeVerify';
import VerificationInput from "react-verification-input";

import CameraId from '../CameraId';
import ProfileCropper from '../SettingPanels/ProfileOptions/profileCropper';
import MuiPhoneNumber from 'material-ui-phone-number';
import MainHeader from '../../components/mainHeader/mainHeader';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from 'react-router';

import useAuth from '../../hooks/useAuth';


function isNumeric(n) {
    return !isNaN(parseInt(n)) && isFinite(n);
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
  }

const VerifyPage = () => {

    const search = useLocation().search;

    const [userId, setUserId] = useState(new URLSearchParams(search).get("id"))
    const [hash, setHash] = useState(new URLSearchParams(search).get("hash"))

    const IMAGE_UPLOAD_URL = '/s3/singleimage';
    const PUBLIC_MEDIA_URL = '/s3/single-profilepic';

    const VIDEO_UPLOAD_URL = '/s3/singlevideo';
    const PHONE_PRIMARY_REGEX = /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/;

    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);
    
    const [submittedPhone, setSubmittedPhone] = useState(false);
    const [submittedPhotos, setSubmittedPhotos] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState(false);
    const [verifiedPhotos, setVerifiedPhotos] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState("");

    const [phonePrimary, setPhonePrimary] = useState("");
    const [phonePrimaryFocus, setPhonePrimaryFocus] = useState(false);
    const [phonePrefix, setPhonePrefix] = useState("");
    const [phoneCountry, setPhoneCountry] = useState("");
    const [phoneCountryCode, setPhoneCountryCode] = useState("");

    const { setAuth, auth, activeTab, setActiveTab  } = useAuth();

    const [image, setImage] = useState("../../images/defaultUserPic.svg");
    const [croppedImage, setCroppedImage] = useState("");

    const [currentStage, setCurrentStage] = useState(1);

    const [codeInput, setCodeInput] = useState("")
    const [sentCode, setSentCode] = useState(false);
    const [resendCode, setResendCode] = useState(false);
    const [doneCode, setDoneCode] = useState(false);
    const [doneProfile, setDoneProfile] = useState(false);

    const [croppedImageURLId, setCroppedImageURLId] = useState([]);
    const [croppedImageId, setCroppedImageId] = useState([]);
    const [coverIndexId, setCoverIndexId] = useState(0);
    const [mediaTypesId, setMediaTypesId] = useState([]);
    const [videoArrayId, setVideoArrayId] = useState([]);
    const [videoURLArrayId, setVideoURLArrayId] = useState([]);
    const [videoThumbnailsId, setVideoThumbnailsId] = useState([]);
    const [oldMediaTrackId, setOldMediaTrackId] = useState([]);

    //Put photo limit, 1 for front and back, more for arrays
    
    const [waitingRequest, setWaitingRequest] = useState(false);
    const [waitingVerify, setWaitingVerify] = useState(false);
    const [waitingPhotos, setWaitingPhotos] = useState(false);

    useEffect( ()=> {

        setActiveTab("verify")
        setCurrentStage(2)

        const userId = new URLSearchParams(search).get("id")

        if(!userId){
            navigate("/map")
        }

    }, [])

    const handleCodeInput = (e) => {

        console.log(e)
        setCodeInput(e)
    }

    const handleResendCode = () => {

        async function resendSMS(){

            if(sentCode && !resendCode){

                setResendCode(true);
    
                const requestedCode = await addCodeRequest(phonePrimary, userId, phoneCountry, hash)

                if(requestedCode){

                    console.log(requestedCode)
                    
                    if(requestedCode.status === 200 && requestedCode?.data?.result === 'pending'){
                        setSentCode(true)
                        setSubmittedPhone(true);
                        toast.info("A verification code has been sent to the number provided", {
                            position: "bottom-center",
                            autoClose: 1500,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "colored",
                        });

                        setWaitingRequest(false);
                    }
                } else {
                    alert("Please try again, the verification process did not work for your provided number")
                }
            }

            setTimeout(() => {

                setResendCode(false)

            }, '15000')
        }

        if(waitingRequest){
            return
        }

        setWaitingRequest(true)

        resendSMS()
    }

    const handlePhonePrimary = (event, data) => {
        setPhonePrimary(event);
        setPhonePrefix(data?.dialCode);
        setPhoneCountry(data?.name);
        setPhoneCountryCode(data?.countryCode);
    }

    const handlePhoneCodeRequest = (event) => {

        event.preventDefault()

        async function handlePhoneRequest() {

            const requestedCode = await addCodeRequest(phonePrimary, userId, phoneCountry, hash)

            if(requestedCode){

                if(requestedCode.status === 200 && requestedCode.data.result === 'pending'){
                    
                    setSentCode(true)
                    
                    setSubmittedPhone(true);
                    
                    toast.info("A verification code has been sent to the number provided", {
                        position: "bottom-center",
                        autoClose: 1500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });

                    setWaitingRequest(false)
                }
            } else {
                alert("Please try again, the verification process did not work for your provided number")
            }
        }

        if(waitingRequest){
            return    
        }

        setWaitingRequest(true)

        handlePhoneRequest()
    }

    const handlePhoneCodeVerify = (event) => {

        event.preventDefault()

        async function handlePhoneVerify() {

            const verifiedCode = await addCodeVerify(phonePrimary, codeInput, userId, phonePrefix, 
                phoneCountry, phoneCountryCode, hash)

            if(verifiedCode){

                if(verifiedCode.status === 200 && verifiedCode.data.result === 'approved'){
                    
                    setVerifiedPhone(true);
                    setCurrentStage(2)

                    toast.info("Thank you! Your phone number has been verified", {
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

                setWaitingVerify(false)
            }
        }

        if(waitingVerify){
            return
        }

        setWaitingVerify(true);

        handlePhoneVerify()
        
    }

    const handlePhotosUpload = async (event) => {

        event.preventDefault();
        
        if(waitingPhotos || croppedImageId?.length < 2 || !croppedImage){
            return
        }

        toast.info("Checking for inappropriate content, please wait...", {
            position: "bottom-center",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
        });

        setWaitingPhotos(true);
        
        var doneProfilePhoto = false;

        if(croppedImage){

            const formData = new FormData();
            const file = new File([croppedImage], `${userId}.jpeg`, { type: "image/jpeg" })
            formData.append("image", file);

            const nsfwResults = await axios.post("/nsfw/check", 
                formData,
                {
                    headers: { "Authorization": `Hash ${hash} ${userId}`, 
                    'Content-Type': 'multipart/form-data'},
                    withCredentials: true
                }
            );

            if(nsfwResults){

                var check1 = null;
                var check2 = null;

                for(let i=0; i<nsfwResults.data.length; i++){

                    if(nsfwResults.data[i].className === 'Hentai' && nsfwResults.data[i].probability < 0.2){
                        check1 = true
                    }
                    if(nsfwResults.data[i].className === 'Porn' && nsfwResults.data[i].probability < 0.2){
                        check2 = true
                    }
                }            

                if(check1 && check2){

                    try {

                        const response = await axios.post(PUBLIC_MEDIA_URL, 
                            formData,
                            {
                                headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                'Content-Type': 'multipart/form-data'},
                                withCredentials: true
                            }
                        );
            
                        if(response){

                            if(response.status === 200){

                                const tempProfilePicURL = response.data.Location;
                                const tempProfilePicKey = response.data.Key;
                                
                                const changedProfilePic = await axios.patch('/profile/profilepic', 
                                    JSON.stringify({userId, tempProfilePicKey, tempProfilePicURL}),
                                    {
                                        headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                            'Content-Type': 'application/json'},
                                        withCredentials: true
                                    }
                                );
            
                                if(changedProfilePic){
                
                                    setAuth(prev => {
                                        return {
                                            ...prev,
                                            profilePicURL: tempProfilePicURL
                                        }
                                    });      
                                    
                                    URL.revokeObjectURL(image.photo?.src)
                                    doneProfilePhoto = true;
                                
                                } else {

                                    toast.error("Upload was not successful, please try again!", {
                                        position: "bottom-center",
                                        autoClose: 7000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                        theme: "colored",
                                    });

                                    var ObjectIdArray = [tempProfilePicKey]

                                    const deleted = await axios.delete("/s3/deletemany", 
                                        {
                                            data: {
                                                userId,
                                                ObjectIdArray
                                            },
                                            headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                                'Content-Type': 'application/json'},
                                            withCredentials: true
                                        }
                                    );

                                    if(deleted){
                                        setWaitingPhotos(false)
                                        return
                                    }
                                }
                            }
                        }
            
                    } catch (err) {
                        console.error(err);
                    }

                } else {
                    
                    toast.error("Your photo did not meet our terms of service. Please check for inappropriate content and try again.", {
                        position: "bottom-center",
                        autoClose: 7000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });
                }
            }

        } else {

            toast.error("Profile photo is not attached, please try again.", {
                position: "bottom-center",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        }

        if(doneProfilePhoto){

            let currentIndex = 0;
            let mediaLength = 0;
            let finalImageObjArray = [];
            let finalVideoObjArray = [];

            mediaLength = croppedImageId?.length

            while (mediaLength > 0 && currentIndex < mediaLength){

                if(croppedImageURLId?.length > 0 && croppedImageId[currentIndex] !== undefined){
            
                    const formData = new FormData();
                    const file = new File([croppedImageId[currentIndex]], `${userId}.jpeg`, { type: "image/jpeg" })
                    formData.append("image", file);
                    
                    const nsfwResults = await axios.post("/nsfw/check", 
                        formData,
                        {
                            headers: { "Authorization": `Hash ${hash} ${userId}`, 
                            'Content-Type': 'multipart/form-data'},
                            withCredentials: true
                        }
                    );

                    if (nsfwResults?.status !== 413){

                        var check1 = null;
                        var check2 = null;

                        for(let i=0; i<nsfwResults.data.length; i++){

                        if(nsfwResults.data[i].className === 'Hentai' && nsfwResults.data[i].probability < 0.2){
                            check1 = true
                        }
                        if(nsfwResults.data[i].className === 'Porn' && nsfwResults.data[i].probability < 0.2){
                            check2 = true
                        }
                    }            

                    if(check1 && check2){

                        try {
                            const response = await axios.post(IMAGE_UPLOAD_URL, 
                                formData,
                                {
                                    headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                    'Content-Type': 'multipart/form-data'},
                                    withCredentials: true
                                }
                            );

                            if(response?.status === 200){

                                const returnedObjId = response.data.key

                                finalImageObjArray.push(returnedObjId)
                                finalVideoObjArray.push("image")

                                currentIndex += 1
                            };

                        } catch (err) {
                            
                            setWaitingPhotos(false);

                            setErrorMessage("Failed to upload photo! Please try again!");

                            if(finalImageObjArray?.length > 0){

                                const deleted = await axios.delete("/s3/deletemany", 
                                    {
                                        data: {
                                            userId,
                                            finalImageObjArray
                                        },
                                        headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                            'Content-Type': 'application/json'},
                                        withCredentials: true
                                    }
                                );

                                if(deleted){
                                    setWaitingPhotos(false)
                                    return
                                }
                            }
                        }
                    
                    } else {

                        if(finalImageObjArray?.length > 0){

                            const deleted = await axios.delete("/s3/deletemany", 
                                {
                                    data: {
                                        userId,
                                        finalImageObjArray
                                    },
                                    headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                        'Content-Type': 'application/json'},
                                    withCredentials: true
                                }
                            );

                            if(deleted){
                                
                                setWaitingPhotos(false)
                                
                                return
                            }
                        }
                    }
                
                } else {

                    toast.error("The photo is too large, please upload a new photo!", {
                    position: "bottom-center",
                    autoClose: 7000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                    });
                    break
                }

            } else {
                toast.error("This post does not have an attached photo", {
                    position: "bottom-center",
                    autoClose: 7000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
                break
            }
            }

            if(finalImageObjArray?.length === mediaLength){

                const identificationFrontObjectId = finalImageObjArray[0]
                const identificationBackObjectId = finalImageObjArray[1]
        
                try {

                    const uploadedUserPhotos = await axios.post("/auth/useridphotos", 
                        JSON.stringify({userId, identificationFrontObjectId, identificationBackObjectId}),
                        {
                            headers: { "Authorization": `Hash ${hash} ${userId}`, 
                                'Content-Type': 'application/json'},
                            withCredentials: true
                        }
                    );

                    if(uploadedUserPhotos){

                        toast.info("Success, your photos have been uploaded and will be reviewed. We will send an email shortly after approval")
                    }

                } catch(err){

                    console.log(err)
                }
            }
        }
    }


    return(

        <>

        <div className='flex flex-col w-full h-full'>

        <MainHeader 
            loggedUserId={auth.userId} loggedUsername={auth.username} 
            profilePicURL={auth.profilePicURL} roles={auth.roles}
        />

        <div className='w-full flex flex-col justify-center items-center pt-[10vh]'>

            {currentStage >= 1 && <div className='flex flex-col mt-6'>

                <p className='text-base md:text-lg font-bold pb-2'>Step 1: Please Verify Your Phone Number</p>

                <div className={`text-sm text-gray-700 py-3 px-4 bg-white w-[350px]
                border-2 rounded-xl hover:scale-[1.01] ease-in-out border-[#00D3E0]/10 }`} >
                
                <MuiPhoneNumber sx={{ '& svg': { height: '1em', }, }}
                    defaultCountry={'us'}
                    className='w-full border-2 border-[#00D3E0]/10 rounded-xl
                        bg-white focus:outline-[#00D3E0]'
                    InputProps={{ disableUnderline: true }}    
                    // regions={['north-america']}
                    onChange={ ( e, data ) => handlePhonePrimary(e, data)} 
                    onFocus={() => setPhonePrimaryFocus(true)}
                    onBlur={() => setPhonePrimaryFocus(false)}
                    required
                />
                </div>

                {sentCode ? 
                
                <button disabled={codeInput?.length > 0 || verifiedPhone || resendCode} onClick={(e)=>handleResendCode(e)} 
                className={`my-2 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] flex flex-row gap-x-1
                ${ (codeInput?.length > 0 || verifiedPhone || resendCode ) ? ' hover:bg-gray-100 cursor-not-allowed ' : ' hover:bg-[#00D3E0] '}`}>

                {waitingRequest && 
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

                Resend verification code</button> : 
                
                <button disabled={phonePrimary?.length < 7 || submittedPhone || codeInput?.length > 0} onClick={(e)=>handlePhoneCodeRequest(e)} 
                className={`my-2 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] flex flex-row gap-x-1
                ${ (phonePrimary?.length < 7 || submittedPhone || codeInput?.length > 0 ) ? ' hover:bg-gray-100 cursor-not-allowed ' : ' hover:bg-[#00D3E0] '}`}>
                    
                    {waitingVerify && 
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

                    Submit phone number for verification
                </button>
                }


                <p className='text-sm flex flex-col w-[300px]'>
                Note: You will receive the code via a SMS text message. Regular charges from your phone plan may apply.</p>

            </div>}

            
            {currentStage >= 1 && <div className='w-full flex flex-col justify-center items-center pt-12'>
                
            <p className='text-base md:text-lg font-bold pb-2'>Step 2: Please Enter Your Verification Code</p>
                
                <VerificationInput
                    value={codeInput}
                    validChars={'0-9'}
                    onChange={(e)=>handleCodeInput(e)}
                    length={6}
                />

                {!verifiedPhone ? 
                <button disabled={phonePrimary?.length < 7 || !submittedPhone} onClick={(e)=>handlePhoneCodeVerify(e)} 
                className={`my-2 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] 
                     ${ (phonePrimary?.length < 7 || !submittedPhone || verifiedPhone || codeInput?.length < 6 ) ? ' hover:bg-gray-100 cursor-not-allowed ' : ' hover:bg-[#00D3E0] '}`}>
                    Confirm code</button>
                :    
                <button disabled={true} className={`my-2 py-4 px-3 cursor-not-allowed rounded-2xl border-2 border-[#00D3E0] `}>
                    Phone Number Is Verified</button>
                }
            </div>}
            
            
            {currentStage >= 2 && <div className='w-full flex flex-col justify-center items-center pt-12'>

                <p className='text-base md:text-lg font-bold pb-2'>Final Step: Create Your SocketJuice Profile</p>

                <div className='flex flex-col items-center justify-center'>

                    <p className='text-base md:text-lg font-medium text-center'>a) Upload a profile picture </p>

                    <div className='flex flex-col content-center items-center w-full'>
                        <ProfileCropper setCroppedImage={setCroppedImage} setImage={setImage} 
                        image={image} profilePicURL={image} />
                    </div>

                    <div className="flex w-full flex-col px-4">

                        <div className='flex flex-col justify-center items-center pt-4'>
                            <p className='text-base md:text-lg font-medium text-center'>
                                b) Upload photos of driver's license (Front and back)</p>
                            <p className='text-sm flex flex-col w-[350px] items-center'>
                            Note: Driver's license will not be shared publicly</p>
                        </div>
                        
                        <div className="w-full flex justify-center">
                        
                        <CameraId croppedImage={croppedImageId} setCroppedImage={setCroppedImageId} croppedImageURL={croppedImageURLId} setCroppedImageURL={setCroppedImageURLId} 
                            coverIndex={coverIndexId} setCoverIndex={setCoverIndexId} mediaTypes={mediaTypesId} setMediaTypes={setMediaTypesId} videoArray={videoArrayId} setVideoArray={setVideoArrayId} 
                            videoURLArray={videoURLArrayId} setVideoURLArray={setVideoURLArrayId}  videoThumbnails={videoThumbnailsId} setVideoThumbnails={setVideoThumbnailsId} camera_id={"id"}
                            oldMediaTrack={oldMediaTrackId} setOldMediaTrack={setOldMediaTrackId} limit={1} />  
                        
                        </div>
                    </div>

                    <button onClick={(e)=>handlePhotosUpload(e)} 
                        className='my-2 mb-8 py-4 px-3 rounded-2xl border-2 
                            border-[#00D3E0] hover:bg-[#00D3E0] flex flex-row gap-x-1 '>

                        {waitingPhotos && 
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

                        Submit Photos </button>

                    </div>
                </div>}
            </div>
        </div>

        <ToastContainer
            toastStyle={{ backgroundColor: "#00D3E0" }}
                position="bottom-center"
                autoClose={7000}
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

export default VerifyPage;