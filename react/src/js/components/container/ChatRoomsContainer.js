import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
import ReactDOM from "react-dom"
import {Link} from 'react-router-dom'
import { useTheme } from 'emotion-theming'
import { css, keyframes } from "@emotion/core";
import {useTransition,useChain,useSpring,config,animated} from "react-spring/web.cjs"
import {useMediaQuery} from 'react-responsive'
import {VariableSizeList as List,areEqual} from "react-window";
import {useWindowSize} from "../presentational/useWindowResize"
import formatRelative from 'date-fns/formatRelative';
import differenceInMinutes from 'date-fns/differenceInMinutes'
import ReconnectingWebSocket from 'reconnecting-websocket';
import {Images} from "../presentational/PostImageGallery"
import {Desktop, Mobile, Tablet} from "../presentational/Responsive"
import history from '../../history'
import Linkify from 'linkifyjs/react';
import MoonLoader from 'react-spinners/MoonLoader';
import {Helmet} from 'react-helmet'
import {DesktopProfileWrapper} from "../presentational/ProfileViewer"
import {PopUp} from "../presentational/PreviewPost"
import {CreateNewChat} from "../presentational/CreateNewChat"
import RoutedHeadline from "../presentational/RoutedHeadline"
import Messenger from "../presentational/Messenger"
import {useMyBranches} from "./BranchContainer"
import {CachedBranchesContext, ChatRoomsContext, UserContext} from "./ContextContainer"
import axios from "axios";
import {DropdownActionList} from "../presentational/DropdownActionList"
import {PlusSvg} from "../presentational/Svgs"

const MessageBoxContext = React.createContext({data:null});

export function ChatRoomsContainer({inBox,match}){
    const roomsContext = useContext(ChatRoomsContext)
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
        <ChatRoomsContext.Provider value={{rooms:rooms,setRooms:setRooms}}>
            <Helmet>
                <title>Messages - Westeria</title>
                <meta name="description" content="Your messages." />
            </Helmet>
            <WebSocketRooms inBox={inBox} match={match} loaded={loaded} rooms={rooms} setRooms={setRooms}/>
        </ChatRoomsContext.Provider>
        </>
        
    )
}

