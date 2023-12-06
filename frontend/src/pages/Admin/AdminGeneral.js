import React, { useState, useEffect, useRef, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import { Link, useNavigate } from "react-router-dom";
import MainHeader from '../../components/mainHeader/mainHeader';
import debounce from 'lodash.debounce';
import Box from "@material-ui/core/Box";
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import getAllFlags from '../../helpers/Flags/getAllFlags';
import addCommentFlag from '../../helpers/Flags/addCommentFlag';
import clearCommentFlags from '../../helpers/Flags/clearCommentFlags';
import removePostComment from '../../helpers/Comments/removePostComment';

import addPostFlag from '../../helpers/Flags/addPostFlag';
import clearPostFlags from '../../helpers/Flags/clearPostFlags';
import removeSingleReviewPost from '../../helpers/PostData/removeSingleReviewPost';

import addUserFlag from '../../helpers/Flags/addUserFlag';
import clearUserFlags from '../../helpers/Flags/clearUserFlags';
import addUserBan from '../../helpers/Bans/addUserBan';
import removeUserBan from '../../helpers/Bans/removeUserBan';

import addProductFlag from '../../helpers/Flags/addProductFlag';
import clearProductFlags from '../../helpers/Flags/clearProductFlags';
import addProductBan from '../../helpers/Bans/addProductBan';
import removeProductBan from '../../helpers/Bans/removeProductBan';

// import getUsersPrefix from '../../helpers/UserData/getUsersPrefix';
import getUsersPrefixElastic from "../../helpers/UserData/getUsersPrefixElastic";
import editInfluencerRating from '../../helpers/UserData/editInfluencerRating';


const AdminGeneral = () => {

    const { auth } = useAuth();
    const loggedUsername = auth.username;
    const loggedUserId = auth.userId;
    const profilePicURL = auth.profilePicURL;
    const roles = auth.roles;
    const navigate = useNavigate();

    const usernameRef = useRef();
    const USERNAME_REGEX = /^[a-zA-Z0-9\._-]{0,16}$/;
    
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState("");
    const [selectedUser, setSelectedUser] = useState("");

    const [influencerRating, setInfluencerRating] = useState(0);

    const [validUsername, setValidUsername] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);

    const [openPopover, setOpenPopover] = useState(false);

    const [flaggedPosts, setFlaggedPosts] = useState([]);
    const [productPosts, setProductPosts] = useState([]);
    const [flaggedComments, setFlaggedComments] = useState([]);
    const [flaggedUsers, setFlaggedUsers] = useState([]);
    const [flaggedProducts, setFlaggedProducts] = useState([]);
    var waiting = false;
    const [changed, setChanged] = useState(false);

    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpenPopover = (event) => {
        setAnchorEl(usernameRef.current);
    };

    const handleClosePopover = () => {
        setOpenPopover(false)
    };

    const changeHandler = (event) => {
        if(username?.length > 16){
            return
        }
        setUsername(event.target.value);
        handleOpenPopover(event);
      };

    const debouncedChangeHandler = useMemo(
        () => debounce(changeHandler, 500)
      , []);


    useEffect(() => {
        setValidUsername(USERNAME_REGEX.test(username))
    },[username])


    useEffect( ()=> {

        async function getData(){

            const flagData = await getAllFlags(loggedUserId, auth.accessToken)

            if(flagData){

                if(flagData.flaggedPosts){

                    for(let i=0; i<flagData.flaggedPosts?.length; i++){

                        for(let j=0; j<flagData.postUsers?.length; j++){

                            if(flagData.flaggedPosts[i]._userId === flagData.postUsers[j]._id){
                                flagData.flaggedPosts[i].username = flagData.postUsers[j].username
                                if(Object.values(flagData.postUsers[j].roles).includes(3780)){
                                    flagData.flaggedPosts[i].userOrStore = 2;
                                } else {
                                    flagData.flaggedPosts[i].userOrStore = 1;
                                }
                            }
                        }
                    }

                    setFlaggedPosts(flagData.flaggedPosts)
                }
                if(flagData.flaggedComments){
                    setFlaggedComments(flagData.flaggedComments)
                }
                if(flagData.flaggedProducts){
                    setFlaggedProducts(flagData.flaggedProducts)
                }
                if(flagData.productPosts){
                    
                    for(let i=0; i<flagData.productPosts?.length; i++){

                        for(let j=0; j<flagData.postProductUsers?.length; j++){

                            if(flagData.productPosts[i]._userId === flagData.postProductUsers[j]._id){
                                flagData.productPosts[i].username = flagData.postProductUsers[j].username
                                if(Object.values(flagData.postProductUsers[j].roles).includes(3780)){
                                    flagData.productPosts[i].userOrStore = 2;
                                } else {
                                    flagData.productPosts[i].userOrStore = 1;
                                }
                            }
                        }
                    }

                    setProductPosts(flagData.productPosts)
                }
                if(flagData.flaggedUsers){
                    setFlaggedUsers(flagData.flaggedUsers)
                }
            }
        }

        if(Object.values(roles).includes(5150) && auth.userId && changed > 0){

            getData();
        }

    }, [roles, auth.userId, changed])


    useEffect( () => {

        async function fetchData(){

            if(username.length > 0){
                const response = await getUsersPrefixElastic(username, loggedUsername, auth.accessToken, loggedUserId)
    
                if (response){
                    console.log(response.data)
                    setUsers(response.data)
                }
            }
        }

        fetchData();

    }, [username])
    

    useEffect( ()=> {

        if(users.length > 0){
            setOpenPopover(true)
        }

    }, [users])

    useEffect(() => {
        return () => {
          debouncedChangeHandler.cancel();
        }
      }, []);


    async function handleRemoveComment(item){

        if(waiting){
            return
        }

        waiting = true;

        const cleared = await clearCommentFlags(auth.userId, item._id, auth.accessToken )
        
        if(cleared){
            const removed = await removePostComment(item._id, item.isReply, item._originalCommentId, item._postId, auth.accessToken, auth.userId)
            if(removed){
                waiting = false;;
                setChanged(changed + 1)
            }
        }
    }

    async function handleClearCommentFlags(item){

        if(waiting){
            return
        }

        waiting = true;

        const removed = await clearCommentFlags(loggedUserId, item._id, auth.accessToken )
        if(removed){
            waiting = false;;
            setChanged(changed + 1)
        }

    }

    async function handleRemovePost(item){

        if(waiting){
            return
        }

        waiting = true;

        const clearedPost = await clearPostFlags(auth.userId, item._id, auth.accessToken )
        if(clearedPost){
            const deletedPost = await removeSingleReviewPost(item._id, item._userId, item._productId, item.userOrStore, auth.accessToken, auth.userId)
            if(deletedPost){
                waiting = false;;
                setChanged(changed + 1);
            }
        }
    }

    async function handleClearPostFlags(item){

        if(waiting){
            return
        }

        waiting = true;

        const removed = await clearPostFlags(loggedUserId, item._id, auth.accessToken )
        if(removed){
            waiting = false;;
            setChanged(changed + 1);
        }

    }

    async function handleBanUser(item){

        if(waiting){
            return
        }

        waiting = true;

        const cleared = await clearUserFlags(loggedUserId, item._id, auth.accessToken )
        
        if(cleared){

            const banned = await addUserBan(loggedUserId, item._id, auth.accessToken)

            if(banned){
                waiting = false;;
                setChanged(changed + 1);
            }
        }
    }

    async function handleClearUserFlags(item){

        if(waiting){
            return
        }

        waiting = true;

        const removed = await clearUserFlags(loggedUserId, item._id, auth.accessToken )
        if(removed){
            waiting = false;;
            setChanged(changed + 1);
        }

    }

    async function handleBanProduct(item){

        if(waiting){
            return
        }

        waiting = true;

        const cleared = await clearProductFlags(auth.userId, item._id, auth.accessToken )

        if(cleared){
            const banned = await addProductBan(auth.userId, item._id, auth.accessToken )
            if(banned){
                waiting = false;;
                setChanged(changed + 1);
            }
        }
    }

    async function handleClearProductFlags(item){

        if(waiting){
            return
        }

        waiting = true;

        const removed = await clearProductFlags(loggedUserId, item._id, auth.accessToken )
        if(removed){
            waiting = false;;
            setChanged(changed + 1);
        }
    }

    const selectUser = (user) => {

        const data = JSON.parse(user) 

        if(user){
            setInfluencerRating(data.influencerRating)
            setSelectedUser(data);
        }
        setOpenPopover(false);

    }

    const adjustRating = (event) => {

        event.preventDefault();

        async function changeRating() {

            const changed = await editInfluencerRating(auth.userId, selectedUser.userId, influencerRating, auth.accessToken)
            
            if(changed){
                setSelectedUser("")   
            }
        }

        changeRating()
    }

    const handleRemoveBan = (event) => {

        event.preventDefault();

        async function removeBan() {

            const changed = await removeUserBan(auth.userId, selectedUser.userId, auth.accessToken)
            
            if(changed){
                setSelectedUser("")  
            }
        }

        removeBan()
         
    }


    return (
        <section>
            <div className="bg-gray-background">
            <MainHeader 
                loggedUserId={loggedUserId} loggedUsername={loggedUsername} 
                profilePicURL={profilePicURL} roles={roles}
                />
            </div>

            <div className='flex flex-col items-start pl-12 pt-[8vh] sm:pt-[10vh] md:pt-[12vh]'>

                <div className='w-full flex justify-start py-4'>
                    <p className='text-xl font-bold underline'>Admin Panel</p>
                </div>

                <div className='py-8 flex flex-col'>
                    <p className='text-lg font-bold'>Flagged Comments</p>
                    {flaggedComments?.length > 0 && flaggedComments.map(item=>(

                        <div key={item._id} className='flex flex-col border-y-2 py-2 my-4'>

                            <p className='py-1'>Comment content: {item.content}</p>
                            <p className='py-1'>Comment username: {item.username}</p>

                            <div className='flex flex-row p-2 gap-x-4 justify-center'>

                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleRemoveComment(item)}>Delete Comment</button>
                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleClearCommentFlags(item)} >Clear Flags</button>

                            </div>

                        </div>

                    ))}
                </div>

                <div className='py-8 flex flex-col'>
                    <p className='text-lg font-bold'>Flagged Posts</p>
                    {flaggedPosts?.length > 0 && flaggedPosts.map(item=>(

                        <div key={item._id} className="flex flex-col border-y-2 py-2 my-4">

                            <div className='flex flex-col justify-center items-center flex-shrink-0'>
                                <p className='py-1'>Caption: {item.caption}</p>
                                <p className='py-1'>Description: {item.description}</p>
                                <p className='py-1'>Post Username: {item.username}</p>
                                <img src={item.previewMediaURL} className="w-[100px]" />
                            </div>

                            <div className='flex flex-row p-2 gap-x-4 justify-center'>

                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleRemovePost(item)}>Delete Post</button>
                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleClearPostFlags(item)}>Clear Flags</button>

                            </div>

                        </div>

                    ))}
                </div>


                <div className='py-8 flex flex-col'>
                    <p className='text-lg font-bold'>Flagged Products</p>
                    {flaggedProducts?.length > 0 && flaggedProducts.map(item=>(

                        <div key={item._id} className="flex flex-col border-y-2 py-2 my-4">

                            <div className='flex flex-col justify-center items-center flex-shrink-0'>
                                <p>Product name: {item.productname}</p>
                                <p>Brand: {item.brand}</p>
                                <p>Flags Count: {item.flagsCount}</p>
                            </div>
                            
                            <div className='flex flex-row p-2 gap-x-4'>
                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleBanProduct(item)}>Ban Product</button>
                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleClearProductFlags(item)}>Clear Flags</button>
                            </div>

                        </div>

                        ))}
                </div>

                <div className='py-8 flex flex-col'>

                    <p className='text-lg font-bold'>Flagged Products - Product Posts</p>
                    <p className='text-base font-bold'>Delete posts before clearing product flags</p>

                    {productPosts?.length > 0 && productPosts.map(post => (

                        <div key={post._id} className="flex flex-col border-y-2 py-2 my-4">
                        <div className="flex flex-col justify-center items-center flex-shrink-0">
                            <p className='py-1'>Product name: {post.productname}</p>
                            <p className='py-1'>Caption: {post.caption}</p>
                            <p className='py-1'>Description: {post.description}</p>
                            <p className='py-1'>Post Id: {post._id}</p>
                            <p className='py-1'>Post Username: {post.username}</p>
                            <img src={post.previewMediaURL} className="w-[100px]" />

                            <div className='flex flex-row p-2 gap-x-4'>

                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleRemovePost(post)}>Delete Post</button>
                            </div>
                        </div>
                        </div>

                        ))}
                </div>


                <div className='py-8 flex flex-col'>
                    <p className='text-lg font-bold'>Flagged Users</p>

                    {flaggedUsers?.length > 0 && flaggedUsers.map(item=>(

                        <div key={item._id} className="flex flex-col ">

                            <div className='flex flex-col p-2 border-y-2 justify-center items-center flex-shrink-0'>
                            {Object.values(item.roles).includes(3780) ?

                            <Link to={`/profile/store/${item.username}`}>
                                <p className='pb-1'>{item.username}</p>
                            </Link>
                            :

                            <Link to={`/profile/item/${item.username}`}>
                                <p className='pb-1'>{item.username}</p>
                            </Link>

                            }   

                            <img src={item.profilePicURL} className="w-[100px]" />
                            </div>

                            <div className='flex flex-row p-2 gap-x-4'>

                                {item.deactivated && <p className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300'>User Already Banned</p>}
                                {!item.deactivated && <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleBanUser(item)}>Ban User</button>}
                                <button className='px-4 py-1 rounded-xl border border-gray-300 hover:bg-gray-300' onClick={()=>handleClearUserFlags(item)}>Clear Flags</button>

                            </div>

                        </div>

                    ))}
                </div>

                <div className='py-8 flex flex-col'>

                    <p className='text-lg font-bold'>User Search / Influencer Ratings</p>

                    <input 
                        aria-label="Enter username" 
                        type="username" 
                        ref={usernameRef}
                        id="usernameinput"
                        placeholder="Enter username"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ debouncedChangeHandler }
                        disabled={!validUsername}
                        aria-invalid={validUsername ? "false" : "true"}
                        aria-describedby="usernamenote"
                        onFocus={() => setUsernameFocus(true)}
                        onBlur={() => setUsernameFocus(false)}
                        required
                    />

                    <div aria-label="followers display">
                        <Popover
                            open={openPopover}
                            anchorEl={anchorEl}
                            onClose={handleClosePopover}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                        >

                        <List sx={{
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'auto',
                            maxHeight: 300,
                            width: {xs: 300, sm: 350, md: 400},
                        }}>

                        <select  className='px-4 w-[300px] sm:w-[350px] md:w-[400px]'
                            onClick={(event)=>{selectUser(event.target.value)}}>
                        
                        { (users?.length > 0) &&
                        
                        users
                        .filter( (user) => user._id !== loggedUserId)
                        .map( (user) => 
                        
                        <option key={user._id} className='flex justify-between flex-grow' value={JSON.stringify({userId:user._id, username:user.username, profilePicURL:user.profilePicURL, influencerRating: user.influencerRating})}>
                        
                            {user.username}
                                        
                        </option>

                          )}

                        </select>

                        </List> 
                        
                        </Popover>

                    </div>

                    
                    {selectedUser && 
                    
                    <div className='flex flex-row items-center gap-x-3'>

                        <div className='flex flex-col'>
                        <p>{selectedUser.userId}</p>
                        <p>{selectedUser.username}</p>
                        <img src={selectedUser.profilePicURL} className="w-[100px]"/>
                        <p>rating:{selectedUser.influencerRating}</p>
                        </div>

                        <div className="flex flex-col justify-center items-center pl-6">
                        <select className="pl-6 w-30 md:w-40 h-9 border border-gray-primary rounded" 
                        value={influencerRating}
                        onChange={(event) => {
                            setInfluencerRating(event.target.value);
                        }}>
                        <option value={0}>0 / 5</option>
                        <option value={1}>1 / 5</option>
                        <option value={2}>2 / 5</option>
                        <option value={3}>3 / 5</option>
                        <option value={4}>4 / 5</option>
                        <option value={5}>5 / 5</option>
                        </select>
                    </div>  

                    <div className='flex flex-col gap-y-2'>
                        <button className='px-4 py-2 bg-gray-200 rounded-xl'
                            onClick={(event)=>adjustRating(event)}>
                            Adjust influencer rating
                        </button>

                        <button className='px-4 py-2 bg-gray-200 rounded-xl'
                            onClick={(event)=>handleRemoveBan(event)}>
                            Remove Ban
                        </button>
                    </div>
                        
                    </div>}
                </div>

                <div className='py-12'>

                </div>

            </div>

        </section>
    )
}

export default AdminGeneral
