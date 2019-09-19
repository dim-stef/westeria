import React, {useContext, useEffect} from "react";
import {NotificationsContext} from "../container/ContextContainer"
import { useMessageNotifications } from "../container/MessageNotificationsContainer";


export function Messages(){
    const notificationsContext = useContext(NotificationsContext);
    const messages = useMessageNotifications(); // returns null if not yea loaded

    useEffect(()=>{
        if(messages){
            notificationsContext.setNotifications([...messages,...notificationsContext.notifications])
        }
        
    },[messages])

    return (
        <MessageSvg/>
    )
}

const MessageSvg = props => (
    <div className="flex-fill" style={{borderRadius:'50%',overflow:'hidden',
    WebkitMaskImage:'-webkit-radial-gradient(white, black)'}}>
        <svg
        id="Layer_1"
        x="0px"
        y="0px"
        viewBox="0 0 260 260"
        xmlSpace="preserve"
        className="nav-icon"
        {...props}
        >
        <style>{".st0{fill:#212121}"}</style>
        <path
            className="st0"
            d="M219.8 204.6H40.2c-7.7 0-14-6.3-14-14V69.4c0-7.7 6.3-14 14-14h179.5c7.7 0 14 6.3 14 14v121.2c0 7.7-6.2 14-13.9 14zM40.2 65.4c-2.2 0-4 1.8-4 4v121.2c0 2.2 1.8 4 4 4h179.5c2.2 0 4-1.8 4-4V69.4c0-2.2-1.8-4-4-4H40.2z"
        />
        <path
            className="st0"
            d="M130 151.2c-9.7 0-18.9-3.8-25.8-10.7l-63-63.1c-2-2-2-5.1 0-7.1s5.1-2 7.1 0l63.1 63.1c5 5 11.6 7.7 18.7 7.7s13.7-2.7 18.7-7.7l63.1-63.1c2-2 5.1-2 7.1 0s2 5.1 0 7.1l-63.1 63.1c-7 6.9-16.2 10.7-25.9 10.7z"
        />
        <path
            className="st0"
            d="M44.7 191.1c-1.3 0-2.6-.5-3.5-1.5-2-2-2-5.1 0-7.1l49.4-49.4c2-2 5.1-2 7.1 0s2 5.1 0 7.1l-49.4 49.4c-1 1-2.3 1.5-3.6 1.5zM215.3 191.1c-1.3 0-2.6-.5-3.5-1.5l-49.4-49.4c-2-2-2-5.1 0-7.1s5.1-2 7.1 0l49.4 49.4c2 2 2 5.1 0 7.1-1.1 1-2.4 1.5-3.6 1.5z"
        />
        </svg>
    </div>
  );
