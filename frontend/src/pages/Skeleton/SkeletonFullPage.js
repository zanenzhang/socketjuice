import React from "react";
import Skeleton from "react-loading-skeleton";

const SkeletonFullPage = () => {
    return (
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', 
      alignItems: 'center', width: "100%"}} 
      
      className="flex flex-col gap-y-2 w-full  md:px-5 lg:px-10 pt-2">
        
            <div className="w-full">
                <Skeleton height={40} width={2000} />
            </div>

            <div className="w-full h-full flex justify-center items-center">
                <Skeleton height={300} width={300}/>
            </div>
        
      </div>
    );
  };

  export default SkeletonFullPage;