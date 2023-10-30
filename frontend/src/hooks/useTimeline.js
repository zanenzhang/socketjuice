import React, { useState, useEffect } from 'react';
import getUserTimeline from "../helpers/UserData/getUserTimeline";

async function useGetTimeline(userId) {

    const [timeline, setTimeline] = useState(null);    

    useEffect( () => {
        
        async function getTimeline(){

            let posts = await getUserTimeline(userId)
            setTimeline(posts)
        }

        getTimeline();

    }, [])

    return {timeline};
}

export default useGetTimeline