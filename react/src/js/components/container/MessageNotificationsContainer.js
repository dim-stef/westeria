import React, { useEffect, useState} from "react";
import axios from 'axios'

export function useMessageNotifications(){
    const [messages,setMessages] = useState(null);

    async function getMessages(){
        let uri = `/api/message_notifications/`;
        let response = await axios.get(uri);
        setMessages(response.data);
    }

    useEffect(()=>{
        getMessages();
    },[])

    return messages;
}