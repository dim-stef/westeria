import React, { useState,useContext,useEffect,useLayoutEffect,useCallback,useRef,lazy,Suspense } from "react";
import {isMobile} from 'react-device-detect';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {Images} from "../presentational/PostImageGallery"
import {Desktop,Tablet,Mobile} from "../presentational/Responsive"
import history from '../../history'
import { Link } from 'react-router-dom'
import { MoonLoader } from 'react-spinners';
import {Helmet} from 'react-helmet'
import {FrontPageLeftBar} from "../presentational/FrontPage"
import RoutedHeadline from "../presentational/RoutedHeadline"
import Messenger from "../presentational/Messenger"
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
    },[])

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

    let headline = <div className="flex-fill center-items">
        <img src={data.room.image} className="round-picture" style={{height:32,width:32,objectFit:'cover'}}/>
        <span style={{fontWeight:'bold', fontSize:'2em',marginLeft:10}}>{data.room.name}</span>
    </div>
    return(
        <>
        <Helmet>
            <title>{data.room.name} - Subranch</title>
            <meta name="description" content={`${data.room.name} messages.`} />
        </Helmet>
        <PageWrapper>
            <div className="flex-fill big-main-column" ref={ref} style={{display:'relative',height:{height},
            flexFlow:'column',WebkitFlexFlow:'column',marginRight:0,flex:1,msFlex:1,WebkitFlex:1}}>
                <RoutedHeadline>
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
        fontSize:'1.6em',wordBreak:'break-all',backgroundColor:'#e1e7ec',
        padding:'5px 10px',borderRadius:25,margin:'3px 0'
    };

    if(messageBox.author_url == branch){
        containerStyle = {alignSelf:'flex-end'}
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
                                <div className="flex-fill" style={{...containerStyle}}>
                                    <span style={messageStyle}>{m.message}</span>
                                </div>:null}
                                
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
                        return <RoomPreview ws={data.ws} room={data.room} key={data.room}/>
                    }):<MutualFollowMessage/>
                }
                {loaded?
                    <>
                    <ConversationRequests rooms={rooms} setRooms={setRooms}/>
                    <Link to="/messages/create_conversation" style={{textDecoration:'none',borderBottom:'1px solid rgb(226, 234, 241)'}}
                    className="info-message-wrapper flex-fill center-items">
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
            return <ConversationRequestsPreview request={r} rooms={rooms} setRooms={setRooms}/>
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
        <div className="info-message-wrapper flex-fill center-items">
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

    ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        setLatestMessage(message);
        //self.el.scrollIntoView({ behavior: "instant" });
    };

    return(
        <Link to={`/messages/${room.id}`} className="flex-fill room-preview">
            <img className="round-picture" src={room.image} style={{height:48,width:48,objectFit:'cover'}}></img>
            <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',padding:'0 10px',fontSize:'2em'}}>
                <span style={{fontWeight:600,color:'#292929'}}>{room.name}</span>
                <span style={{fontSize:'0.9em',color:'#708698',wordBreak:'break-all'}}>{latestMessage}</span>
            </div>
        </Link>
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