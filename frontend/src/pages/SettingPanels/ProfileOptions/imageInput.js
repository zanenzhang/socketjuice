import React, { useState } from "react";

import ImageModal from "./imageModal";
import "./imageInput.css";
import { Link } from "react-router-dom";

const ImageInput = ({
  name,
  onChange,
  showPreview,
  imageData,
  defaultPic,
  setCroppedImage,
  croppedImage,
}) => {
  const [image, setImage] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [height, setHeight] = useState(null);
  const [width, setWidth] = useState(null);
  const [quality, setQuality] = useState(0.5);

  const onChangeHandler = file => {
    onChange({
      [name]: {
        data: file[0],
        src: URL.createObjectURL(file[0]),
      },
    });
  };

  const handleFile = e => {
    if (e.target.files.length > 0) {
      const file = e.target.files;
      const maxAllowedSize = 5 * 1024 * 1024;
      const largeSize = 3 * 1024 * 1024;
      const medSize = 1 * 1024 * 1024;

      if(file[0] && (file[0].type).indexOf('image') !== -1){

        if (file[0] && file[0].size > maxAllowedSize) {
          alert("File size is too large, please try again!");
          return
        } 
        if(file[0].size > largeSize){
          setQuality(0.2)
        } else if(file[0].size > medSize){
          setQuality(0.35)
        } else {
          setQuality(0.5)
        }
  
        var url = URL.createObjectURL(file[0]);
        var img = new Image();
        img.src = url;
        img.onload = function () {
          setWidth(this.width);
          setHeight(this.height);
        };
        setImage(file[0]);
        setModalIsOpen(true);
        e.target.value = null;
      }
    }
  };
  let inputElement;

  return (
    <>
      <ImageModal
        modalIsOpen={modalIsOpen}
        quality={quality}
        closeModal={() => {
          setModalIsOpen(prevState => !prevState);
        }}
        image={image}
        onCropImage={croppedImg => onChangeHandler([croppedImg])}
        ratio={height / width <= 0.5 ? true : false}
        setCroppedImage={setCroppedImage}
      />

      {showPreview && (
        <div className="flex content-center justify-center pb-2">
            <img
              key={imageData}
              src={imageData ? imageData : defaultPic}
              className="w-40 h-40 rounded-full border-2 border-[#8BEDF3]/50 bg-white"
              alt="img"
              onError={e => (e.target.src = defaultPic)}
            />
          
        </div>
      )}
      <Link onClick={() => inputElement.click()}>
        <button className="align-center mb-2 px-4 py-1 
            border-2 rounded-xl border-[#8BEDF3] bg-white text-base
            hover:bg-[#8BEDF3] text-black" >
        Select Profile Picture
        </button>
    </Link>

      <input
        ref={input => (inputElement = input)}
        accept="image/*"
        type="file"
        style={{ display: "none" }}
        onChange={handleFile}
        className="file:mr-4 file:py-2 file:px-4
        file:rounded-xl file:border-0
        file:text-sm file:font-semibold
        file:bg-gray-300 
        hover:file:bg-[#8BEDF3]
        hover:file:text-white"
      />
    </>
  );
};

export default ImageInput;
