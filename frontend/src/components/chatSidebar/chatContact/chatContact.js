import React from "react";
import { DEFAULT_IMAGE_PATH } from "../../../constants/paths";

const ChatContact = ({chatItem, loggedUserId }) => {
  
  return (
    <div className="w-full flex flex-row">
      <div className="pl-2 flex flex-row items-center m-2" >

        <div className="flex flex-row gap-x-2">

                {chatItem.participants ? chatItem.participants.map((item)=>(
                  
                  (item._userId !== loggedUserId && (
                  <div key={item._userId} className="flex flex-row pr-2"> 
                    <img className="rounded-full w-8 mr-2"
                        src={item.userInfo.profilePicURL}
                        onError={(e) => {
                          e.target.src = DEFAULT_IMAGE_PATH;
                          }}
                    />
                    <div className="flex flex-row pr-6">
                      <span className="font-md">{item?.firstName?.slice(0,20)}{item?.firstName?.length > 20 ? '...' : null}</span>
                    </div>
                </div>))

                )) : null }

            </div>

      </div>
    </div>
  );
};

export default ChatContact;
