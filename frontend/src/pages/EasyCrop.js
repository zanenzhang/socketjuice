import React, { useState } from "react";

import ImageUploading from "react-images-uploading";

import Cropper from "react-easy-crop";

import {
  createTheme,
  MuiThemeProvider
} from "@material-ui/core/styles";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider
} from "@material-ui/core";

import { cropImage } from "../components/imageCropper/cropUtils";

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none",
      fontSize: "18px" 
    }
  }
});

const ImageUploadingButton = ({ value, onChange, ...props }) => {
  return (
    <ImageUploading value={value} onChange={onChange} >
      {({ onImageUpload, onImageUpdate }) => (
        <>
        <MuiThemeProvider theme={theme}>
        <Button
          color="primary"
          onClick={value ? onImageUpload : () => onImageUpdate(0)}
          {...props}
          className="text-lg"
        >
          Upload Image
        </Button>
        </MuiThemeProvider>
      </>
      )}
    </ImageUploading>
  );
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
    <Dialog open={open} maxWidth="sm" fullWidth >
      <DialogTitle>Crop Image</DialogTitle>

      <DialogContent>
      <div className="flex-col relative w-full h-300 bg-gray-100">
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
          <label>
            Rotate
            <Slider
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="rotate"
              onChange={(e, rotation) => setRotation(rotation)}
              className="range"
            />
          </label>

          <label>
            Zoom
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="zoom"
              onChange={(e, zoom) => setZoom(zoom)}
              className="range"
            />
          </label>

        </div>    

      </DialogContent>

      <DialogActions>
        <div className="flex flex-row gap-x-4 justify-center">
        <div className="rounded-xl p-2 bg-gray-300 hover:bg-[#8BEDF3] text-black hover:text-white">
        <button onClick={(event) => closeCrop()}>
          Cancel
        </button>
        </div>
        <div className="rounded-xl p-2 bg-gray-300 hover:bg-[#8BEDF3] text-black hover:text-white">
        <button
          color="primary"
          onClick={() =>
            onComplete(cropImage(image, croppedAreaPixels, rotation, 0.8))
          }
        >
          Finish Crop
        </button>
        </div>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default function EasyCrop({image, croppedImage, setImage, setCroppedImage, croppedImageURL, setCroppedImageURL}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="App">
      <ImageUploadingButton
        value={image}
        onChange={(newImage) => {
          setDialogOpen(true);
          setImage(newImage);
        }}
      />
      <ImageCropper
        open={dialogOpen}
        image={image?.length > 0 && image[0].dataURL}
        setCroppedImage={setCroppedImage}
        croppedImage={croppedImage}
        onComplete={(imagePromise) => {
          imagePromise.then((image) => {
            setCroppedImage(image);
            setCroppedImageURL(URL.createObjectURL(image));
            setDialogOpen(false);
          });
        }}
        closeCrop={(event)=>{
          setDialogOpen(false);
        }}
        containerStyle={{
          position: "relative",
          width: "100%",
          height: 300,
          background: "#333",
        }}
      />
      <div className="justify-center">
      {croppedImageURL && <img src={croppedImageURL} alt="blab" className="w-60" />}
      </div>
    </div>
  );
}
