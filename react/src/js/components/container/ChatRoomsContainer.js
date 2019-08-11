import React, { useState,useContext,useEffect,useLayoutEffect,useCallback,useRef,lazy,Suspense } from "react";
import {isMobile} from 'react-device-detect';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {Images2} from "../presentational/PostImageGallery"
import {Desktop,Tablet,Mobile} from "../presentational/Responsive"
import { Link } from 'react-router-dom'
import {FrontPageLeftBar} from "../presentational/FrontPage"
import RoutedHeadline from "../presentational/RoutedHeadline"
import Messenger from "../presentational/Messenger"
import {UserContext,CachedBranchesContext} from "./ContextContainer"
import axios from "axios";


export function ChatRoomsContainer({inBox,match}){
    const [rooms,setRooms] = useState([]);
    const context = useContext(UserContext);

    async function getRooms(){
        let uri = `/api/branches/${context.currentBranch.uri}/chat_rooms/`;
        let response = await axios.get(uri);
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
        connect();
    },[rooms])

    function connect(){
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        let webSockets = rooms.map(r=>{
            let ws = new ReconnectingWebSocket(`${ws_scheme}://${window.location.host}/ws/chat/${r.id}/`);
            
            return {
                room: r,
                ws: ws
            }
        })
        setRoomData(webSockets);
    }

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
    //let next = null;
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const [members,setMembers] = useState([]);
    const ref = useRef(null);
    const parentRef = useRef(null);
    const [freshState,setFreshState] = useState(0);

    async function getMembers(){
        let memberList = [];

        for (const member of data.room.members){
            let response = await axios.get(`/api/branches/${member}/`);
            let memberData = await response.data;
            memberList.push(memberData);
        }
        setMembers(memberList);
    }


    const getMessages = useCallback(async (messages)=>{

        if(!hasMore){
            return;
        }
        
        let uri = next?next:`/api/branches/${member}/chat_rooms/${data.room.id}/messages/`;
        let response = await axios.get(uri);
        if(!response.data.next){
            setHasMore(false);
        }
        let newMessages = response.data.results.reverse()
        setNext(response.data.next)
        setMessages([...newMessages,...messages]);
    },[messages])

    const chatScrollListener = async () =>{
        if(parentRef.current.scrollTop==0){
            await getMessages(messages);
        }
        //setScrollPosition(parentRef.current.scrollTop);
    }

    useEffect(()=>{
        getMessages(messages);
        getMembers();
    },[])

    useEffect(()=>{
        parentRef.current.addEventListener('scroll',chatScrollListener)

        return ()=>{
            parentRef.current.removeEventListener('scroll',chatScrollListener)
        }
    },[messages])

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
        let images = data['images'];
        let videos = data['videos'];
        let bundle = {
            message: message,
            author_name: author_name,
            author_url: author_url,
            author: author,
            images: Array.isArray(images)?images:JSON.parse(images),
            videos: Array.isArray(videos)?videos:JSON.parse(videos)
        }
        updateMessages([bundle]);
    };

    let previewName = data.room.members.find(uri=>uri!=context.currentBranch.uri);

    return(
        <PageWrapper>
            <div className="flex-fill big-main-column" ref={ref} style={{display:'relative',height:'-webkit-fill-available',
            flexFlow:'column',WebkitFlexFlow:'column',marginRight:0}}>
                <RoutedHeadline headline={'@' + previewName}/>
                <div ref={parentRef} className="flex-fill" style={{padding:'10px',overflowY:'auto',flex:1,msFlex:1,WebkitFlex:1,
                flexFlow:'column',WebkitFlexFlow:'column'}}>
                    <Room messages={messages} members={members} branch={author.uri} parentRef={parentRef} wrapperRef={ref}/> 
                </div>
                <Messenger branch={author} ws={data.ws} room={data.room} roomId={data.room.id} updateMessages={updateMessages}/>
            </div>
        </PageWrapper>
        
    )
}

