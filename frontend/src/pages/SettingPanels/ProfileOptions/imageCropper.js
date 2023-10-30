import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { cropImage } from '../../../components/imageCropper/cropUtils';
import "./imageCropper.css";

const ImageCropper = ({
  onCropImage,
  inputImg,
  imgName,
  closeModal,
  ratio,
  cropShape,
  setCroppedImage,
  quality
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImage = await cropImage(inputImg, croppedAreaPixels, 0, quality);
      if (croppedImage){
        setCroppedImage(croppedImage)
      }
      onCropImage(
        new File([croppedImage], imgName, {
          type: "image/png",
          lastModified: new Date().getTime()
        })
      );
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line
  }, [croppedAreaPixels]);

  return (
    /* need to have a parent with `position: relative` 
    to prevent cropper taking up whole page */
    <div className="cropper">

      <div className="flex justify-center items-center pt-4">
      <Cropper
        minZoom={0.4}
        image={inputImg}
        crop={crop}
        zoom={zoom}
        aspect={1}
        restrictPosition={false}
        onCropChange={setCrop}
        onCropComplete={onCropComplete}
        onZoomChange={setZoom}
        style={{
          containerStyle: {
            width: 300,
            height: 300,
            position: "relative",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
        cropShape={cropShape}
      />
      </div>

      <div className="d-flex justify-between content-center mt-5">

        <div className="flex flex-col justify-center">
        <p>Zoom</p>
        <input
            className="mb-4 accent-[#8BEDF3]"
            type="range"
            value={zoom}
            max={3.2}
            min={ratio ? 0.4 : 0.6}
            step={0.1}
            onChange={(e) => setZoom(e.target.value)}
        />
        </div>

        <div className="flex flex-row justify-center gap-x-10">
        <button
          onClick={() => {
            showCroppedImage();
            closeModal();
          }}
          className="hover:bg-[#8BEDF3] bg-white text-black border-2 border-[#8BEDF3] text-base font-semibold hover:text-white 
            py-3 px-5 rounded-2xl w-[100px]"
        >
          Save
        </button>

        <button onClick={(event)=>closeModal(event)} 
            className="bg-gray-200 hover:bg-orange-200 text-base font-semibold py-3 px-5 rounded-2xl w-[100px]">
          Cancel
        </button>

        </div>

      </div>
    </div>
  );
};

export default ImageCropper;
