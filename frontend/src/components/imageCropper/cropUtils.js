const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

  export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
  }
  
  export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);
  
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  }

async function getCroppedImg(imageSrc, pixelCrop, rotation, qualityRate) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // const maxSize = Math.max(image.width, image.height);
  // const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));


  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    if(data[i]+ data[i + 1] + data[i + 2] === 0){ 
        data[i + 3] = 0; // alpha
    }
  } 

  ctx.putImageData(imageData, 0, 0);

  // return canvas.toDataURL("image/jpeg");

  // return new Promise((resolve, reject) => {
  //   canvas.toBlob((file) => {
  //     resolve(URL.createObjectURL(file));
  //   }, "image/jpeg");
  // });

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", qualityRate));

  return blob
}

export const cropImage = async (image, croppedAreaPixels, rotation, qualityRate, onError) => {

  if(!qualityRate){
    qualityRate = 0.5
  }

  try {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation, qualityRate);
    return croppedImage;
  } catch (err) {
    onError(err);
  }
};