function Room({messages,members,branch,parentRef,wrapperRef}){

    const [imageWidth,setImageWidth] = useState(0);
    const [messageBoxes,setMessageBoxes] = useState([]);

    useEffect(() => {
        if(parentRef.current){
            setImageWidth(parentRef.current.clientWidth)
        }
        
    },[parentRef])

    useEffect(()=>{
        if(wrapperRef){
            if(isMobile){
                wrapperRef.current.classList.add('full-height');
            }else{
                wrapperRef.current.style.height = `${window.innerHeight - 70}px`;
            }
        }
    },[messageBoxes])

    function getChatBoxes(){
        var chatBox = {
            author: null,
            author_name: null,
            author_url: null,
            created:null,
            messages: []
        };
        var messageBoxes = messages.map((m, i) => {
            var nextAuthor = null;
            chatBox.author = m.author;
            chatBox.author_name = m.author_name;
            chatBox.author_url = m.author_url;
            chatBox.created = m.created;
            chatBox.messages.push(m)

            if (i < messages.length - 1) {
                nextAuthor = messages[i + 1].author_url
            }

            if (m.author_url !== nextAuthor) {
                var copy = Object.assign({}, chatBox);
                chatBox.author_url = null;
                chatBox.messages = [];
                return copy;
            }
            return null;
        })
        var filtered = messageBoxes.filter(function (el) {
            return el != null;
        });
        /*messageBoxes = filtered.map(m => {
            return <MessageBox messageBox={m} key={m.created}/>
        })*/
        return filtered;
    }

    useEffect(()=>{
        setMessageBoxes(getChatBoxes());
    },[messages])

    return(

        messageBoxes.map(box=>{
            return <MessageBox key={box.created} parentRef={parentRef} members={members} 
            messageBox={box} branch={branch} imageWidth={imageWidth}/>
        })
    )
}

function MessageBox({messageBox,members,branch,imageWidth,parentRef}){
    let containerStyle={};
    let messageStyle={
        fontSize:'2em',wordBreak:'break-all',backgroundColor:'#e1e7ec',
        padding:'3px 6px',borderRadius:13,margin:'3px 0'
    };

    if(messageBox.author_url == branch){
        containerStyle = {alignSelf:'flex-end'}
        messageStyle = {...messageStyle,backgroundColor:'#219ef3',color:'white'}
    }

    useLayoutEffect(()=>{
        parentRef.current.scrollTop = parentRef.current.scrollHeight;
    },[])

    

    function getMediaWidth(m){
        let mediaWidth = 0;

        if(m.videos.length>0 || m.images.length>1){
            mediaWidth = imageWidth
        }else{
            let minWidth = 0.2 * imageWidth;
            let maxWidth = 0.7 * imageWidth;
            if(m.images[0].width > maxWidth){
                mediaWidth = maxWidth;
            }else if(m.images[0].width < minWidth){
                mediaWidth = minWidth;
            }else{
                mediaWidth = m.images[0].width;
            }
        }
        return mediaWidth;
    }

    let member = members.find(m=>messageBox.author_url==m.uri)
    let memberImage = member?member.branch_image:null
    return (
        <div>
            <img/>
            <div className="flex-fill" style={{...containerStyle,flexFlow:'column'}}>
                <div style={containerStyle}>
                    <img className="round-picture" src={memberImage} 
                    style={{height:48,width:48,objectFit:'cover'}} alt={`${messageBox.author_name}`}></img>
                </div>
                <div className="flex-fill" style={{ padding:'10px 0',flexFlow:'column'}}>
                    {messageBox.messages.map(m=>{
                        return (
                            <React.Fragment key={m.created}>
                                {m.message?
                                <div className="flex-fill" style={containerStyle}>
                                    <span style={messageStyle}>{m.message}</span>
                                </div>:null}
                                
                                {m.images.length>0 || m.videos.length>0?
                                    <div style={{...containerStyle,width:getMediaWidth(m)}}>
                                        <Images2 images={m.images} videos={m.videos} viewAs="reply" imageWidth={imageWidth}/>
                                    </div>
                                :null}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    )
    
}


function RoomsPreviewColumn({roomData,isGroup,inBox}){
    return(
        <PageWrapper>
            <div className="main-column">
                {roomData.length>0?
                    roomData.map(data=>{
                        return  <RoomPreview ws={data.ws} room={data.room} key={data.room}/>
                    })
                :<><MutualFollowMessage/></>}
                <MutualFollowMessage/>
            </div>
        </PageWrapper>
    )
}

function MutualFollowMessage(){
    return(
        <div className="flex-fill center-items" style={{fontSize:'2rem',color:'#95a6b5',padding:10}}>
            <span>Mutually follow another person in order to message them</span>
        </div>
    )
}

function RoomPreview({room,ws,isGroup,inBox}){
    const userContext = useContext(UserContext)
    const cachedBranches = useContext(CachedBranchesContext);
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