function WebSocketRooms({rooms,inBox,match,loaded,setRooms}){
    const [roomData,setRoomData] = useState([]);

    useEffect(()=>{

        // adding messages causes rerender
        // only run this if another room was added
        if(rooms.length == 0 || rooms.length != roomData.length){
            connect();
        }
    },[rooms])

    function connect(){
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        let webSockets = rooms.map(r=>{
            let ws = new ReconnectingWebSocket(`${ws_scheme}://${window.location.host}/ws/chat/${r.id}/`);

            ws.reconnectDecay = false;
            ws.debug = true;
            ws.reconnectInterval = 2000
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


if (process.env.NODE_ENV !== 'production') {
    const  YouRender = require('@welldone-software/why-did-you-render');
     YouRender(React);
}


const RoomContainer = React.memo(function RoomContainer({roomData,match}){
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })
    const defaultHeight = isDesktopOrLaptop?window.innerHeight - 70:window.innerHeight
    const theme = useTheme();
    let context = useContext(UserContext);
    const roomsContext = useContext(ChatRoomsContext);
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
    const [heightWithoutKeyboard,setHeightWithoutKeyboard] = useState(defaultHeight);
    const [height,setHeight] = useState(defaultHeight);
    const prevContainerHeight = useRef(0)
    const [prevScrollHeight,setScrollHeight] = useState(0);
    const [loading,setLoading] = useState(true);
    const [messageSending,setMessageSending] = useState(false);
    const ref = useRef(null);
    const listRef = useRef(null);
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

    const getMessages = useCallback(async ()=>{

        setLoading(true);
        if(!hasMore){
            setLoading(false);
            return;
        }
        
        let uri = next?next:`/api/branches/${member}/chat_rooms/${data.room.id}/messages/`;
        setLoading(true);
        let response = await axios.get(uri);
        setLoading(false);
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

    // get missing messages on reconnect
    async function getMessagesOnOpen(){
        if(messages.length==0){
            return;
        }
        // r for reconnecting
        let rhasMore = true;
        let rnext=null;
        let rmessages = [];
        let lastMessage = messages[messages.length - 1];
        let uri;
        let index = -1;

        do{
            uri = rnext?rnext:`/api/branches/${member}/chat_rooms/${data.room.id}/messages/`;
            let response = await axios.get(uri);
            if(!response.data.next){
                rhasMore = false;
                break;
            }
            let newrMessages = response.data.results.reverse();
            rnext = response.data.next;
            rmessages = [...newrMessages,...rmessages];

        // try to find last known message before disconnect
        }while(rhasMore && rmessages.length>0 && messages.length>0 && !(index=rmessages.findIndex(m=>m.id==lastMessage.id)));

        // if message found slice the new messages
        rmessages = rmessages.slice(index + 1,rmessages.length);
        setMessages([...messages,...rmessages]);
    }

    useEffect(()=>{
        data.ws.addEventListener('open',getMessagesOnOpen)
        return()=>{
            data.ws.removeEventListener('open',getMessagesOnOpen)
        }
    },[messages])

    useEffect(()=>{
        getMessages(messages);
        getMembers();
    },[])

    useLayoutEffect(()=>{
        if(!isDesktopOrLaptop){
            let bigContainer = document.getElementById('mobile-content-container');
            prevContainerHeight.current = bigContainer.clientHeight;
            bigContainer.style.height = `${window.innerHeight}px`;

            return ()=>{
                bigContainer.style.height = `${prevContainerHeight.current}px`
            }
        }
    },[])

    useEffect(()=>{
        setAuthor(context.currentBranch)
    },[context.currentBranch])

    useEffect(()=>{
        if(heightWithKeyboard){
            setHeight(heightWithKeyboard);
        }
    },[heightWithKeyboard])

    function updateMessages(newMessage){
        //scrollToBottom();
        setMessages([...messages,...newMessage]);
    }

    const scrollToBottom = ()=>{
        //console.log("scroll Bottom")
        //parentRef.current.scrollTop = parentRef.current.scrollHeight;
        try{
            //parentRef.current.scroll({top: parentRef.current.scrollHeight, left: 0, behavior: 'smooth' })
        }catch(e){
            //parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
        
    }

    const updateLatestMessage = (message,author_name) => {
        let rooms = roomsContext.rooms.slice();
        rooms.forEach(r=>{
            if(r.id == data.room.id){
                if(!message){
                    r.latest_message = `${author_name} sent media`;
                }else{
                    r.latest_message = message;
                }
                
            }
        })

        roomsContext.setRooms(rooms)
    }

    data.ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        let id = data['id'];
        let author_name = data['author_name'];
        let author_url = data['author_url'];
        let author = data['author'];
        let images = data['images'];
        let videos = data['videos'];
        let created = data['created'];
        let bundle = {
            message: message,
            author_name: author_name,
            author_url: author_url,
            author: author,
            images: Array.isArray(images)?images:JSON.parse(images),
            videos: Array.isArray(videos)?videos:JSON.parse(videos),
            created: created,
            id:parseInt(id,10),
        }
        updateLatestMessage(message,author_name);
        let loadingIndex = messages.findIndex(m=>m.id=='loading' && m.message == bundle.message);
        if(loadingIndex != -1){
            let messagesWithLoading = messages.slice();
            messagesWithLoading[loadingIndex] = bundle
            setMessages(messagesWithLoading)
        }else{
            updateMessages([bundle]);
        }
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
            <title>{name} - Westeria</title>
            <meta name="description" content={`${name} messages.`} />
        </Helmet>
        <PageWrapper>
            <div className="flex-fill big-main-column" ref={ref} css={theme=>({position:'relative',height:height,
            flexFlow:'column',marginRight:0,flex:1,border:0,backgroundColor:theme.backgroundBoxColor,
            '@media (max-device-width:767px)':{
                borderRadius:0
            }})}>
                <RoutedHeadline to="/messages" className="chat-headline" 
                containerStyle={{backgroundColor:theme.backgroundBoxColor,border:0}}>
                    {headline}
                </RoutedHeadline>
                <div ref={parentRef} className="flex-fill" css={theme=>({flex:1,overflow:'hidden',            
                 '>div':{
                    overflowX:'hidden !important',
                    boxSizing:'border-box',flex:1,
                    flexFlow:'column',
                    '&::-webkit-scrollbar':{
                        width:10
                    },
                    '&::-webkit-scrollbar-thumb':{
                        backgroundColor:theme.scrollBarColor,
                    },
                    '@media (max-device-width:767px)':{
                        '&::-webkit-scrollbar':{
                            width:4
                        }, 
                    }
                },
                })}>
                    <Room messages={messages} members={members} branch={author.uri} isFirstBatch={isFirstBatch} 
                    setFirstBatch={setFirstBatch} prevScrollHeight={prevScrollHeight}
                    parentRef={parentRef} wrapperRef={ref} listRef={listRef} loadMoreMessages={getMessages} loading={loading}/>
                </div>
                <Messenger branch={author} ws={data.ws} room={data.room} roomId={data.room.id} 
                    scrollToBottom={scrollToBottom} parentRef={parentRef}
                    isLoading={messageSending} setLoading={setMessageSending} updateMessages={updateMessages}
                />
            </div>
        </PageWrapper>
        </>
    )
},(prevProps,nextProps)=>{
    return prevProps.match.params.roomName == nextProps.match.params.roomName
})

const Room = React.memo(function Room({messages,members,branch,isFirstBatch,prevScrollHeight,parentRef
    ,wrapperRef,listRef,loadMoreMessages,loading}){

    const messageBoxContext = useContext(MessageBoxContext);
    const [imageWidth,setImageWidth] = useState(0);
    const previousMessageBoxes = useRef([]);
    const [messageBoxes,setMessageBoxes] = useState(getChatBoxes());
    const autoScroll = useRef(true);
    const lastScrollPosition = useRef(null);
    const prevHeight = useRef(height);
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })
    const [height,setHeight] = useState(parentRef.current? parentRef.current.clientHeight : window.innerHeight - 100);

    const sizeMap = useRef({});
    const lastItemHeight = useRef(0);
    const setSize = useCallback((index, size) => {
        sizeMap.current = { ...sizeMap.current, [index]: size };
    }, []);
    const getSize = useCallback(index => sizeMap.current[index] || 20, []);
    const [windowWidth] = useWindowSize();

    useLayoutEffect(() => {
        if(parentRef.current){
            setImageWidth(parentRef.current.clientWidth);
            setHeight(parentRef.current.clientHeight);         
        }
    },[parentRef.current,wrapperRef])

    function getChatBoxes(){
        let chatBox = {
            author: null,
            author_name: null,
            author_url: null,
            created:null,
            messages: []
        };
        let messageBoxes = messages.map((m, i) => {

            let nextAuthor = null;
            let nextCreated = null;            
            chatBox.author = m.author;
            chatBox.author_name = m.author_name;
            chatBox.author_url = m.author_url;
            chatBox.author_image = m.author_image || null;
            chatBox.created = m.created;
            chatBox.messages.push(m)

            if (i < messages.length - 1) {
                nextAuthor = messages[i + 1].author_url
                nextCreated = messages[i + 1].created
            }

            let shouldUpdate = m.author_url != nextAuthor || 
            differenceInMinutes(new Date(nextCreated),new Date(m.created)) > 10 //|| chatBox.messages.length > 8
            if (shouldUpdate) {
                let copy = Object.assign({}, chatBox);
                chatBox.author_url = null;
                chatBox.messages = [];
                return copy;
            }
            return null;
        })
        let filtered = messageBoxes.filter(function (el) {
            return el != null;
        });

        try{
            if(listRef && listRef.current && 
                listRef.current._outerRef.scrollTop + listRef.current._outerRef.clientHeight + 10 >= 
                listRef.current._outerRef.scrollHeight){
                autoScroll.current = true;
            }

            if(isFirstBatch){
                previousMessageBoxes.current = filtered;
            }
        }catch(e){

        }

        return filtered;
    }

    useEffect(()=>{
        setMessageBoxes(getChatBoxes());
    },[messages])

    useEffect(()=>{
        if(autoScroll.current || isFirstBatch && messageBoxes.length !=0){
            listRef.current.scrollToItem(messageBoxes.length,'smart')

            // this fixes a bug where scroll would twitch
            // TEMPORARY FIX
            setTimeout(()=>{
                listRef.current.scrollToItem(messageBoxes.length,'end')
            },50)
        }

        if(!autoScroll.current && messageBoxes.length !=0){
            listRef.current.scrollTo(lastScrollPosition.current)
        }
        
        listRef.current.resetAfterIndex(messageBoxes.length - 1)
    },[messageBoxes,sizeMap,listRef.current])

    const messageBoxData = {
        parentRef:parentRef,
        members:members,
        messageBoxes:messageBoxes,
        branch:branch,
        imageWidth:imageWidth,
        setSize:setSize,
        windowWidth:windowWidth,
        listRef:listRef,
        isFirstBatch:isFirstBatch,
    }

    messageBoxContext.data = messageBoxData;

    function handleScroll({scrollOffset,scrollUpdateWasRequested}){
        autoScroll.current = false

        if(scrollOffset < 100 && messageBoxes.length != 0 && !loading){
            prevHeight.current = listRef.current._outerRef.scrollHeight - listRef.current._outerRef.clientHeight
            loadMoreMessages();
        }
    }

    function onItemsRendered({
        overscanStartIndex,
        overscanStopIndex,
        visibleStartIndex,
        visibleStopIndex
    }) {

        /*if(overscanStopIndex < messageBoxes.length){
            listRef.current.scrollToItem(messageBoxes.length,'end')
        }*/

        let lastIndex = messageBoxes.findIndex(mBox=>mBox.created==previousMessageBoxes.current[0].created)
        previousMessageBoxes.current = messageBoxes;
        let newRowHeight = 0;
        for(let i = 0;i<lastIndex;i++){
            newRowHeight += getSize(i);
        }

        if(isFirstBatch){
            lastItemHeight.current = getSize(lastIndex)
        }

        newRowHeight += getSize(lastIndex) - lastItemHeight.current
        lastItemHeight.current = getSize(lastIndex);
        lastScrollPosition.current = newRowHeight;

        // All index params are numbers.
    }

    return(
        <List ref={listRef}
        height={height} 
        width={'100%'}
        itemData={messageBoxes}
        itemCount={messageBoxes.length}
        itemSize={getSize}
        onScroll={handleScroll}
        onItemsRendered={onItemsRendered}
        >
        {MessageBox}
        </List>
    )
})

const scale_up_bl = keyframes`
  0% {
        transform: scale(0.5);
        transform-origin: 100% 100%;
  }
  100% {
        transform: scale(1);
        transform-origin: 100% 100%;
  }
`

const scale_up_left = keyframes`
  0% {
        transform: scale(0.5);
        transform-origin: 0% 50%;
  }
  100% {
        transform: scale(1);
        transform-origin: 0% 50%;
  }
`

const MessageBox = React.memo(function MessageBox({data,index,style}){
    const messageBoxContext = useContext(MessageBoxContext);
    const {isFirstBatch,parentRef,members,messageBoxes,branch,imageWidth,setSize,windowWidth,
    listRef} = {...messageBoxContext.data}
    const messageBox = data[index];

    const ref = useRef(null);

    useLayoutEffect(() => {
        if(listRef.current && ref.current){
            setSize(index, ref.current.getBoundingClientRect().height + 10);
            listRef.current.resetAfterIndex(index);
        }
    },[windowWidth,ref,listRef,messageBox]);

    const theme = useTheme();
    let containerStyle={};
    let messageStyle={
        fontSize:'1.6em',backgroundColor:theme.chatBubbleColor,
        padding:'8px 15px',borderRadius:25,margin:'1px 0',maxWidth:'70%'
    };

    if(messageBox.author_url == branch){
        containerStyle = {alignSelf:'flex-end',WebkitAlignSelf:'flex-end',
        justifyContent:'flex-end',WebkitJustifyContent:'flex-end'}
        messageStyle = {...messageStyle,backgroundColor:'#219ef3',color:'white'}
    }

    let member = members.find(m=>messageBox.author_url==m.uri)
    let memberImage = member?member.branch_image:messageBox.author_image

    let timeDifference = null;

    try{
        timeDifference = formatRelative(new Date(messageBox.messages[0].created), new Date());
    }catch(e){

    }

    let animation = messageBox.author_url == branch?
    css`
        animation: ${scale_up_bl} 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    `
    :
    css`
        animation: ${scale_up_left} 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    `
    let messageBoxHeader = messageBox.author_url == branch?(
        
        <div className="flex-fill" style={{...containerStyle,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
            <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',alignItems:'flex-end',
            WebkitAlignItems:'flex-end',margin:'0 8px'}}>
                <span style={{fontSize:'1.5rem',fontWeight:500,color:theme.textColor}}>{messageBox.author_name}</span>
                {timeDifference?<span style={{fontSize:'1.1rem',color:theme.textLightColor}}>{timeDifference}</span>:null}
                
            </div>
            <img className="round-picture" src={memberImage} 
            style={{height:36,width:36,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}></img>
        </div>
    ):
    (
        <div className="flex-fill" style={{...containerStyle,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
            <img className="round-picture" src={memberImage} 
            style={{height:36,width:36,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}></img>
            <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',alignItems:'flex-start',
            WebkitAlignItems:'flex-start',margin:'0 8px'}}>
                <span style={{fontSize:'1.5rem',fontWeight:500,color:theme.textColor}}>{messageBox.author_name}</span>
                {timeDifference?<span style={{fontSize:'1.1rem',color:theme.textLightColor}}>{timeDifference}</span>:null}
            </div>
        </div>
    )

    return (
        <div style={style}>
            <div style={{display:'inline-table',width:'100%',padding:'0 10px',boxSizing:'border-box'}}>
                <div ref={ref} className="flex-fill" style={{...containerStyle,flexFlow:'column',WebkitFlexFlow:'column'}}>
                    {messageBoxHeader}
                    <div className="flex-fill" style={{ padding:'10px 0',flexFlow:'column',WebkitFlexFlow:'column'}}>
                        <MessageBoxMessageList messages={messageBox.messages} containerStyle={containerStyle}
                            messageStyle={messageStyle} imageWidth={imageWidth} animation={animation} 
                            isSelfAuthor={messageBox.author_url == branch} isFirstBatch={isFirstBatch} index={index}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
},(prevProps,nextProps)=>{
    let prevLoadingMessagesCount = prevProps.data[prevProps.index].messages.filter(m=>m.id=='loading').length
    let nextLoadingMessagesCount = nextProps.data[nextProps.index].messages.filter(m=>m.id=='loading').length

    return prevProps.data[prevProps.index].messages[0].created == nextProps.data[nextProps.index].messages[0].created &&
    prevProps.index == nextProps.index && prevProps.data.length == nextProps.data.length 
    && prevProps.data[prevProps.index].messages.length == nextProps.data[nextProps.index].messages.length
    && prevProps.style.height == nextProps.style.height && prevProps.style.top == nextProps.style.top
    && prevLoadingMessagesCount == nextLoadingMessagesCount
})

const MessageBoxMessageList = React.memo(function MessageBoxMessageList({messages,
    containerStyle,messageStyle,imageWidth,
    isSelfAuthor,isFirstBatch,index}){

    const transitions = useTransition(messages,item=>item.id,{
        unique: true,
        trail: 400 / messages.length,
        from:{transform:`translateX(${isSelfAuthor?100:-100}px)`,opacity:0,willChange:'transform'},
        enter:{transform:`translateX(0px)`,opacity:1},
    })

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

    return ( 
        messages.map((m,i)=>{
        return <animated.div style={{...containerStyle}} key={i}>
            {m.message?
            <div className="flex-fill" style={{...containerStyle,width:'100%',
            opacity:m.id=='loading'?0.4:1}}>
                    <Message m={m} messageStyle={messageStyle}/>
                </div>
            :null}
            
            {m.images.length>0 || m.videos.length>0?
                m.id=='loading'?
                <div css={theme=>({...containerStyle,borderRadius:25,padding:20,display:'flex',justifyContent:'center',
                alignItems:'center',backgroundColor:theme.backgroundDarkColor,width:'min-content',marginLeft:'auto'})}>
                    <MoonLoader
                        sizeUnit={"px"}
                        size={20}
                        color={'#123abc'}
                        loading={true}
                    />
                </div>:
                <div style={{...containerStyle,width:getMediaWidth(m)}}>
                    <Images images={m.images} videos={m.videos} viewAs="reply" imageWidth={imageWidth} noMinHeight/>
                </div>
            :null}
        </animated.div>
        })
    )
},(prevProps,nextProps)=>{
    let prevLoadingMessagesCount = prevProps.messages.filter(m=>m.id=='loading').length
    let nextLoadingMessagesCount = nextProps.messages.filter(m=>m.id=='loading').length

    return prevProps.messages.length == nextProps.messages.length && 
    prevProps.messages[0].created == nextProps.messages[0].created
    && prevProps.index == nextProps.index && prevLoadingMessagesCount == nextLoadingMessagesCount
})

function Message({m,messageStyle, animation}){
    const didMount = useRef(null);

    return(
        <div className="text-wrap" style={messageStyle}>
            <Linkify>{m.message}</Linkify>
        </div>
    )
}


function RoomsPreviewColumn({roomData,isGroup,inBox,loaded,rooms,setRooms}){
    const theme = useTheme();
    const [showCreateNew,setShowCreateNew] = useState(false);

    return(
        <PageWrapper>
            <div className="main-column" css={theme=>({border:0,backgroundColor:theme.backgroundBoxColor,
            boxShadow:theme.postFloatingButtonShadow,padding:10,'@media (max-device-width:767px)':{
                borderRadius:0
            }})}>
                <div css={{display:'flex',flexFlow:'row',alignItems:'center'}}>
                    <h1 css={{flex:1}}>Messages</h1>
                    <div css={{padding:5,marginTop:5,cursor:'pointer'}} onClick={()=>setShowCreateNew(true)}>
                        <PlusSvg css={theme=>({height:20,width:20,fill:theme.textHarshColor})}/>
                    </div>
                </div>
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
                    </>:null}
                
            </div>
            {ReactDOM.createPortal(
                showCreateNew?
                <PopUp shown={showCreateNew} setShown={setShowCreateNew} header="New conversation">
                    <div style={{marginTop:5}}>
                        <CreateNewChat noHeadline/>
                    </div>
                </PopUp>:null
            ,document.getElementById("hidden-elements"))}
            
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
        <div className="flex-fill room-preview" css={theme=>roompreview(theme)}>
            <img className="round-picture" src={request.branch_chat.image} 
            style={{height:32,width:32,minWidth:32,objectFit:'cover',marginRight:20}}></img>
            <div className="flex-fill" 
            css={theme=>({flexFlow:'column',fontSize:'1.6rem',flex:'1 1 auto'})}>
                <span css={theme=>({fontWeight:600,color:theme.textColor})}>{request.branch_chat.name}</span>
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

const roompreview = theme =>css({
    borderRadius:100,
    '&:hover':{
        backgroundColor:theme.hoverColor
    }
})
function RoomPreview({room,ws,isGroup,inBox}){
    const previewBranch = usePreviewBranch(room);
    const [latestMessage,setLatestMessage] = useState(room.latest_message)
    const theme = useTheme();

    ws.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let message = data['message'];
        setLatestMessage(message);
        //self.el.scrollIntoView({ behavior: "instant" });
    };


    return(
        <React.Fragment key={room.id}>
            <Link to={`/messages/${room.id}`} className="flex-fill room-preview" css={theme=>roompreview(theme)}>
                <img className="round-picture" src={room.personal?previewBranch?previewBranch.branch_image:null:room.image} 
                style={{height:32,width:32,minWidth:32,marginRight:20,objectFit:'cover',backgroundColor:'rgb(77, 80, 88)'}}></img>
                <div className="flex-fill text-wrap" style={{flexFlow:'column',WebkitFlexFlow:'column',fontSize:'1.6rem'}}>
                    <span style={{fontWeight:600,color:theme.textColor}}>{room.personal?previewBranch?previewBranch.name:'':room.name}</span>
                    <span style={{fontSize:'0.7em',color:theme.textLightColor}}>{latestMessage}</span>
                </div>
            </Link>
        </React.Fragment>
    )
}

function PageWrapper({children}){
    return(
        <>
            <Desktop>
                <DesktopProfileWrapper>
                    {children}
                </DesktopProfileWrapper>
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

const moreSvg = theme =>css({
    fill:theme.textColor,
    padding: '5px 1px',
    '&:hover':{
        backgroundColor:theme.embeddedHoverColor
    }
})

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
        css={theme=>moreSvg(theme)}
        className={className}>
            <path d="M51 153c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm306 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm-153 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51z" />
        </svg>
    )
}
