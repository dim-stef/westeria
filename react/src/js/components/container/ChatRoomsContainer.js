import React, { useState,useContext,useEffect,useLayoutEffect,useCallback,useRef,lazy,Suspense } from "react";
import {isMobile} from 'react-device-detect';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {Images} from "../presentational/PostImageGallery"
import {Desktop,Tablet,Mobile} from "../presentational/Responsive"
import history from '../../history'
import { Link } from 'react-router-dom'
import Linkify from 'linkifyjs/react';
import { MoonLoader } from 'react-spinners';
import {Helmet} from 'react-helmet'
import {FrontPageLeftBar} from "../presentational/FrontPage"
import RoutedHeadline from "../presentational/RoutedHeadline"
import Messenger from "../presentational/Messenger"
import {useMyBranches} from "../container/BranchContainer"
import {UserContext,CachedBranchesContext,NotificationsContext} from "./ContextContainer"
import axios from "axios";


export function ChatRoomsContainer({inBox,match}){
    const [rooms,setRooms] = useState([]);
    const [loaded,setLoaded] = useState(false);

    const context = useContext(UserContext);

    async function getRooms(){
        let uri = `/api/branches/${context.currentBranch.uri}/chat_rooms/`;
        let response = await axios.get(uri);
        setRooms(response.data);
        setLoaded(true);
    }

    useEffect(() => {
        getRooms();
    },[context.currentBranch.uri])

    return(
        <>
        <Helmet>
            <title>Messages - Subranch</title>
            <meta name="description" content="Your messages." />
        </Helmet>
        <WebSocketRooms rooms={rooms} inBox={inBox} match={match} loaded={loaded} rooms={rooms} setRooms={setRooms}/>
        </>
    )
}

function WebSocketRooms({rooms,inBox,match,loaded,setRooms}){
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

    if(!inBox){
        if(!match.params.roomName){
            return <RoomsPreviewColumn roomData={roomData} loaded={loaded} rooms={rooms} setRooms={setRooms}/>
        }else{
            return roomData.length>0?<RoomContainer roomData={roomData} match={match}/>:null
        }
    }
}

