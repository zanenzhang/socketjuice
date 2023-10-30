import React, { useState, useEffect, useRef } from 'react';
import { Player, Controls } from '@lottiefiles/react-lottie-player';
import animationData from "../../../../animations/typingAnimation.json";

export default function TypingLine({othersTyping, loggedUsername}){

    const [typingSwitch, setTypingSwitch] = useState(false);
    const typingRef = useRef(null);

    useEffect( ()=> {

        if(othersTyping !== loggedUsername){
            
            if(othersTyping){
                setTypingSwitch(true);
                
            } else {
                setTypingSwitch(false);
                
            }
        }

    }, [othersTyping])


    useEffect(() => {
    
        typingRef.current?.scrollIntoView({ behavior: 'smooth' });    
      
    }, [typingSwitch]);


    return (

        <div id="typingLottie" ref={typingRef}>
    
            {typingSwitch &&
                <div className='flex flex-row justify-center items-center pb-4'>
                <p className="text-base">{`${othersTyping} is typing`}</p>            
                <Player        
                    autoplay={true}
                    loop={true}
                    src={animationData}
                    style={{ height: '50px', width: '50px' }}
                    >
                        <Controls visible={false} />
                </Player>
                </div>
            }
        
        </div>

    )

}

// \u00A0