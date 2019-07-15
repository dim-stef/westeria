import React, { Component,useState,useContext,useEffect } from "react";
import GroupChatMessage, { GroupChatMessageBox } from "../GroupChatMessage";
import {Messenger} from "../presentational/Messenger"
import {Desktop,Tablet,Mobile} from "../presentational/Responsive"
import { Link } from 'react-router-dom'
import {FrontPageLeftBar} from "../presentational/FrontPage"
import {UserContext,CachedBranchesContext} from "./ContextContainer"
import axios from "axios";

export function ChatRoomsContainer({inBox,match}){
    const [rooms,setRooms] = useState([]);
    const context = useContext(UserContext);

    console.log("context",context)
    async function getRooms(){
        let uri = `/api/branches/${context.currentBranch.uri}/chat_rooms/`;
        let response = await axios.get(uri);
        console.log(response);
        setRooms(response.data);
    }

    useEffect(() => {
        getRooms();
    },[])

    return(
        <WebSocketRooms rooms={rooms} inBox={inBox} match={match}/>
    )
}

function WebSocketRooms({rooms,inBox,match}){
    const [roomData,setRoomData] = useState([]);

    useEffect(()=>{
        let webSockets = rooms.map(r=>{
            return {
                room: r,
                ws: new WebSocket(`ws://${window.location.host}/ws/chat/${r.id}/`)
            }
        })
        setRoomData(webSockets);
    },[rooms])

    if(!inBox && roomData.length>0){
        if(!match.params.roomName){
            return <RoomsPreviewColumn roomData={roomData}/>
        }else{
            return <RoomContainer roomData={roomData} match={match}/>
        }
    }else{
        return(
            null
        )
    }
}

function RoomContainer({roomData,match}){
    let context = useContext(UserContext);
    let data = roomData.find(data=>data.room.id==match.params.roomName);
    let member = data.room.members.find(m=>{
        return context.branches.find(b=>b.uri==m)
    })
    const [author,setAuthor] = useState(member)
    const [messages,setMessages] = useState([]);

    async function getMessages(){
        let uri = `/api/branches/${member}/chat_rooms/${data.room.id}/messages/`
        let response = await axios.get(uri);
        console.log("response",response);
        setMessages(response.data.results.reverse());
    }

    useEffect(()=>{
        getMessages();
    },[])

    useEffect(()=>{
        setAuthor(context.currentBranch)
    },[context.currentBranch])

    function updateMessages(newMessage){
        setMessages([...messages,...newMessage]);
    }

    data.ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        let author_name = data['author_name'];
        let author_url = data['author_url'];
        let author = data['author'];
        let bundle = {
            message: message,
            author_name: author_name,
            author_url: author_url,
            author: author
        }

        updateMessages([bundle]);
        //self.el.scrollIntoView({ behavior: "instant" });
    };

    return(
        <PageWrapper>
            <div className="flex-fill main-column" style={{display:'relative',height:'-webkit-fill-available',
            flexFlow:'column',WebkitFlexFlow:'column'}}>
                <div style={{padding:'10px',marginBottom:'10px 0',borderBottom:'1px solid #e2eaf1'}}>
                    <span style={{fontWeight:'bold', fontSize:'2em'}}>{data.room.name}</span>
                </div>
                
                <div className="flex-fill" style={{padding:'10px',overflowY:'auto',flex:1,msFlex:1,WebkitFlex:1,
                flexFlow:'column',WebkitFlexFlow:'column'}}>
                    <Room messages={messages} branch={author.uri}/> 
                </div>
                <Messenger branch={author} ws={data.ws} room={data.room} roomId={data.room.id} updateMessages={updateMessages}/>
            </div>
        </PageWrapper>
        
    )
}

function Room({messages,branch}){

    return(
        messages.map(m=>{
            let containerStyle=null;
            let messageStyle={
                fontSize:'2em',wordBreak:'break-all',backgroundColor:'#e1e7ec',
                padding:'3px 6px',borderRadius:13,margin:'3px 0'
            };

            if(m.author_url == branch){
                containerStyle = {alignSelf:'flex-end'}
                messageStyle = {...messageStyle,backgroundColor:'#219ef3',color:'white'}
            }

            return (
                <div className="flex-fill" style={containerStyle}>
                    <span style={messageStyle}>{m.message}</span>
                </div>
            )
        })
    )
}

function RoomsPreviewColumn({roomData,isGroup,inBox}){
    return(
        <PageWrapper>
            <div className="main-column">
                {roomData.length>0?
                    roomData.map(data=>{
                        return <RoomPreview ws={data.ws} room={data.room}/>
                    })
                :<p>no rooms</p>}
            </div>
        </PageWrapper>
    )
}

function RoomPreview({room,ws,isGroup,inBox}){
    const userContext = useContext(UserContext)
    const cachedBranches = useContext(CachedBranchesContext);
    console.log(ws,room)
    let isCachedInFollowing = cachedBranches.following.find(b=>b.uri!=userContext.currentBranch.uri && room.members.includes(b.uri));
    let isCachedInForeign = cachedBranches.foreign.find(b=>b.uri!=userContext.currentBranch.uri && room.members.includes(b.uri));
    const [previewBranch,setPreviewBranch] = useState(isCachedInFollowing || isCachedInForeign);
    const [latestMessage,setLatestMessage] = useState(room.latest_message)

    async function getPreviewBranch(){
        let uri = room.members.find(uri=>uri!=userContext.currentBranch.uri);
        let response = await axios.get(`/api/branches/${uri}/`);
        cachedBranches.foreign.push(response.data);
        setPreviewBranch(response.data);
    }


    useEffect(()=>{
        if(!previewBranch){
            getPreviewBranch()
        }
    },[])

    ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        setLatestMessage(message);
        //self.el.scrollIntoView({ behavior: "instant" });
    };

    console.log("previewBranch",previewBranch)
    return(
        previewBranch?
            <Link to={`/messages/${room.id}`} className="flex-fill room-preview">
                <img className="round-picture" src={previewBranch.branch_image} style={{height:48,width:48,objectFit:'cover'}}></img>
                <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',padding:'0 10px',fontSize:'2em'}}>
                    <span style={{fontWeight:600,color:'#292929'}}>{previewBranch.name}</span>
                    <span style={{fontSize:'0.9em',color:'#708698'}}>{latestMessage}</span>
                </div>
            </Link>
        :null
    )
}

function PageWrapper({children}){
    return(
        <>
            <Desktop>
                <FrontPageLeftBar/>
                {children}
            </Desktop>
            <Tablet>
                {children}
            </Tablet>
            <Mobile>
                {children}
            </Mobile>
        </>
    )
}