function RoomContainer({roomData,match}){
    let context = useContext(UserContext);
    let data = roomData.find(data=>data.room.id==match.params.roomName);
    const previewBranch = usePreviewBranch(data.room);
    let member = data.room.members.find(m=>{
        return context.branches.find(b=>b.uri==m)
    })
    const [author,setAuthor] = useState(member)
    const [messages,setMessages] = useState([]);
    //let next = null;
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const [isFirstBatch,setFirstBatch] = useState(true);
    const [members,setMembers] = useState([]);
    const [heightWithKeyboard,setHeightWithKeyboard] = useState(0);
    const [heightWithoutKeyboard,setHeightWithoutKeyboard] = useState(window.innerHeight);
    const [height,setHeight] = useState(window.innerHeight);
    const ref = useRef(null);
    const parentRef = useRef(null);

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
        if(response.data.previous){
            setFirstBatch(false);
        }
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
        setFirstBatch(false);
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

    useEffect(()=>{
        if(heightWithKeyboard){
            setHeight(heightWithKeyboard);
        }
    },[heightWithKeyboard])

    function setHeightOnBlur(){
        setHeight(heightWithoutKeyboard);
    }

    function setHeightOnInput(){
        setHeightWithKeyboard(window.innerHeight);
    }

    function updateMessages(newMessage){
        //scrollToBottom();
        setMessages([...messages,...newMessage]);
    }

    function scrollToBottom(){
        parentRef.current.scrollTop = parentRef.current.scrollHeight;
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

    // if you are talking to yourself
    if(!previewName){
        previewName = member;
    }

    let image = data.room.personal?previewBranch?previewBranch.branch_image:null:data.room.image;
    let name = data.room.personal?previewBranch?previewBranch.name:'':data.room.name
    let headline = <div className="flex-fill center-items" style={{flex:'1 1 auto',WebkitFlex:'1 1 auto'}}>
        <img src={image} 
        className="round-picture" style={{height:32,width:32,objectFit:'cover'}}/>
        <span style={{fontWeight:'bold', fontSize:'2em',marginLeft:10,flex:'1 1 auto',WebkitFlex:'1 1 auto'}}>{name}</span>
        <DropdownOptions room={data.room}/>
    </div>
    return(
        <>
        <Helmet>
            <title>{name} - Subranch</title>
            <meta name="description" content={`${name} messages.`} />
        </Helmet>
        <PageWrapper>
            <div className="flex-fill big-main-column" ref={ref} style={{display:'relative',height:{height},
            flexFlow:'column',WebkitFlexFlow:'column',marginRight:0,flex:1,msFlex:1,WebkitFlex:1}}>
                <RoutedHeadline to="/messages">
                    {headline}
                </RoutedHeadline>
                <div ref={parentRef} className="flex-fill" style={{padding:'10px',overflowY:'auto',flex:1,msFlex:1,WebkitFlex:1,
                flexFlow:'column',WebkitFlexFlow:'column'}}>
                    <Room messages={messages} members={members} branch={author.uri} isFirstBatch={isFirstBatch} 
                    setFirstBatch={setFirstBatch}
                    parentRef={parentRef} wrapperRef={ref}/> 
                </div>
                <Messenger branch={author} ws={data.ws} room={data.room} roomId={data.room.id} scrollToBottom={scrollToBottom}
                    setHeightOnBlur={setHeightOnBlur} setHeightOnInput={setHeightOnInput}
                />
            </div>
        </PageWrapper>
        </>
    )
}

function Room({messages,members,branch,isFirstBatch,setFirstBatch,parentRef,wrapperRef}){

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

        return filtered;
    }

    useEffect(()=>{
        setMessageBoxes(getChatBoxes());
    },[messages])


    // handle automated scroll
    useLayoutEffect(()=>{
        if(parentRef.current){
            let diff = parentRef.current.scrollHeight - (parentRef.current.scrollTop + parentRef.current.clientHeight)
            if(diff < parentRef.current.clientHeight*0.5 || isFirstBatch){
                parentRef.current.scrollTop = parentRef.current.scrollHeight;
            }
        }
    })

    return(
        <>
        {messageBoxes.map(box=>{
            return <MessageBox key={box.created} parentRef={parentRef} members={members} 
            messageBox={box} branch={branch} imageWidth={imageWidth}/>
        })}
        </>
    )
}

