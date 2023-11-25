import React from "react";
import { DEFAULT_IMAGE_PATH } from "../../../constants/paths";
import { formatDistanceToNowStrict } from 'date-fns';

const ChatContact = ({chatItem, loggedUserId }) => {
  
  return (
    <div className="w-full flex flex-col">
      
      <div className="pl-4 flex flex-row items-center m-2" >

        <div className="flex flex-row gap-x-2">

              {chatItem.participants ? chatItem.participants.map((item)=>(
                  
                  (item._userId !== loggedUserId && (
                  <div key={item._userId} className="flex flex-row pr-2"> 
                    <img className="rounded-full w-9 mr-3"
                        src={item.userInfo.profilePicURL}
                        onError={(e) => {
                          e.target.src = DEFAULT_IMAGE_PATH;
                          }}
                    />
                    <div className="flex flex-row pr-3 pt-1">
                      <span className="text-lg">{item?.userInfo?.firstName?.slice(0,20)}{item?.userInfo?.firstName?.length > 20 ? '...' : null}</span>
                    </div>
                </div>))

                )) : null }

            </div>

      </div>

      <div className="pl-1">

      {(chatItem?.mostRecentMessage?.content) &&

          <div>
              <div className="flex flex-col pl-6 justify-start">
                  <div className="flex flex-wrap break-all ">
                      {chatItem.mostRecentMessage._userId === loggedUserId ? 
                          (<span>{"You:"} &nbsp;</span>) :   
                          <span>{chatItem.mostRecentMessage.firstName.slice(0,20)}: &nbsp;</span>                                     
                      }
                      <span>{chatItem.mostRecentMessage.content.slice(0,20)}{chatItem.mostRecentMessage.content.length > 20 ? '...' : null}</span>
                  </div>
                  <div className="flex flex-row text-sm">
                      {chatItem.lastUpdated && <p>{formatDistanceToNowStrict(new Date(chatItem.lastUpdated),{addSuffix: true})}</p>}
                  </div>
              </div>
              
          </div>
          }
      </div>
    </div>
  );
};

export default ChatContact;
