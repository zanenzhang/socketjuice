let cropArea = {};
let ctx = null;
let src = null;

export function getCanvas(canvas) {
  ctx = canvas;
  return canvas;
}

export function getCropArea(data) {
  cropArea = data;
  return data;
}

export function getImageSrc(source) {
  src = source;
  return source;
}

export default function canvas() {
  const img = new Image(200, 200);
  const { width = 200, height = 200, x = 0, y = 0 } = cropArea;

  img.onload = function () {
    ctx.clearRect(0, 0, 200, 200);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 200);
    ctx.drawImage(img, x, y, width, height, 0, 0, 200, 200);
  };

  img.src = src;
}
