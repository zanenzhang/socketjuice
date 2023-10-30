import React from "react";
import Camera from "react-html5-camera-photo";
// import 'react-html5-camera-photo/build/css/index.css';
import './camera.css';
import './circleButton.css';

const TakePhoto = ({ onTakePhoto, camSwitch }) => {

  // const [size, setSize] = useState({
  //   x: 0,
  //   y: 0
  // });

  // const updateSize = () =>
  //   setSize({
  //     x: window.innerWidth,
  //     y: window.innerHeight
  //   });
  //   useEffect(() => (window.onresize = updateSize), []);

  //   useEffect( ()=> {

  //     console.log(size)

  //   }, [size])

  return (
    <div className="rounded-lg">
    <Camera 
        onTakePhoto={onTakePhoto}    
        sizeFactor={1.0} 
        // idealResolution={{width: (size.x-30), height: (size.x-30)}}
        idealFacingMode={camSwitch}
        />
      </div>
  );
};

export default TakePhoto
