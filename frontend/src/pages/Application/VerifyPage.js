import React, {useState, useEffect} from 'react';


import { useNavigate } from "react-router-dom";
import { Profanity, ProfanityOptions } from '@2toad/profanity';
import Tesseract from 'tesseract.js';
import axios from '../../api/axios';
import editProfilePic from '../../helpers/DriverData/editProfilePic';
import deleteManyObj from "../../helpers/Media/deleteManyObjects";
import VerificationInput from "react-verification-input";

import Camera from "../Camera";
import CameraSinglePhoto from '../CameraSinglePhoto';
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

    const [croppedImageURLDriver, setCroppedImageURLDriver] = useState([]);
    const [croppedImageDriver, setCroppedImageDriver] = useState([]);
    const [coverIndexDriver, setCoverIndexDriver] = useState(0);
    const [mediaTypesDriver, setMediaTypesDriver] = useState([]);
    const [videoArrayDriver, setVideoArrayDriver] = useState([]);
    const [videoURLArrayDriver, setVideoURLArrayDriver] = useState([]);
    const [videoThumbnailsDriver, setVideoThumbnailsDriver] = useState([]);
    const [oldMediaTrackDriver, setOldMediaTrackDriver] = useState([]);

    const [croppedImageURLHost, setCroppedImageURLHost] = useState([]);
    const [croppedImageHost, setCroppedImageHost] = useState([]);
    const [coverIndexHost, setCoverIndexHost] = useState(0);
    const [mediaTypesHost, setMediaTypesHost] = useState([]);
    const [videoArrayHost, setVideoArrayHost] = useState([]);
    const [videoURLArrayHost, setVideoURLArrayHost] = useState([]);
    const [videoThumbnailsHost, setVideoThumbnailsHost] = useState([]);
    const [oldMediaTrackHost, setOldMediaTrackHost] = useState([]);

    const [croppedImageURLFront, setCroppedImageURLFront] = useState([]);
    const [croppedImageFront, setCroppedImageFront] = useState([]);
    const [coverIndexFront, setCoverIndexFront] = useState(0);
    const [mediaTypesFront, setMediaTypesFront] = useState([]);
    const [videoArrayFront, setVideoArrayFront] = useState([]);
    const [videoURLArrayFront, setVideoURLArrayFront] = useState([]);
    const [videoThumbnailsFront, setVideoThumbnailsFront] = useState([]);
    const [oldMediaTrackFront, setOldMediaTrackFront] = useState([]);

    const [croppedImageURLBack, setCroppedImageURLBack] = useState([]);
    const [croppedImageBack, setCroppedImageBack] = useState([]);
    const [coverIndexBack, setCoverIndexBack] = useState(0);
    const [mediaTypesBack, setMediaTypesBack] = useState([]);
    const [videoArrayBack, setVideoArrayBack] = useState([]);
    const [videoURLArrayBack, setVideoURLArrayBack] = useState([]);
    const [videoThumbnailsBack, setVideoThumbnailsBack] = useState([]);
    const [oldMediaTrackBack, setOldMediaTrackBack] = useState([]);
    
    //Put photo limit, 1 for front and back, more for arrays
    
    const [waiting, setWaiting] = useState(false);

    const PUBLIC_MEDIA_URL = '/s3/single-profilepic';

    useEffect(() => {
        setValidPhonePrimary(PHONE_PRIMARY_REGEX.test(phonePrimary));
    }, [phonePrimary])

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

    
    async function onSubmitHandlerDriver(e) {

        e.preventDefault();
    
        if(waiting || (croppedImageDriver?.length !== croppedImageURLDriver?.length) ){
          return
        }
    
        let currentIndex = 0;
        let mediaLength = 0;
        let finalImageObjArray = [];
        let finalVideoObjArray = [];
        let finalTesserText = "";
    
        var autoCloseTime = 0
    
        mediaLength = croppedImageDriver?.length
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
    
          for (let i=0; i<videoArrayDriver?.length; i++){
    
            if(videoArrayDriver[i] !== 'image'){

              const formData = new FormData();
              const date = new Date();
              const videofile = new File([videoArrayDriver[i]], `${date.getTime()}_${auth.userId}.mp4`, { type: "video/mp4" })
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
    
          if(transcriptCount === videoArrayDriver?.length){
    
            const profanityCheck1 = profanity.exists(videoTranscripts)
    
            while (mediaLength > 0 && currentIndex < mediaLength){
    
              var tessDone = false;
              var tessResult = {};
              
              if(croppedImageURLDriver?.length > 0 && oldMediaTrackDriver[currentIndex] !== 'oldmedia'){
                
                tessResult = await Tesseract.recognize(croppedImageURLDriver[currentIndex],'eng')
    
                  if(tessResult.text){
                    
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
    
                  if(mediaTypesDriver[currentIndex] !== 'video'){
        
                    if(croppedImageDriver?.length > 0 && croppedImageDriver[currentIndex] !== undefined){
          
                      const formData = new FormData();
                      const file = new File([croppedImageDriver[currentIndex]], `${userId}.jpeg`, { type: "image/jpeg" })
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
          
                      if(videoThumbnailsDriver?.length > 0 && videoThumbnailsDriver[currentIndex] !== undefined){
          
                        var thumbCheckCount = 0;
                        var thumbIndex = 0;
          
                          while(thumbIndex < videoThumbnailsDriver[currentIndex]?.length){
          
                            const formData = new FormData();
                            const file = new File([dataURItoBlob(videoThumbnailsDriver[currentIndex][thumbIndex])], `${userId}.jpeg`, { type: "image/jpeg" });
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
          
                          if(thumbCheckCount === videoThumbnailsDriver[currentIndex]?.length && videoArrayDriver[currentIndex] !== 'image'){
          
                            const date = new Date();
    
                            const videoFormData = new FormData();
                            const videofile = new File([videoArrayDriver[currentIndex]], `${date.getTime()}_${userId}.mp4`, { type: "video/mp4" })
                            videoFormData.append("video", videofile);
          
                            const imageFormData = new FormData();
                            const file = new File([croppedImageDriver[currentIndex]], `${date.getTime()}_${userId}.jpeg`, { type: "image/jpeg" })
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
    
              const previewMediaObjectId = finalImageObjArray[coverIndexDriver]
              const previewMediaType = mediaTypesDriver[coverIndexDriver]
        
              try {
        
                const uploadMedia = true
        
                if(uploadMedia){
                  
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
                    
                    for(let i=0; i<croppedImageURLDriver?.length; i++){
                      URL.revokeObjectURL(croppedImageURLDriver[i])
                    }
    
                    for(let i=0; i<videoURLArrayDriver?.length; i++){
                      if(videoURLArrayDriver[i] !== 'image'){
                        URL.revokeObjectURL(videoURLArrayDriver[i])
                      }
                    }
        
                    setCroppedImageDriver([])
                    setCroppedImageURLDriver([])
                    setVideoArrayDriver([])
                    setVideoURLArrayDriver([])
                    setVideoThumbnailsDriver([])
                    
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
                  setWaiting(false);
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

    async function onSubmitHandlerHost(e) {

        e.preventDefault();
    
        if(waiting || (croppedImageHost?.length !== croppedImageURLHost?.length) ){
          return
        }
    
        let currentIndex = 0;
        let mediaLength = 0;
        let finalImageObjArray = [];
        let finalVideoObjArray = [];
        let finalTesserText = "";
    
        var autoCloseTime = 0
    
        mediaLength = croppedImageHost?.length
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
    
          for (let i=0; i<videoArrayHost?.length; i++){
    
            if(videoArrayHost[i] !== 'image'){

              const formData = new FormData();
              const date = new Date();
              const videofile = new File([videoArrayHost[i]], `${date.getTime()}_${auth.userId}.mp4`, { type: "video/mp4" })
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
    
          if(transcriptCount === videoArrayDriver?.length){
    
            const profanityCheck1 = profanity.exists(videoTranscripts)
    
            while (mediaLength > 0 && currentIndex < mediaLength){
    
              var tessDone = false;
              var tessResult = {};
              
              if(croppedImageURLDriver?.length > 0 && oldMediaTrackDriver[currentIndex] !== 'oldmedia'){
                
                tessResult = await Tesseract.recognize(croppedImageURLDriver[currentIndex],'eng')
    
                  if(tessResult.text){
                    
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
    
                  if(mediaTypesDriver[currentIndex] !== 'video'){
        
                    if(croppedImageDriver?.length > 0 && croppedImageDriver[currentIndex] !== undefined){
          
                      const formData = new FormData();
                      const file = new File([croppedImageDriver[currentIndex]], `${userId}.jpeg`, { type: "image/jpeg" })
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
          
                      if(videoThumbnailsDriver?.length > 0 && videoThumbnailsDriver[currentIndex] !== undefined){
          
                        var thumbCheckCount = 0;
                        var thumbIndex = 0;
          
                          while(thumbIndex < videoThumbnailsDriver[currentIndex]?.length){
          
                            const formData = new FormData();
                            const file = new File([dataURItoBlob(videoThumbnailsDriver[currentIndex][thumbIndex])], `${userId}.jpeg`, { type: "image/jpeg" });
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
          
                          if(thumbCheckCount === videoThumbnailsDriver[currentIndex]?.length && videoArrayDriver[currentIndex] !== 'image'){
          
                            const date = new Date();
    
                            const videoFormData = new FormData();
                            const videofile = new File([videoArrayDriver[currentIndex]], `${date.getTime()}_${userId}.mp4`, { type: "video/mp4" })
                            videoFormData.append("video", videofile);
          
                            const imageFormData = new FormData();
                            const file = new File([croppedImageDriver[currentIndex]], `${date.getTime()}_${userId}.jpeg`, { type: "image/jpeg" })
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
    
              const previewMediaObjectId = finalImageObjArray[coverIndexDriver]
              const previewMediaType = mediaTypesDriver[coverIndexDriver]
        
              try {
        
                const uploadMedia = true
        
                if(uploadMedia){
                  
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
                    
                    for(let i=0; i<croppedImageURLDriver?.length; i++){
                      URL.revokeObjectURL(croppedImageURLDriver[i])
                    }
    
                    for(let i=0; i<videoURLArrayDriver?.length; i++){
                      if(videoURLArrayDriver[i] !== 'image'){
                        URL.revokeObjectURL(videoURLArrayDriver[i])
                      }
                    }
        
                    setCroppedImageDriver([])
                    setCroppedImageURLDriver([])
                    setVideoArrayDriver([])
                    setVideoURLArrayDriver([])
                    setVideoThumbnailsDriver([])
                    
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
                  setWaiting(false);
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

            <p className='text-base md:text-lg font-bold pb-2'>Step 3: Build Your SocketJuice Profile</p>

            <div className='flex flex-col items-center justify-center'>

                <p className='text-base md:text-lg font-medium text-center'>a) Upload a profile picture </p>

                <div className='flex flex-col content-center items-center w-full'>
                    <ProfileCropper setCroppedImage={setCroppedProfileImage} setImage={setProfileImage} 
                    image={profileImage} profilePicURL={profileImage} />
                </div>

                <div className="flex w-full flex-col px-4">

                    <div className='flex justify-center pt-4'>
                        <p className='text-base md:text-lg font-medium text-center'>
                            b) Upload your driver's license (Front)</p>
                    </div>
                    
                    <div className="w-full flex justify-center">
                    
                    <CameraSinglePhoto croppedImage={croppedImageFront} setCroppedImage={setCroppedImageFront} croppedImageURL={croppedImageURLFront} setCroppedImageURL={setCroppedImageURLFront} 
                        coverIndex={coverIndexFront} setCoverIndex={setCoverIndexFront} mediaTypes={mediaTypesFront} setMediaTypes={setMediaTypesFront} videoArray={videoArrayFront} setVideoArray={setVideoArrayFront} 
                        videoURLArray={videoURLArrayFront} setVideoURLArray={setVideoURLArrayFront}  videoThumbnails={videoThumbnailsFront} setVideoThumbnails={setVideoThumbnailsFront} 
                        oldMediaTrack={oldMediaTrackFront} setOldMediaTrack={setOldMediaTrackFront} limit={1} />  
                    
                    </div>
                </div>

                <div className="flex w-full flex-col px-4">
                    
                    <div className='flex justify-center pt-4'>
                        <p className='text-base md:text-lg font-medium text-center'>
                            c) Upload your driver's license (Back)</p>
                    </div>
                    
                    <div className="w-full flex justify-center">
                    
                    <CameraSinglePhoto croppedImage={croppedImageBack} setCroppedImage={setCroppedImageBack} croppedImageURL={croppedImageURLBack} setCroppedImageURL={setCroppedImageURLBack} 
                        coverIndex={coverIndexBack} setCoverIndex={setCoverIndexBack} mediaTypes={mediaTypesBack} setMediaTypes={setMediaTypesBack} videoArray={videoArrayBack} setVideoArray={setVideoArrayBack} 
                        videoURLArray={videoURLArrayBack} setVideoURLArray={setVideoURLArrayBack}  videoThumbnails={videoThumbnailsBack} setVideoThumbnails={setVideoThumbnailsBack} 
                        oldMediaTrack={oldMediaTrackBack} setOldMediaTrack={setOldMediaTrackBack} limit={1} />  
                    
                    </div>
                </div>


                <div className="flex w-full flex-col px-4">
                    
                    <div className='flex justify-center pt-4'>
                        <p className='text-base md:text-lg font-medium text-center'>
                            d) Upload photos of your electric car (include license plate)</p>
                    </div>
                    
                    <div className="w-full flex justify-center">
                    
                    <Camera croppedImage={croppedImageDriver} setCroppedImage={setCroppedImageDriver} croppedImageURL={croppedImageURLDriver} setCroppedImageURL={setCroppedImageURLDriver} 
                        coverIndex={coverIndexDriver} setCoverIndex={setCoverIndexDriver} mediaTypes={mediaTypesDriver} setMediaTypes={setMediaTypesDriver} videoArray={videoArrayDriver} setVideoArray={setVideoArrayDriver} 
                        videoURLArray={videoURLArrayDriver} setVideoURLArray={setVideoURLArrayDriver}  videoThumbnails={videoThumbnailsDriver} setVideoThumbnails={setVideoThumbnailsDriver} 
                        oldMediaTrack={oldMediaTrackDriver} setOldMediaTrack={setOldMediaTrackDriver} limit={10} />  
                    
                    </div>
                </div>

                <div className="flex w-full flex-col px-4">
                    
                    <div className='flex justify-center pt-4'>
                        <p className='text-base md:text-lg font-medium text-center'>
                            e) Upload photos of your charger / wall connector</p>
                    </div>
                    
                    <div className="w-full flex justify-center">
                    
                    <Camera croppedImage={croppedImageHost} setCroppedImage={setCroppedImageHost} croppedImageURL={croppedImageURLHost} setCroppedImageURL={setCroppedImageURLHost} 
                        coverIndex={coverIndexHost} setCoverIndex={setCoverIndexHost} mediaTypes={mediaTypesHost} setMediaTypes={setMediaTypesHost} videoArray={videoArrayHost} setVideoArray={setVideoArrayHost} 
                        videoURLArray={videoURLArrayHost} setVideoURLArray={setVideoURLArrayHost}  videoThumbnails={videoThumbnailsHost} setVideoThumbnails={setVideoThumbnailsHost} 
                        oldMediaTrack={oldMediaTrackHost} setOldMediaTrack={setOldMediaTrackHost} limit={10} />  
                    
                    </div>
                </div>

                <button className='my-2 py-4 px-3 rounded-2xl border-2 border-[#00D3E0] hover:bg-[#00D3E0]'>
                    Save Profile and Submit</button>

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