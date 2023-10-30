import React from "react";

import ImageInput from "./imageInput";
import './profileCropper.css'

const ProfileCropper = ({setCroppedImage, image, setImage, profilePicURL}) => {
  
  return (
    <div className="">
      <ImageInput
        imageData={image.photo?.src}
        defaultPic={profilePicURL}
        type="admin"
        name="photo"
        label="Add Photo"
        showPreview
        onChange={(files) => setImage(files, "admin")}
        setCroppedImage={setCroppedImage}
      />
    </div>
  );
};

export default ProfileCropper;
