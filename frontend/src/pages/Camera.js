import React from "react";
import {FACING_MODES} from "react-html5-camera-photo"
import Cropper from "react-easy-crop";
import { useState, useRef } from "react";
import TakePhoto from "../components/cameraPhoto/takePhoto";
import { toBase64 } from "../components/cameraPhoto/base64";
import { cropImage } from "../components/imageCropper/cropUtils";
import cloneDeep from 'lodash/cloneDeep';

import {
  generateVideoThumbnails,
} from "@rajesh896/video-thumbnails-generator";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VideoConverter from "../components/videoconverter";

import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    makeStyles, 
    withStyles
  } from "@material-ui/core";

import { DEFAULT_IMAGE_PATH } from "../constants/paths";

const colorScheme = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "cyan",
  "purple"
];

export default function Camera({croppedImage, setCroppedImage, croppedImageURL, setCroppedImageURL, 
  coverIndex, setCoverIndex, mediaTypes, setMediaTypes, videoArray, setVideoArray, videoURLArray, 
  setVideoURLArray, videoThumbnails, setVideoThumbnails, oldMediaTrack, setOldMediaTrack}) {

  const [isUseCamera, setUseCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [quality, setQuality] = useState(0.5);
  
  const refs = useRef({
    video: null,
    loader: null,
    numberInput: null,
    thumbButton: null
  });

//   const [result, setResult] = useState(null);
  var camSwitch = FACING_MODES.ENVIRONMENT;

  const useStyles = makeStyles(() => ({
    paper: {
      top: '4%',
      height: '520px',
      width: '375px',
      display: 'flex',
      flexDirection: 'column'
    },
    root: {
      position: 'fixed',
      zIndex: '10010 !important',
    }
  }));

  const classes = useStyles();

  const refPhoto = useRef(null);
  const refVideo = useRef(null);
//   const refCanvas = useRef(null);
//   const [canvasSize, setCanvasSize] = useState({ width: 300, height: 100 });
//   const [imageSize, setImageSize] = useState({ width: 300, height: 300 });
  const [dialogOpen, setDialogOpen] = useState(false);

//   useEffect(() => {
//     if (refPhoto?.current) {
//       const { offsetWidth, offsetHeight } = refPhoto.current;
//       setCanvasSize({ width: offsetWidth, height: offsetHeight });
//     }
//   }, [photo]);

//   const drawBox = ({ ctx, x, y, width, height, color }) => {
//     ctx.beginPath();
//     ctx.lineWidth = "2";
//     ctx.rect(x, y, width, height);
//     ctx.strokeStyle = color;
//     ctx.stroke();
//   };

//   useEffect(() => {
//     if (result) {
//       const canvas = refCanvas.current;
//       const ctx = canvas.getContext("2d");
//       ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
//       const { detected_objects } = result;
//       const resolutionMultiply = canvasSize.width / imageSize.width;
//       detected_objects.forEach((object, i) => {
//         const { bottom, left, right, top } = object.bounding_box;
//         const x = left * resolutionMultiply;
//         const y = top * resolutionMultiply;
//         const width = (right - left) * resolutionMultiply;
//         const height = (bottom - top) * resolutionMultiply;
//         drawBox({ ctx, x, y, width, height, color: colorScheme[i] });
//       });
//     }
//   }, [result, canvasSize, imageSize]);

const loadVideo = file => new Promise((resolve, reject) => {
  try {
      let video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        var duration = video.duration;
          resolve({duration, file})
      }

      video.onerror = function () {
          reject("Invalid video. Please select a video file.")
      }

      video.src = URL.createObjectURL(file);

  } catch (e) {
      reject(e)
  }
})

  const changePhotoIndex = (event, index) => {

    event.preventDefault();
    setCoverIndex(index)
  }

  const handleTakePhoto = async (dataUri) => {
    if (dataUri) {
      setPhoto(dataUri);
    //   const imageSize = await getImageSize(dataUri);
    //   setImageSize(imageSize);
      setUseCamera(false);
      setDialogOpen(true);
    }
  };

  const ImageCropper = ({
    open,
    image,
    onComplete,
    closeCrop,
    containerStyle,
    ...props
  }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
    return (
      <Dialog open={open}
        classes={classes}
         >

        <p className="text-2xl text-[#8BEDF3] font-bold text-center pt-1">Crop Image</p>

        <DialogContent>
        <div className="flex-col w-full bg-gray-100 overflow-y-auto">
          <div style={containerStyle}>
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={3/3}
              onCropChange={setCrop}
              onCropComplete={(_, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              {...props}
            />
            </div>  

            <div className="pl-2 w-full">
            <p>
              Rotate
              </p>
              </div>
              <div className="px-2 w-full">
              <input
                  className="my-1 accent-[#8BEDF3] w-full"
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(e) => {
                    setRotation(e.target.value)}
                  }
              />
              </div>
            
            <div className="pl-2 w-full">
            <p>
              Zoom
              </p>
              </div>
              <div className="px-2 w-full">
              <input
                  className="my-1 accent-[#8BEDF3] w-full"
                  type="range"
                  value={zoom}
                  max={3}
                  min={0.4}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
              />
              </div>
          </div>    

          <div className="flex flex-row gap-x-4 justify-center pt-3">
          
            <button onClick={() => closeCrop()}
              className="rounded-xl p-2 bg-gray-300 hover:bg-orange-200
              text-black w-[100px] flex justify-center cursor-pointer">
              Cancel
            </button>
            
            <button
              className="rounded-xl p-2 bg-gray-300 hover:bg-[#8BEDF3]
              text-black hover:text-white w-[100px] flex justify-center"
              color="primary"
              onClick={() =>
                onComplete(cropImage(image, croppedAreaPixels, rotation, quality))
              }
            >
              Finish Crop
            </button>
          
          </div>
  
        </DialogContent>
  
        <DialogActions>
          
        </DialogActions>
      </Dialog>
    );
  };

  const handleUploadMedia = async (e) => {
    
    if(e.target?.files?.length > 0){

      const file = e.target.files; 

      const maxAllowedSize = 5 * 1024 * 1024;
      const largeSize = 3 * 1024 * 1024;
      const medSize = 1 * 1024 * 1024;

      if(file[0] && file[0]?.size > maxAllowedSize ){
        alert("File size is too large, please try again!")
        return
      }
      
      if(file[0] && (file[0].type).indexOf('image') !== -1){

        toast.info("Uploading image, please wait...", {
          position: "top-center",
          autoClose: 500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          });

        if(file[0].size > largeSize){
          setQuality(0.2)
        } else if(file[0].size > medSize){
          setQuality(0.35)
        } else {
          setQuality(0.5)
        }
  
        const _photo = await toBase64(file[0]);

        if(_photo){
          
          setPhoto(_photo);
          // const imageSize = await getImageSize(_photo);
          // setImageSize(imageSize);
    
          var mediaTypesCopy = cloneDeep(mediaTypes);
          mediaTypesCopy.push("image");
          setMediaTypes(mediaTypesCopy);

          var oldMediaCopy = cloneDeep(oldMediaTrack);
          oldMediaCopy.push("newmedia");
          setOldMediaTrack(oldMediaCopy);

          var videoArrayCopy = [...videoArray];
          videoArrayCopy.push("image");
          setVideoArray(videoArrayCopy);

          var videoURLArrayCopy = cloneDeep(videoURLArray);
          videoURLArrayCopy.push("image");
          setVideoURLArray(videoURLArrayCopy);

          var thumbnailsCopy = cloneDeep(videoThumbnails);
          thumbnailsCopy.push([]);
          setVideoThumbnails(thumbnailsCopy);

          setDialogOpen(true);
        }
      
      } else if(file[0] && file[0].type.indexOf('video') !== -1){

        toast.info("Uploading video and extracting cover image, please wait...", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });

        //take snapshot, add to images array
        // add video to video array        

        const video = await loadVideo(file[0])

        if(video.duration){
          
          if(video.duration < 1 || video.duration > 20){
            alert("Video duration does not meet requirements (max 20 seconds)")
            return
          
          } else {

            generateVideoThumbnails(video.file, 10).then((thumbs) => {

              if(thumbs && thumbs?.length > 0){
  
                var thumbnailsCopy = [...videoThumbnails]
                thumbnailsCopy.push(thumbs)
                
                setVideoThumbnails(thumbnailsCopy);
  
                if(thumbs?.length > 0){
                
                    setPhoto(thumbs[0]);
                    // const imageSize = await getImageSize(_photo);
                    // setImageSize(imageSize);
  
                    var videoArrayCopy = [...videoArray];

                    //Convert video to mp4 if in another format
                    VideoConverter(video.file, 'mp4').then(convertedVideoDataObj => {
                      if(convertedVideoDataObj){
  
                        videoArrayCopy.push(convertedVideoDataObj.mediaFile);
                        setVideoArray(videoArrayCopy);
      
                        var videoURLArrayCopy = cloneDeep(videoURLArray);
                        videoURLArrayCopy.push(convertedVideoDataObj.data);
                        setVideoURLArray(videoURLArrayCopy);
                  
                        var mediaTypesCopy = cloneDeep(mediaTypes);
                        mediaTypesCopy.push("video");
                        setMediaTypes(mediaTypesCopy);

                        var oldMediaCopy = cloneDeep(oldMediaTrack);
                        oldMediaCopy.push("newmedia");
                        setOldMediaTrack(oldMediaCopy);
  
                        setDialogOpen(true);
                      }
                    });
                  }
                }
            });
          }
        }
      }
    } 
  };

  const handleResetMedia = () => {

    setPhoto(false);
    
    if(croppedImageURL?.length > 0){
      for(let i=0; i<croppedImageURL?.length;i++){
        URL.revokeObjectURL(croppedImageURL[i])
      }
    }

    if(videoURLArray?.length > 0){
      for(let i=0; i<videoURLArray?.length;i++){
        if(videoURLArray[i] && videoURLArray[i] !== 'video'){
          URL.revokeObjectURL(videoURLArray[i])
        }
      }
    }

    // setResult(null);
    // const canvas = refCanvas.current;
    // const ctx = canvas.getContext("2d");
    // ctx.clearRect(0, 0, 300, 100);

    setCroppedImage([]);
    setCroppedImageURL([]);
    setCoverIndex(0);
    setMediaTypes([]);
    setVideoArray([]);
    setVideoURLArray([]);
    setOldMediaTrack([]);
    setVideoThumbnails([]);
};

const handleSpliceRemoveMedia = (index) => {

  setPhoto(false);

  var imagesLength = croppedImage?.length
  if(imagesLength > croppedImageURL?.length){
    return
  }

  var imagesArrayCopy = cloneDeep(croppedImage)
  var imageURLArrayCopy = cloneDeep(croppedImageURL)
  var videoArrayCopy = cloneDeep(videoArray)
  var videoURLArrayCopy = cloneDeep(videoURLArray)
  var videoThumbnailsCopy = cloneDeep(videoThumbnails)
  var oldMediaCopy = cloneDeep(oldMediaTrack)
  var mediaTypesCopy = cloneDeep(mediaTypes)

  if(mediaTypes?.length > 0 && mediaTypes?.length > index && mediaTypes[mediaTypes.length - 1] === 'image'){

    if(croppedImageURL?.length > 0){
        URL.revokeObjectURL(croppedImageURL[index])
    }

    imagesArrayCopy.splice(index, 1)
    imageURLArrayCopy.splice(index, 1)
    videoURLArrayCopy.splice(index, 1)
    videoThumbnailsCopy.splice(index, 1)
    videoArrayCopy.splice(index, 1)
    oldMediaCopy.splice(index, 1)
    mediaTypesCopy.splice(index, 1)
    
    setVideoURLArray(videoURLArrayCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setVideoArray(videoArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)
    setCroppedImage(imagesArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setMediaTypes(mediaTypesCopy)

  } else if(mediaTypes?.length > 0 && mediaTypes?.length > index && mediaTypes[mediaTypes.length - 1] === 'video'){
    
    if(croppedImageURL?.length > 0){
      URL.revokeObjectURL(croppedImageURL[index])
    }

    imagesArrayCopy.splice(index, 1)
    imageURLArrayCopy.splice(index, 1)
    videoArrayCopy.splice(index, 1)
    videoThumbnailsCopy.splice(index, 1)
    videoURLArrayCopy.splice(index, 1)
    oldMediaCopy.splice(index, 1)
    mediaTypesCopy.splice(index, 1)

    setCroppedImage(imagesArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)    
    setVideoArray(videoArrayCopy)
    setVideoURLArray(videoURLArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setMediaTypes(mediaTypesCopy)

    if(videoURLArray?.length > 0 && videoURLArray?.length > index && videoURLArray[videoURLArray?.length - 1] && videoURLArray[videoURLArray?.length - 1] !== 'image'){
      URL.revokeObjectURL(videoURLArray[index])
    }

  } else if(mediaTypes?.length > 0 && mediaTypes?.length > index){
    
    if(croppedImageURL?.length > 0){
        URL.revokeObjectURL(croppedImageURL[imagesLength-1])
    }

    imagesArrayCopy.splice(index, 1)
    imageURLArrayCopy.splice(index, 1)
    videoArrayCopy.splice(index, 1)
    videoThumbnailsCopy.splice(index, 1)
    videoURLArrayCopy.splice(index, 1)
    oldMediaCopy.splice(index, 1)
    mediaTypesCopy.splice(index, 1)

    setCroppedImage(imagesArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)    
    setVideoArray(videoArrayCopy)
    setVideoURLArray(videoURLArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setMediaTypes(mediaTypesCopy)
  }

  if(coverIndex === index && coverIndex > 0){
    var newIndex = coverIndex - 1
    setCoverIndex(newIndex)
  } else {
    setCoverIndex(0)
  }
}

const handlePopMedia = () => {

  setPhoto(false);

  var imagesLength = croppedImage?.length
  if(imagesLength > croppedImageURL?.length){
    return
  }

  var imagesArrayCopy = cloneDeep(croppedImage)
  var imageURLArrayCopy = cloneDeep(croppedImageURL)
  var videoURLArrayCopy = cloneDeep(videoURLArray)
  var videoArrayCopy = cloneDeep(videoArray)
  var videoThumbnailsCopy = cloneDeep(videoThumbnails)
  var oldMediaCopy = cloneDeep(oldMediaTrack)
  var mediaTypesCopy = cloneDeep(mediaTypes)

  if(mediaTypes?.length > 0 && mediaTypes[mediaTypes.length - 1] === 'image'){
    
    if(croppedImageURL?.length > 0){
        URL.revokeObjectURL(croppedImageURL[imagesLength-1])
    }

    imagesArrayCopy.pop()
    imageURLArrayCopy.pop()
    videoArrayCopy.pop()
    videoThumbnailsCopy.pop()
    videoURLArrayCopy.pop()
    oldMediaCopy.pop()
    mediaTypesCopy.pop()

    setCroppedImage(imagesArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)    
    setVideoArray(videoArrayCopy)
    setVideoURLArray(videoURLArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setMediaTypes(mediaTypesCopy)


  } else if(mediaTypes?.length > 0 && mediaTypes[mediaTypes.length - 1] === 'video'){

    if(croppedImageURL?.length > 0){
      URL.revokeObjectURL(croppedImageURL[imagesLength-1])
    }

    if(videoURLArray?.length > 0 && videoURLArray[videoURLArray?.length - 1] && videoURLArray[videoURLArray?.length - 1] !== 'image'){
      URL.revokeObjectURL(videoURLArray[imagesLength-1])
    }

    imagesArrayCopy.pop()
    imageURLArrayCopy.pop()
    videoArrayCopy.pop()
    videoThumbnailsCopy.pop()
    videoURLArrayCopy.pop()
    oldMediaCopy.pop()
    mediaTypesCopy.pop()

    setCroppedImage(imagesArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)    
    setVideoArray(videoArrayCopy)
    setVideoURLArray(videoURLArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setMediaTypes(mediaTypesCopy)


  } else if(mediaTypes?.length > 0){

    if(croppedImageURL?.length > 0){
      URL.revokeObjectURL(croppedImageURL[imagesLength-1])
    }

    imagesArrayCopy.pop()
    imageURLArrayCopy.pop()
    videoArrayCopy.pop()
    videoThumbnailsCopy.pop()
    videoURLArrayCopy.pop()
    oldMediaCopy.pop()
    mediaTypesCopy.pop()

    setCroppedImage(imagesArrayCopy)
    setCroppedImageURL(imageURLArrayCopy)    
    setVideoArray(videoArrayCopy)
    setVideoURLArray(videoURLArrayCopy)
    setOldMediaTrack(oldMediaCopy)
    setVideoThumbnails(videoThumbnailsCopy)
    setMediaTypes(mediaTypesCopy)
  }

  if(coverIndex === imagesLength && coverIndex > 0){
    var newIndex = coverIndex - 1
    setCoverIndex(newIndex)
  } else {
    setCoverIndex(0)
  }
};

const handleFrontCamera = () =>{
    camSwitch = FACING_MODES.ENVIRONMENT;
    setUseCamera(true);
};

const handleSelfieCamera = () => {
    camSwitch = FACING_MODES.USER;
    setUseCamera(true);
};

  return (
    <div>
    <div className="p-0">
      <div className="flex justify-center items-center w-full min-h-72 rounded-xl mb-2">
        {/* CANVAS */}

        <ImageCropper
        open={dialogOpen}
        quality={quality}
        image={photo}
        setCroppedImage={setCroppedImage}
        croppedImage={croppedImage}
        onComplete={(imagePromise) => {
          
          imagePromise.then((image) => {

            var mediaArr = cloneDeep(croppedImage)
            var URLArr = cloneDeep(croppedImageURL)

            var currentImageURL = URL.createObjectURL(image)

            mediaArr.push(image)
            setCroppedImage(mediaArr);

            URLArr.push(currentImageURL)
            setCroppedImageURL(URLArr);

            setDialogOpen(false);
          });
        }}

        closeCrop={(event)=>{
          setPhoto(null);
          setDialogOpen(false);
          //Clear video file and thumbnails
          //check mediaType, clear videoArray, clear videoURLArray
          if(mediaTypes?.length > 0 && mediaTypes[mediaTypes?.length -1] !== undefined 
            && mediaTypes[mediaTypes?.length -1] === 'video' && mediaTypes?.length > croppedImage?.length){
            
            var mediaTypesCopy = cloneDeep(mediaTypes)
            var videoThumbnailsCopy = cloneDeep(videoThumbnails)
            var videoFilesCopy = cloneDeep(videoArray)
            var videoURLArrayCopy = cloneDeep(videoURLArray)
            var oldMediaCopy = cloneDeep(oldMediaTrack)

            mediaTypesCopy.pop()
            videoThumbnailsCopy.pop()
            videoFilesCopy.pop()
            videoURLArrayCopy.pop()
            oldMediaCopy.pop()

            if(videoURLArray?.length > 0 && videoURLArray[videoURLArray?.length - 1] && videoURLArray[videoURLArray?.length - 1] !== 'image'){
              URL.revokeObjectURL(videoURLArray[videoURLArray?.length - 1])
            }

            setMediaTypes(mediaTypesCopy)
            setVideoThumbnails(videoThumbnailsCopy)
            setVideoArray(videoFilesCopy)
            setVideoURLArray(videoURLArrayCopy)
            setOldMediaTrack(oldMediaCopy)
          }
        }}
        containerStyle={{
          position: "relative",
          width: "100%",
          height: '300px',
          background: "#333",
        }}
      />

      <div className="flex flex-col w-full justify-center">

        <div className={`relative ${croppedImageURL?.length === 0 && "hidden"}`}>

          <div className="flex flex-col">

          { (croppedImageURL?.length > 0 && croppedImageURL[coverIndex] !== undefined && mediaTypes[coverIndex] !== 'video') &&
            <div className="flex flex-col pt-2">
              <div className="flex flex-row justify-center pt-2">
                <img ref={refPhoto} key={'mainCropImage'} src={croppedImageURL[coverIndex] || DEFAULT_IMAGE_PATH} width="284" 
                className="rounded-xl border" />
              </div>
            </div>
          } 

          { (videoURLArray?.length > 0 && videoURLArray[coverIndex] !== undefined && mediaTypes[coverIndex] === 'video') &&
            <div className="flex flex-col pt-2">
              <div className="flex flex-row justify-center pt-2">
                <video ref={refVideo}
                poster={croppedImageURL[coverIndex]}
                key={'mainVideo'} src={videoURLArray[coverIndex] || DEFAULT_IMAGE_PATH} 
                width="284" 
                className="rounded-xl border object-contain max-w-[284px]" 
                controls
                />
              </div>
            </div>
          } 

          {croppedImageURL?.length > 0 &&

          <div className="flex flex-col items-center py-2">

            <p>Choose Cover Photo:</p>

            <div className="flex flex-wrap w-[350px] justify-center py-2 gap-x-4">
          
            {croppedImageURL.map((image, index) => (

              <div className="flex flex-col" key={`croppedcontainer_${index}`}>
              
              <img key={`${index}_imageURL`}
              onClick={(event)=>changePhotoIndex(event, index)}
               ref={refPhoto} src={croppedImageURL[index] || DEFAULT_IMAGE_PATH} 
               width="60" 
               className={`rounded-xl border hover:cursor-pointer w-[60px] h-[60px]
               hover:opacity-50 ${index === coverIndex && ' border-2 border-[#8BEDF3]'}`} />

               <button 
                  onClick={()=>handleSpliceRemoveMedia(index)}
                  className="absolute ml-[50px] mb-[25px]"
                  >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" 
                    strokeWidth="1.5" stroke="#7F1D1D" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
               </button>

               </div>
            ))}

            </div>
          </div>
          }
          
          </div>
        </div>

        {
          (isUseCamera ? (
            <>
            <TakePhoto onTakePhoto={handleTakePhoto} camSwitch={camSwitch} />
            </>
          ) : (
            <div className="flex flex-col w-full gap-y-2 justify-center items-center pb-2">
                  
                  <div className="flex flex-col justify-center items-center w-full pt-2">

                      <div className="flex flex-row justify-center gap-x-4">
                            <div>
                                {croppedImage?.length > 0 && (   
                                    <button className="text-black
                                    border-0
                                    text-base 
                                    bg-gray-200 
                                    hover:bg-gray-300
                                    hover:text-[#8BEDF3]
                                    hover:font-semibold
                                    hover:cursor-pointer py-2 rounded-xl mb-4 flex flex-row gap-x-2 px-4 
                                      justify-center items-center flex-shrink-0" 
                                      onClick={handlePopMedia}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
                                        stroke="#8BEDF3" className="w-7">
                                          <path strokeLinecap="round" strokeLinejoin="round" 
                                          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>

                                      Drop Last
                                    </button>            
                                  )}
                              </div>
                              <div>
                                {croppedImage?.length > 0 && (
                                  
                                  <button className="text-black
                                  border-0
                                  text-base 
                                  bg-gray-200 
                                  hover:bg-gray-300
                                  hover:text-[#8BEDF3]
                                  hover:font-semibold
                                  hover:cursor-pointer py-2 rounded-xl mb-4 flex flex-row gap-x-2 px-4
                                    justify-center items-center" 
                                    onClick={handleResetMedia}>
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                                        strokeWidth="1.5" stroke="#8BEDF3" className="w-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" 
                                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                      </svg>

                                    Restart
                                  </button>
                                
                                )}
                            </div>
                        </div>
                    
                    {croppedImage?.length === 0 && 

                      <div className="py-2">
                    
                      <input type="file" 
                        id="files"
                        accept="image/*,video/*"
                        onChange={handleUploadMedia} 
                        value={""}
                        placeholder={"Add media!"}
                        className="w-full 
                        file:mr-4
                        file:py-4 file:px-4
                        file:text-black
                        file:rounded-xl file:border-0
                        file:text-base 
                        file:bg-gray-200 
                        hover:file:bg-[#8BEDF3]
                        hover:file:text-white
                        hover:file:cursor-pointer
                        hidden
                        "
                    />
                    <label className="
                      flex flex-row
                      justify-center
                      items-center
                      gap-x-3
                        py-4 px-4
                      text-black
                        rounded-xl border-0
                        text-base 
                        bg-gray-200 
                        hover:bg-gray-300
                        hover:text-[#8BEDF3]
                        hover:font-semibold
                        hover:cursor-pointer
                        flex-shrink-0" htmlFor="files">
                          <div className="flex flex-col">
                          <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-7"
                                viewBox="0 0 24 24"
                                fill="#8BEDF3"
                                >
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h14V5H5zm6 6V7h2v4h4v2h-4v4h-2v-4H7v-2h4z" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            <p>Add A Photo or Video<br/> </p>
                            <p className="">(up to 20 seconds)</p>
                            </div>
                        </label>
                        
                      </div>

                    }

                {(croppedImage?.length > 0 && croppedImage?.length <10 ) && 

                <div className="py-2">

                <input type="file" 
                  id="files"
                  accept="video/*,image/*"
                  onChange={handleUploadMedia} 
                  value={""}
                  placeholder={"Add a photo!"}
                  className="w-full 
                  file:mr-4
                  file:py-4 file:px-4
                  file:text-black
                  file:rounded-xl file:border-0
                  file:text-base 
                  file:bg-gray-200 
                  hover:file:bg-[#8BEDF3]
                  hover:file:text-white
                  hover:file:cursor-pointer
                  hidden
                  "
                />
                <label className="
                      flex flex-row
                      justify-center
                      items-center
                      gap-x-3
                        py-4 px-4
                      text-black
                        rounded-xl border-0
                        text-base 
                        bg-gray-200 
                        hover:bg-gray-300
                        hover:text-[#8BEDF3]
                        hover:font-semibold
                        hover:cursor-pointer
                        flex-shrink-0" htmlFor="files">
                          <div className="flex flex-col">
                          <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-7"
                                viewBox="0 0 24 24"
                                fill="#8BEDF3"
                                >
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h14V5H5zm6 6V7h2v4h4v2h-4v4h-2v-4H7v-2h4z" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                            <p>Add Another Photo or Video<br/> </p>
                            <p className="">(up to 20 seconds)</p>
                            </div>
                        </label>
                  
                  </div>

                }
                        
         </div>              
              
            <p className="hidden sm:flex sm:flex-row sm:justify-center text-center">OR</p>
            
            {(croppedImage?.length === 0 && croppedImage?.length <10 ) &&
            <button
                className="
                py-4 px-4 text-black
                rounded-xl border-0
                text-base 
                bg-gray-200 
                hover:bg-gray-300
                hover:text-[#8BEDF3]
                hover:font-semibold
                hover:cursor-pointer
                hidden md:flex flex-row 
                text-center gap-x-2
                justify-center
                items-center"
                onClick={() => handleFrontCamera()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
                    stroke="#8BEDF3" className="w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>

                Use Camera To Take A Photo
            </button>}

            {(croppedImage?.length > 0 && croppedImage?.length <10 ) &&
            <button
                className="
                py-4 px-4 text-black
                rounded-xl border-0
                text-base 
                bg-gray-200 
                hover:bg-gray-300
                hover:text-[#8BEDF3]
                hover:font-semibold
                hover:cursor-pointer
                hidden md:flex flex-row 
                text-center gap-x-2
                justify-center
                items-center"
                onClick={() => handleFrontCamera()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" 
                    stroke="#8BEDF3" className="w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>

                Add A Camera Photo
            </button>}
            
            </div>
          ))}
      </div>

      </div>

      {isUseCamera && (
        <>
        <button className="bg-gray-300 text-black hover:bg-[#8BEDF3] hover:text-white p-2 rounded-xl mb-2" 
        onClick={() => setUseCamera(false)}>
          Cancel Camera
        </button>
        
        </>
      )}
    </div>

    <ToastContainer
    toastStyle={{ backgroundColor: "#8BEDF3" }}
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
    
    </div>
  );
}


