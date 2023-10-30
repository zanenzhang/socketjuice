import React, { useState, useEffect } from 'react';
import getPostComments from '../helpers/Comments/getPostComments';
import addPostComment from '../helpers/Comments/addPostComment';

function useGetPostComments(postId, commentsCount) {

    const [count, setCommentsCount] = useState(commentsCount);
    const [postNumber, setPostNumber] = useState(postId)
    const [postComments, setPostComments] = useState("")

    useEffect( () => {

        async function getComments(){
            const comments = await getPostComments(postNumber)

            if(comments){
                setPostComments(comments)
            }
        }

        getComments()

    }, [postNumber, count])

    return {postComments}
}




export default useGetPostComments