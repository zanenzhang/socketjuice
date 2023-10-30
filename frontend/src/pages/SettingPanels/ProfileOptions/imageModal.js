import React from "react";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import ImageCropper from "./imageCropper";

const ImageModal = ({ modalIsOpen, closeModal, image, onCropImage, ratio, setCroppedImage, quality }) => {
  
  const boxStyle = {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '500px',
    borderRadius: '10px',
    bgcolor: 'white',
    border: '2px solid #8BEDF3',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
  };
  
  return (
    <div className="z-[300]">
      <Modal
        open={modalIsOpen}
        onClose={closeModal}
        contentLabel="Example Modal"
      >
        <Box sx={{ ...boxStyle }}>
        {image && (
          <ImageCropper
            imgName={image.name}
            onCropImage={onCropImage}
            inputImg={URL.createObjectURL(image)}
            closeModal={closeModal}
            cropShape="round"
            ratio={ratio}
            setCroppedImage={setCroppedImage}
            quality={quality}
          />
        )}
        </Box>
      </Modal>
    </div>
  );
};

export default ImageModal;