function MessageBox({messageBox,members,branch,imageWidth,parentRef}){
    let containerStyle={};
    let messageStyle={
        fontSize:'1.6em',wordBreak:'break-word',backgroundColor:'rgba(225, 231, 236, 0.58)',
        padding:'8px 15px',borderRadius:25,margin:'1px 0',maxWidth:'70%'
    };

    if(messageBox.author_url == branch){
        containerStyle = {alignSelf:'flex-end',WebkitAlignSelf:'flex-end',
        justifyContent:'flex-end',WebkitJustifyContent:'flex-end'}
        messageStyle = {...messageStyle,backgroundColor:'#219ef3',color:'white'}
    }

    function getMediaWidth(m){
        let mediaWidth = 0;

        if(m.videos.length>0 || m.images.length>1){
            mediaWidth = '100%';
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

    let messageBoxHeader = messageBox.author_url == branch?(
        
        <div className="flex-fill" style={{...containerStyle,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
            <span style={{margin:'0 6px',fontSize:'1.3rem',fontWeight:500,color:'#4c4545'}}>{messageBox.author_name}</span>
            <img className="round-picture" src={memberImage} 
            style={{height:36,width:36,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}
            alt={`${messageBox.author_name}`}></img>
        </div>
    ):
    (
        <div className="flex-fill" style={{...containerStyle,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
            <img className="round-picture" src={memberImage} 
            style={{height:36,width:36,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}
            alt={`${messageBox.author_name}`}></img>
            <span style={{margin:'0 6px',fontSize:'1.3rem',fontWeight:500,color:'#4c4545'}}>{messageBox.author_name}</span>
        </div>
    )
    return (
        <div>
            <img/>
            <div className="flex-fill" style={{...containerStyle,flexFlow:'column',WebkitFlexFlow:'column'}}>
                {messageBoxHeader}
                <div className="flex-fill" style={{ padding:'10px 0',flexFlow:'column',WebkitFlexFlow:'column'}}>
                    {messageBox.messages.map(m=>{
                        return (
                            <React.Fragment key={m.created}>
                                {m.message?
                                        <div className="flex-fill" style={{...containerStyle,width:'100%'}}>
                                            <div style={messageStyle}>
                                                <Linkify>{m.message}</Linkify>
                                            </div>
                                        </div>
                                :null}
                                
                                {m.images.length>0 || m.videos.length>0?
                                    <div style={{...containerStyle,width:getMediaWidth(m)}}>
                                        <Images images={m.images} videos={m.videos} viewAs="reply" imageWidth={imageWidth}/>
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


function RoomsPreviewColumn({roomData,isGroup,inBox,loaded,rooms,setRooms}){
    
    return(
        <PageWrapper>
            <div className="main-column">
                {!loaded?
                <div className="flex-fill load-spinner-wrapper">
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={true}
                    />
                </div>:
                roomData.length>0?
                    roomData.map(data=>{
                        return <React.Fragment key={data.room.id}>
                            <RoomPreview ws={data.ws} room={data.room} key={data.room}/>
                        </React.Fragment>
                    }):<MutualFollowMessage/>
                }
                {loaded?
                    <>
                    <ConversationRequests rooms={rooms} setRooms={setRooms}/>
                    <Link to="/messages/create_conversation" style={{textDecoration:'none',borderBottom:'1px solid rgb(226, 234, 241)'}}
                    className="info-message flex-fill center-items">
                        <span>Create conversation</span>
                    </Link>
                    </>:null}
                
            </div>
        </PageWrapper>
    )
}

function ConversationRequests({rooms,setRooms}){
    const [requests,setRequests] = useState([]);
    const userContext = useContext(UserContext);

    async function getRequests(){
        let response = await axios.get(`/api/v1/branches/${userContext.currentBranch.uri}/conversation_invitations/`);
        let filtered = response.data.filter(r=>r.status=='on hold');
        setRequests(filtered);
    }

    useEffect(()=>{
        getRequests();
    },[])

    return(
        requests.map(r=>{
            return <React.Fragment key={r.id}>
            <ConversationRequestsPreview request={r} rooms={rooms} setRooms={setRooms}/>
            </React.Fragment>
        })
    )
}

function ConversationRequestsPreview({request,rooms,setRooms}){
    const userContext = useContext(UserContext);
    const [status,setStatus] = useState(request.status);

    async function getNewRoom(id){
        let uri = `/api/branches/${userContext.currentBranch.uri}/chat_rooms/${id}/`;
        let response = await axios.get(uri);
        setRooms([...rooms,response.data]);
    }

    useEffect(()=>{
        // if user accepted request wait for rooms to update then redirect
        // must check if room is loaded on state update
        if(status=='accepted' && rooms.some(r=>r.id==request.branch_chat.id)){
            history.push(`/messages/${request.branch_chat.id}`);
        }
    },[rooms])

    function updateRequest(event,status,branch,requestId){
        let uri = `/api/v1/branches/${branch.uri}/conversation_invitations/${requestId}/`;
        let data = {
            status:status
        }
        axios.patch(
            uri,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }).then(response => {
                let status = response.data.status;
                getNewRoom(request.branch_chat.id);
                setStatus(status);
            })
    }

    return(
        status=='on hold' || !status?
        <div className="flex-fill room-preview">
            <img className="round-picture" src={request.branch_chat.image} style={{height:48,width:48,objectFit:'cover'}}></img>
            <div className="flex-fill" 
            style={{flexFlow:'column',WebkitFlexFlow:'column',padding:'0 10px',fontSize:'2em',flex:'1 1 auto'}}>
                <span style={{fontWeight:600,color:'#292929'}}>{request.branch_chat.name}</span>
            </div>
            <div className="flex-fill">
                <button className="accept-btn"
                onClick={(e)=>updateRequest(e,'accepted',userContext.currentBranch,request.id)}>join</button>
                <button className="decline-btn" 
                onClick={(e)=>updateRequest(e,'declined',userContext.currentBranch,request.id)}>decline</button>
            </div>
        </div>
        :
        null
    )
}



function MutualFollowMessage(){
    return(
        <div className="info-message flex-fill center-items">
            <span>Mutually follow another person in order to message them</span>
        </div>
    )
}


function usePreviewBranch(room){
    const userContext = useContext(UserContext)
    const cachedBranches = useContext(CachedBranchesContext);
    const branches = useMyBranches();
    let isCachedInFollowing = cachedBranches.following.find(b=>b.uri!=userContext.currentBranch.uri && room.members.includes(b.uri));
    let isCachedInForeign = cachedBranches.foreign.find(b=>b.uri!=userContext.currentBranch.uri && room.members.includes(b.uri));
    const [previewBranch,setPreviewBranch] = useState(isCachedInFollowing || isCachedInForeign);

    async function getPreviewBranch(){
        let uri;
        let response;
        let data;
        uri = room.members.find(uri=>uri!=userContext.currentBranch.uri);
        if(uri){
            response = await axios.get(`/api/branches/${uri}/`);
            cachedBranches.foreign.push(response.data);
            data = response.data;
        }else{
            data = branches.find(b=>{
                return room.members.find(m=>m==b.uri);
            })            
        }
        setPreviewBranch(data);    
    }

    useLayoutEffect(()=>{
        if(!previewBranch){
            getPreviewBranch()
        }
    },[branches])

    return previewBranch
}

function RoomPreview({room,ws,isGroup,inBox}){
    const previewBranch = usePreviewBranch(room);
    const [latestMessage,setLatestMessage] = useState(room.latest_message)

    ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        setLatestMessage(message);
        //self.el.scrollIntoView({ behavior: "instant" });
    };


    return(
        <React.Fragment key={room.id}>
            <Link to={`/messages/${room.id}`} className="flex-fill room-preview">
                <img className="round-picture" src={room.personal?previewBranch?previewBranch.branch_image:null:room.image} 
                style={{height:48,width:48,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}></img>
                <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',padding:'0 10px',fontSize:'2em'}}>
                    <span style={{fontWeight:600,color:'#292929'}}>{room.personal?previewBranch?previewBranch.name:'':room.name}</span>
                    <span style={{fontSize:'0.7em',color:'#708698',wordBreak:'break-word'}}>{latestMessage}</span>
                </div>
            </Link>
        </React.Fragment>
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

import {DropdownActionList} from "../presentational/DropdownActionList"

function DropdownOptions({room}){
    const ref = useRef(null);
    const [clicked,setClicked] = useState(false);
    const userContext = useContext(UserContext);
    const isOwnerOfRoom = userContext.branches.some(b=>b.uri==room.owner)

    function handleClick(e){
        e.stopPropagation();
        setClicked(!clicked);
    }

    let actions = [];

    if(isOwnerOfRoom){
        actions = [...actions,{
            label:'Settings',
            action:()=>{
                history.push(`/messages/${room.id}/settings`)
            }
        },]
    }

    if(!room.personal){
        actions = [...actions,{
            label:'Invite members',
            action:()=>{
                history.push(`/messages/${room.id}/invite`)
            }
        },]
    }

    return(
        <>
        <DropdownActionList isOpen={clicked} setOpen={setClicked} actions={actions}
        style={{left:'auto',minWidth:'auto',fontSize:'1.4rem'}} onclick={(e)=>{handleClick(e)}}>
            <div ref={ref} style={{position:'relative'}} className="flex-fill">
                <MoreSvg className="more-icon"/>
            </div>
        </DropdownActionList>
        </>
    )
}

function MoreSvg({className}){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        width="30px"
        height="20px"
        viewBox="0 0 408 408"
        style={{ enableBackground: "new 0 0 408 408" }}
        xmlSpace="preserve"
        fill="rgba(0,0,0,0.75)"
        className={className}>
            <path d="M51 153c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm306 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm-153 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51z" />
        </svg>
    )
}
