import React, {useState, useMemo} from 'react';
import {
    Paper,
    TextField,
    MenuItem,
    Button,
    IconButton
} from '@material-ui/core';

import { useNavigate } from "react-router-dom";
import { Profanity, ProfanityOptions } from '@2toad/profanity';
import Tesseract from 'tesseract.js';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import axios from '../../api/axios';
import Otp from "../../components/verify/otp";
import editProfilePic from '../../helpers/DriverData/editProfilePic';

import Camera from "../Camera";
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


const VerifyPage = () => {

    const search = useLocation().search;
    const userId = new URLSearchParams(search).get("userId");
    const hash = new URLSearchParams(search).get("hash");

    const IMAGE_UPLOAD_URL = '/s3/singleimage';
    const VIDEO_UPLOAD_URL = '/s3/singlevideo';
    const navigate = useNavigate();
    
    const [code, setCode] = useState("")
    const [pno, setPno] = useState("")
    const [otpShow, setOtpShow] = useState(false)
    const [otp, setOtp] = useState("")

    const [profileImage, setProfileImage] = useState("");
    const [croppedProfileImage, setCroppedProfileImage] = useState("");
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const { setAuth, auth  } = useAuth();

    const [croppedImageURL, setCroppedImageURL] = useState([]);
    const [croppedImage, setCroppedImage] = useState([]);
    const [coverIndex, setCoverIndex] = useState(0);
    const [mediaTypes, setMediaTypes] = useState([]);
    const [videoArray, setVideoArray] = useState([]);
    const [videoURLArray, setVideoURLArray] = useState([]);
    const [videoThumbnails, setVideoThumbnails] = useState([]);
    const [oldMediaTrack, setOldMediaTrack] = useState([]);
    const [waiting, setWaiting] = useState(false);

    const PUBLIC_MEDIA_URL = '/s3/single-profilepic';

    const handleChangeProfilePic = async (event) => {

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

        if(croppedProfileImage){

            const formData = new FormData();
            const file = new File([croppedProfileImage], `${auth.userId}.jpeg`, { type: "image/jpeg" })
            formData.append("image", file);

            const nsfwResults = await axios.post("/nsfw/check", 
            formData,
            {
            headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
            'Content-Type': 'multipart/form-data'},
                withCredentials: true
            }
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
                        {
                            headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`,
                            'Content-Type': "multipart/form-data" },
                            withCredentials: true
                        }
                    );
        
                    if(response){

                        if(response.status === 200){

                            const tempProfilePicURL = response.data.Location;
                            const tempProfilePicKey = response.data.Key;
                            
                            const changedProfilePic = await editProfilePic(auth.userId, tempProfilePicKey, tempProfilePicURL, auth.accessToken)
        
                            if(changedProfilePic){
            
                                setAuth(prev => {
                                    return {
                                        ...prev,
                                        profilePicURL: tempProfilePicURL
                                    }
                                });      
                                
                                toast.success("Success! Changed profile pic!", {
                                    position: "bottom-center",
                                    autoClose: 1500,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "colored",
                                })
                                
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
    }
    

    const options = new ProfanityOptions();
    options.wholeWord = false;
    const profanity = new Profanity(options);
    profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);

    async function onSubmitHandler(e) {

        e.preventDefault();
    
        if(waiting || (croppedImage?.length !== croppedImageURL?.length) || (croppedImage?.length === 0) ){
          return
        }
    
        let currentIndex = 0;
        let mediaLength = 0;
        let finalImageObjArray = [];
        let finalVideoObjArray = [];
        let finalTesserText = "";
    
        var autoCloseTime = 0
    
        mediaLength = croppedImage?.length
        autoCloseTime = mediaLength * 7000    
    
        setWaiting(true);
    
        toast.info("Checking for inappropriate content, please wait...", {
          position: "bottom-center",
          autoClose: autoCloseTime,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          });
    
          var videoTranscripts = "";
          var transcriptCount = 0;
    
          for (let i=0; i<videoArray?.length; i++){
    
            if(videoArray[i] !== 'image'){
              const formData = new FormData();
              const date = new Date();
              const videofile = new File([videoArray[i]], `${date.getTime()}_${auth.userId}.mp4`, { type: "video/mp4" })
              formData.append("video", videofile);
              
              const transcript = await axios.post("/speech/transcribe", 
                formData,
                  {
                    headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
                    'Content-Type': 'multipart/form-data'},
                      withCredentials: true
                  }
                );
        
              if(transcript){
                
                videoTranscripts = videoTranscripts.concat(transcript.data.text)
                transcriptCount += 1;
              
              } else {
        
                transcriptCount += 1;
              }
            } else {
              transcriptCount += 1;
            }
            
          }
    
          if(transcriptCount === videoArray?.length){
    
            const profanityCheck1 = profanity.exists(videoTranscripts)
    
            while (mediaLength > 0 && currentIndex < mediaLength){
    
              var tessDone = false;
              var tessResult = {};
              if(croppedImageURL?.length > 0 && oldMediaTrack[currentIndex] !== 'oldmedia'){
                
                tessResult = await Tesseract.recognize(croppedImageURL[currentIndex],'eng')
    
                  if (tessResult.text){
                    tessDone = true
                  } else {
                    tessResult.text = "test"
                    tessDone = true
                  }
    
              } else {
                tessResult.text = "test"
                tessDone = true
              }
        
              if(tessDone){
    
                finalTesserText = finalTesserText.concat(" ", tessResult?.text)
    
                const profanityCheck2 = profanity.exists(tessResult?.text)
                    
                if(!profanityCheck1 && !profanityCheck2){
    
                  if(mediaTypes[currentIndex] !== 'video'){
        
                    if(croppedImage?.length > 0 && croppedImage[currentIndex] !== undefined){
          
                      const formData = new FormData();
                      const file = new File([croppedImage[currentIndex]], `${userId}.jpeg`, { type: "image/jpeg" })
                      formData.append("image", file);
                      
                      const nsfwResults = await axios.post("/nsfw/check", 
                      formData,
                      {
                        headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
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
                                    headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
                                    'Content-Type': 'application/json'},
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
                    } else {
    
                      toast.info("Checking video for inappropriate content, this may take some time, please hold...", {
                        position: "bottom-center",
                        autoClose: (autoCloseTime *3),
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                        });
          
                      if(videoThumbnails?.length > 0 && videoThumbnails[currentIndex] !== undefined){
          
                        var thumbCheckCount = 0;
                        var thumbIndex = 0;
          
                          while(thumbIndex < videoThumbnails[currentIndex]?.length){
          
                            const formData = new FormData();
                            const file = new File([dataURItoBlob(videoThumbnails[currentIndex][thumbIndex])], `${userId}.jpeg`, { type: "image/jpeg" });
                            formData.append("image", file);
                            
                            const nsfwResults = await axios.post("/nsfw/check", 
                            formData,
                            {
                              headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
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
      
                                thumbCheckCount += 1;
                                thumbIndex += 1;
          
                              } else {
              
                                setErrorMessage("Your post content may not meet our terms of service. Please check for inappropriate content.");
                                break
                              }
                              
                            } else {
              
                              toast.error("The photo check was not completed, please upload a new photo!", {
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
          
                          if(thumbCheckCount === videoThumbnails[currentIndex]?.length && videoArray[currentIndex] !== 'image'){
          
                            const date = new Date();
    
                            const videoFormData = new FormData();
                            const videofile = new File([videoArray[currentIndex]], `${date.getTime()}_${userId}.mp4`, { type: "video/mp4" })
                            videoFormData.append("video", videofile);
          
                            const imageFormData = new FormData();
                            const file = new File([croppedImage[currentIndex]], `${date.getTime()}_${userId}.jpeg`, { type: "image/jpeg" })
                            imageFormData.append("image", file);
          
                            try {
                              const videoResponse = await axios.post(VIDEO_UPLOAD_URL, 
                                videoFormData,
                                  {
                                    headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
                                    'Content-Type': 'multipart/form-data'},
                                      withCredentials: true
                                  }
                              );
          
                              const imageResponse = await axios.post(IMAGE_UPLOAD_URL, 
                                imageFormData,
                                {
                                  headers: { "Authorization": `Bearer ${auth.accessToken} ${userId}`, 
                                  'Content-Type': 'application/json'},
                                    withCredentials: true
                                }
                            );
          
                              if(videoResponse?.status === 200 && imageResponse?.status === 200){
          
                                  const returnedObjIdVideo = videoResponse.data.key
                                  const returnedObjIdImage = imageResponse.data.key
          
                                  if(returnedObjIdVideo){
                                    finalVideoObjArray.push(returnedObjIdVideo)
                                    finalImageObjArray.push(returnedObjIdImage)
                                    currentIndex += 1
                                  }
                              }
          
                            } catch (err) {
                              setWaiting(false);
                                setErrorMessage("Failed to upload video! Please try again!");
                                break
                            }
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
                    break
                }
              } else {
        
                console.log("Tesseract is not connected")
                break
              }
            }
        
            if(finalImageObjArray?.length === mediaLength){
    
              const previewMediaObjectId = finalImageObjArray[coverIndex]
              const previewMediaType = mediaTypes[coverIndex]
        
              try {
        
                const newPost = await addSingleSocialPost(auth.userId, username, category,
                  previewMediaObjectId, finalImageObjArray, finalVideoObjArray, coverIndex, mediaTypes, 
                  previewMediaType, caption, link, description, imageText, finalTesserText, userOrStore, 
                  city, region, country, auth.accessToken)
        
                if(newPost){
                  toast.success("Success! Completed uploads!", {
                    position: "bottom-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                    });
                    setWaiting(false);
                    setShowModal(false);
                    
                    for(let i=0; i<croppedImageURL?.length; i++){
                      URL.revokeObjectURL(croppedImageURL[i])
                    }
    
                    for(let i=0; i<videoURLArray?.length; i++){
                      if(videoURLArray[i] !== 'image'){
                        URL.revokeObjectURL(videoURLArray[i])
                      }
                    }
        
                    setCroppedImage([])
                    setCroppedImageURL([])
                    setVideoArray([])
                    setVideoURLArray([])
                    setVideoThumbnails([])
                    
                } else {
    
                  var objectsToDelete = [...finalImageObjArray, ...finalVideoObjArray]
    
                  if(objectsToDelete?.length > 0){
                    const deleted = await deleteManyObj(objectsToDelete, auth.userId, auth.accessToken)
                    if(deleted){
                      console.log("Objects deleted")
                    }
                  }
                }
                
              } catch (err) {
                  setIsLoading(false);
                  setErrorMessage("Failed to create new post! Please try again!");
              }
            
            } else {
        
              toast.error("Upload process failed, please try again!", {
                position: "bottom-center",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
                });
        
                return
            }
          }
    }

    const _getCode = async() => {
        const e = code + pno;
        await axios.get(`${process.env.LOCAL_SERVER}/verifymobile/getcode`, {
            params: {
                phonenumber: e,
                channel: 'sms'
            }
        })
        .then(data => console.log(data))
        .catch(err => console.log(err));
    };

    const _verifyCode = async () => {
        const e = code + pno;
        await axios.get(`${process.env.LOCAL_SERVER}/verifymobile/verifycode`, {
            params: {
                phonenumber: e,
                code: otp
            }
        })
        .then(data => console.log(data))
        .catch(err => console.log(err));
    }


    return(

        <>

        <div style={{
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(160, 160, 160, 0.2)',
            height: '100vh'
        }}>

        <MainHeader 
            loggedUserId={auth.userId} loggedUsername={auth.username} 
            profilePicURL={auth.profilePicURL} roles={auth.roles}
        />

        <div className='flex flex-col mt-6'>
            <label className='text-base md:text-lg font-medium'>Phone Number</label>
            <div className={`text-sm text-gray-700 w-full py-3 px-4 bg-white
            border-2 rounded-xl hover:scale-[1.01] ease-in-out border-[#995372]/10 }`} >
            
            <MuiPhoneNumber sx={{ '& svg': { height: '1em', }, }}
                defaultCountry={'us'}
                className='w-full border-2 border-[#995372]/10 rounded-xl
                    bg-white focus:outline-[#995372]'
                InputProps={{ disableUnderline: true }}    
                regions={['north-america']}
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
                        <span className="text-sm md:text-base text-green-600">Please enter your store's phone number</span>
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
                        <span className="text-sm md:text-base text-red-600">Please enter your store's phone number</span>
                    </div>
                    </>
                )
            }
        </div>

            <Paper elevation={4} style={{ padding: 20, width: 300, marginBottom: 60}}>

                {!otpShow ? <h3 style={{marginLeft: 10, color: '#9f9f9f'}}>αlpha</h3> : <IconButton onClick={() => {

                    setOtpShow(false)
                    setOtp("")

                }} size="small"><ArrowBackIcon /></IconButton>}

                {!otpShow ? <h3>Enter your Phone Number</h3> : <h3>Enter the OTP</h3> }
                {otpShow ? <p>A One Time Password has been sent to your phone number for verification puposes.</p> : null}

                <div>
                    {!otpShow ? <div style={{display: 'flex', flexDirection: 'row', marginLeft: 'auto', justifyContent: 'space-around'}}>

                        <div style={{alignItems: 'flex-end', justifyContent: 'center', display: 'flex', marginRight: 10, width: 60}}>

                            <TextField id="code" label="Code" color="secondary" value={code} 
                            
                                onChange={e => {
                                    setCode(e.target.value)
                                }}/>
                        </div>
                        <div>
                            <TextField id="phone" label="Phone" color="secondary" value={pno} 
                            
                            onChange={e => {
                                if((e.target.value[e.target.value.length-1]>='0' && e.target.value[e.target.value.length-1]<='9') || !e.target.value) {
                                    setPno(e.target.value);
                                }
                            }}/>
                        </div>

                    </div> : <Otp otp={otp} setOtp={val => setOtp(val)} />}

                    {otpShow ? <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 5}}>

                        Didn't receive an OTP? <Button onClick={() => _getCode()} color="primary" style={{textTransform: 'none', fontSize: 15}}>Resend OTP</Button>

                    </div> : null }

                    <div style={{display: 'flex', flexDirection: 'row', marginTop: 20}}>
                        
                        <Button 
                            variant="contained" 
                            disabled={(pno.length!==10) || (code===null) || !isNumeric(pno) || (otpShow && otp.length!==6)} 
                            color="secondary" 
                            style={{ 
                                color: 'white', 
                                marginLeft: 'auto', 
                                textTransform: 'none'
                            }}
                            onClick={() => {
                                if(otpShow) {
                                    _verifyCode();
                                } else {
                                    _getCode();
                                    setOtpShow(true);
                                }
                            }}>
                            Verify
                        </Button>
                    </div>
                    
                    {!otpShow ? <p>By tapping Verify an SMS may be sent. Message & data rates may apply.</p> : null}
                    
                    {/* <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10}}>
                        <a href='#' style={{textDecoration: 'none', fontSize: 14}}>Terms of service</a>
                        <a href='#' style={{textDecoration: 'none', fontSize: 14, marginLeft: 10}}>User agreement</a>
                    </div> */}
                </div>
            </Paper>

            <div className='flex flex-col items-center justify-center'>

                <p className='text-center py-4'>Upload a profile picture! </p>

                <div className='flex flex-col content-center items-center w-full'>
                    <ProfileCropper setCroppedImage={setCroppedProfileImage} setImage={setProfileImage} 
                    image={image} profilePicURL={auth.profilePicURL} />
                </div>

                <div className='flex flex-row gap-x-4 pb-4 pt-2'>
                    
                    <button 
                        className={`flex align-center px-4 py-2 text-[#995372] w-[110px]
                        border-2 rounded-xl border-[#995372] bg-white text-base font-semibold
                        hover:bg-[#995372] hover:text-white justify-center items-center gap-x-2`}
                        onClick={(event)=>handleChangeProfilePic(event)}
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

                        Confirm
                    </button>
                </div>

                <div className="flex w-full flex-col px-4">
                    <label className="flex justify-start sm:justify-center text-base md:text-lg font-bold text-[#995372]">Select or Take Photo:</label>   
                    
                    <div className="w-full flex justify-center">
                    
                    <Camera croppedImage={croppedImage} setCroppedImage={setCroppedImage} croppedImageURL={croppedImageURL} setCroppedImageURL={setCroppedImageURL} 
                        coverIndex={coverIndex} setCoverIndex={setCoverIndex} mediaTypes={mediaTypes} setMediaTypes={setMediaTypes} videoArray={videoArray} setVideoArray={setVideoArray} 
                        videoURLArray={videoURLArray} setVideoURLArray={setVideoURLArray}  videoThumbnails={videoThumbnails} setVideoThumbnails={setVideoThumbnails} 
                        oldMediaTrack={oldMediaTrack} setOldMediaTrack={setOldMediaTrack} />  
                    
                    </div>
                </div>

                <div>
                    <p>Upload ID and photos of charger</p>
                </div>

            </div>

        </div>

        <ToastContainer
            toastStyle={{ backgroundColor: "#995372" }}
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