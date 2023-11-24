import { useState, useEffect } from 'react'
  import MainHeader from '../../components/mainHeader/mainHeader';
  import useAuth from '../../hooks/useAuth';
  import ChatRoom from '../../components/chatroom/chatroom';
  
  
  const MessagesPage = () => {
  
    const { auth, setActiveTab } = useAuth();
    const loggedFirstName = auth.firstName;
    const loggedUserId = auth.userId;
    const profilePicURL = auth.profilePicURL;
    const roles = auth.roles;

    const [socket, setSocket] = useState("")
    const [socketConnected, setSocketConnected] = useState(false);  

    useEffect( () => {

      setActiveTab("chat")

    }, [])
  
      return (

        <div style={{height:'100svh', width:'100svw'}} 
                    className="bg-white bg-center max-w-full
                        flex flex-col fixed w-full">

        <MainHeader 
            loggedUserId={auth.userId} 
            profilePicURL={auth.profilePicURL} roles={auth.roles}
        />

        <div className='flex flex-row h-[100vh] pt-[7vh] sm:pt-[8vh] md:pt-[9vh]'>
            <ChatRoom loggedUserId={auth.userId} loggedFirstName={auth.firstName}
            profilePicURL={profilePicURL} socket={socket} socketConnected={socketConnected}/>
        </div>

        </div>
    )
  }

  export default MessagesPage