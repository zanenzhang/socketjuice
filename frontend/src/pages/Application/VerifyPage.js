import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import { profanity } from '@2toad/profanity';
import Tesseract from 'tesseract.js';
import axios from '../../api/axios';
import editProfilePic from '../../helpers/DriverData/editProfilePic';
import deleteManyObj from "../../helpers/Media/deleteManyObjects";
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
    const userId = new URLSearchParams(search).get("userId");
    const hash = new URLSearchParams(search).get("hash");

    const IMAGE_UPLOAD_URL = '/s3/singleimage';
    const VIDEO_UPLOAD_URL = '/s3/singlevideo';
    const PHONE_PRIMARY_REGEX = /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/;

    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    const [verifyCode, setVerifyCode] = useState("");
    
    const [submittedPhone, setSubmittedPhone] = useState(false);
    const [submittedPhotos, setSubmittedPhotos] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState(false);
    const [verifiedPhotos, setVerifiedPhotos] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState("");

    const [phonePrimary, setPhonePrimary] = useState("");
    const [validPhonePrimary, setValidPhonePrimary] = useState(false);
    const [phonePrimaryFocus, setPhonePrimaryFocus] = useState(false);

    const { setAuth, auth  } = useAuth();

    const [profileImage, setProfileImage] = useState("../../images/defaultUserPic.svg");
    const [croppedProfileImage, setCroppedProfileImage] = useState("");

    const [currentstage, setCurrentstage] = useState(1);

    const [croppedImageURLId, setCroppedImageURLId] = useState([]);
    const [croppedImageId, setCroppedImageId] = useState([]);
    const [coverIndexId, setCoverIndexId] = useState(0);
    const [mediaTypesId, setMediaTypesId] = useState([]);
    const [videoArrayId, setVideoArrayId] = useState([]);
    const [videoURLArrayId, setVideoURLArrayId] = useState([]);
    const [videoThumbnailsId, setVideoThumbnailsId] = useState([]);
    const [oldMediaTrackId, setOldMediaTrackId] = useState([]);

    //Put photo limit, 1 for front and back, more for arrays
    
    const [waiting, setWaiting] = useState(false);

    const PUBLIC_MEDIA_URL = '/s3/single-profilepic';

    useEffect(() => {
        setValidPhonePrimary(PHONE_PRIMARY_REGEX.test(phonePrimary));
    }, [phonePrimary])


    const handlePhotosUpload = async (event) => {

        event.preventDefault();
        
        if(waiting){
            return
        }

        toast.info("Checking for inappropriate content, please wait...", {
            position: "bottom-center",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
        });

        setWaiting(true);
        
        var doneProfilePhoto = false;
        var doneIdPhotos = false;

        if(croppedProfileImage){

            const formData = new FormData();
            const file = new File([croppedProfileImage], `${userId}.jpeg`, { type: "image/jpeg" })
            formData.append("image", file);

            const nsfwResults = await axios.post("/nsfw/check", 
            formData,
            );

            if (nsfwResults){

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
                    );
        
                    if(response){

                        if(response.status === 200){

                            const tempProfilePicURL = response.data.Location;
                            const tempProfilePicKey = response.data.Key;
                            
                            const changedProfilePic = await editProfilePic(userId, tempProfilePicKey, tempProfilePicURL, hash)
        
                            if(changedProfilePic){
            
                                setAuth(prev => {
                                    return {
                                        ...prev,
                                        profilePicURL: tempProfilePicURL
                                    }
                                });      
                                
                                URL.revokeObjectURL(profileImage.photo?.src)
                                setWaiting(false)
                                setSuccess(true);
                            
                            } else {

                                toast.error("Upload was not successful, please try again!", {
                                    position: "bottom-center",
                                    autoClose: 1500,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "colored",
                                });

                                //delete profile pic here
                                
                                setWaiting(false)
                            }
                        }
                    }
        
                } catch (err) {
                    console.error(err);
                }

            } else {
                
                toast.error("Your photo did not meet our terms of service. Please check for inappropriate content.", {
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

        } else {

            toast.error("Profile photo is not attached, please try again.", {
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

        let currentIndex = 0;
        let mediaLength = 0;
        let finalImageObjArray = [];
        let finalVideoObjArray = [];

        mediaLength = croppedImageId?.length
        var autoCloseTime = mediaLength * 7000    


        while (mediaLength > 0 && currentIndex < mediaLength){

          if(croppedImageURLId?.length > 0 && croppedImageId[currentIndex] !== undefined){
      
            const formData = new FormData();
            const file = new File([croppedImageId[currentIndex]], `${userId}.jpeg`, { type: "image/jpeg" })
            formData.append("image", file);
            
            const nsfwResults = await axios.post("/nsfw/check", 
            formData,
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
                );

                if(response?.status === 200){

                    const returnedObjId = response.data.key

                    finalImageObjArray.push(returnedObjId)
                    finalVideoObjArray.push("image")

                    currentIndex += 1
                };

            } catch (err) {
                setWaiting(false);
                setErrorMessage("Failed to upload photo! Please try again!");
                break
            }
            
            } else {

            setErrorMessage("Your post content may not meet our terms of service. Please check for inappropriate content.");
            break
            }
        
        } else {

            toast.error("The photo is too large, please upload a new photo!", {
            position: "bottom-center",
            autoClose: autoCloseTime,
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
                autoClose: 1500,
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

            const previewMediaObjectId = finalImageObjArray[coverIndexId]
            const previewMediaType = mediaTypesId[coverIndexId]
    
          try {

            //Upload id photos

            doneIdPhotos = true

          } catch(err){

            console.log(err)
          }
        }

        if(doneProfilePhoto && doneIdPhotos){

            toast.info("Success, photos have been uploaded and will be reviewed")
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

        <div className='flex flex-col mt-6'>

            <p className='text-base md:text-lg font-bold pb-2'>Step 1: Please Verify Your Phone Number</p>

            <div className={`text-sm text-gray-700 py-3 px-4 bg-white w-[350px]
            border-2 rounded-xl hover:scale-[1.01] ease-in-out border-[#00D3E0]/10 }`} >
            
            <MuiPhoneNumber sx={{ '& svg': { height: '1em', }, }}
                defaultCountry={'us'}
                className='w-full border-2 border-[#00D3E0]/10 rounded-xl
                    bg-white focus:outline-[#00D3E0]'
                InputProps={{ disableUnderline: true }}    
                // regions={['north-america']}
                onChange={ ( e ) => setPhonePrimary(e)} 
                onFocus={() => setPhonePrimaryFocus(true)}
                onBlur={() => setPhonePrimaryFocus(false)}
                required
            />
            </div>
        </div>

        <div className='flex flex-row mx-2 gap-x-2 mt-1'>
            
            {validPhonePrimary ? 
                (
                    <>
                    <div className='flex flex-col justify-center'>
                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#38a169" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    </div>
                    <div className='flex flex-col justify-center'>
                        <span className="text-sm md:text-base text-green-600">Please enter a valid phone number</span>
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
                        <span className="text-sm md:text-base text-red-600">Please enter a valid phone number</span>
                    </div>
                    </>
                )
            }
        </div>
            
            <button className='my-2 px-4 py-3 rounded-2xl border-2 border-[#00D3E0] hover:bg-[#00D3E0] '>
                Submit phone number for verification</button>
                <p className='text-sm flex flex-col w-[300px]'>
                Note: You will receive the code via a SMS text message. Regular charges from your phone plan may apply.</p>

            <div className='w-full flex flex-col justify-center items-center pt-12'>
                
            <p className='text-base md:text-lg font-bold pb-2'>Step 2: Please Enter Your Verification Code</p>
                
                <VerificationInput />

                <button className='my-2 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] hover:bg-[#00D3E0]'>
                    Confirm code</button>
            </div>
            
            <div className='w-full flex flex-col justify-center items-center pt-12'>

            <p className='text-base md:text-lg font-bold pb-2'>Step 3: Create Your SocketJuice Profile</p>

            <div className='flex flex-col items-center justify-center'>

                <p className='text-base md:text-lg font-medium text-center'>a) Upload a profile picture </p>

                <div className='flex flex-col content-center items-center w-full'>
                    <ProfileCropper setCroppedImage={setCroppedProfileImage} setImage={setProfileImage} 
                    image={profileImage} profilePicURL={profileImage} />
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

                <button onClick={(e)=>handlePhotosUpload(e)} className='my-2 mb-8 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] hover:bg-[#00D3E0]'>
                    Submit Photos </button>

                </div>
            </div>
            </div>
        </div>

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
    );
}

export default VerifyPage;