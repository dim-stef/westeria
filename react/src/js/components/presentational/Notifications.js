import React, {useContext, useEffect, useState} from "react";
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import {Link} from "react-router-dom"
import {isMobile} from 'react-device-detect';
import {MoonLoader} from 'react-spinners';
import InfiniteScroll from 'react-infinite-scroll-component';
import formatRelative from 'date-fns/formatRelative';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {Helmet} from "react-helmet"
import {NotificationsContext, SingularPostContext, UserContext} from "../container/ContextContainer"
import {FrontPageLeftBar} from "./FrontPage"
import {Post} from "./SingularPost"
import {Desktop, Mobile, Tablet} from "./Responsive"
import {DesktopProfileWrapper} from "./ProfileViewer"
import axios from 'axios'
import axiosRetry from 'axios-retry';

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();

const notificationCss = theme =>css({
    '&:hover':{
        backgroundColor:theme.hoverColor
    }
})

const borderBottom = theme =>css({
    borderBottom: `1px solid ${theme.borderColor}`
})

export function NotificationsContainer({inBox}){
    const context = useContext(UserContext);
    const notificationsContext = useContext(NotificationsContext);
    const [loaded,setLoaded] = useState(false);
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const [id,setId] = useState(null);
    
    useEffect(()=>{
        getNotifications();
        connectToWebsocket();
    },[context.currentBranch.uri])

    useEffect(()=>{
        receiveId(id);
    },[id])


    function connectToWebsocket(){
        let ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        let chatSocket = new ReconnectingWebSocket(
            ws_scheme + '://' + window.location.host +
            '/ws/notifications/' + context.currentBranch.uri + '/');
    
        chatSocket.reconnectDecay = false;
        chatSocket.debug = true;
        chatSocket.reconnectInterval = 2000
        chatSocket.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let id = data['id'];
            setId(id);
        }
    }

    async function receiveId(id){
        if(id){
            let response = await axios.get(`/api/notifications/${id}/`);
            let data = await response.data
            if(data.verb=='message'){
                let newMessages = [data,...notificationsContext.messages];
                notificationsContext.setMessages(newMessages);
            }else{
                let newNotifications = [data,...notificationsContext.notifications];
                notificationsContext.setNotifications(newNotifications);
            }
        }
    }

    async function getNotifications(){
        // TODO
        // add notification context
        let response = await axios.get('/api/notifications/',{cancelToken: source.token});

        // init notifications
        notificationsContext.setNotifications(response.data.results);

        if(!response.data.next){
            setHasMore(false);
        }

        setNext(response.data.next);
        setLoaded(true);
    }

    async function getMoreNotifications(){
        if(notificationsContext.notifications.length > 0 && next){
            let response = await axios.get(next);
            notificationsContext.setNotifications([...notificationsContext.notifications,...response.data.results]);
    
            if(!response.data.next){
                setHasMore(false);
            }
    
            setNext(response.data.next);
        }
    }

    return(
        <Notifications notifications={notificationsContext.notifications} inBox={inBox} loaded={loaded}
            hasMore={hasMore} getMoreNotifications={getMoreNotifications}
        />
    )
}

export function Notifications({notifications,inBox,loaded,hasMore,getMoreNotifications}){
    const [isOpen,setOpen] = useState(false);
    let setTimeoutConst;
    let setTimeoutConst2;

    function handleMouseEnter(){
        clearTimeout(setTimeoutConst2)

        setTimeoutConst = setTimeout(()=>{
            setOpen(true);
        },500)
    }

    function handleMouseLeave(){
        clearTimeout(setTimeoutConst)

        setTimeoutConst2 = setTimeout(()=>{
            setOpen(false);
        },500)
    }

    return(
        inBox?
            <div
            onMouseEnter={isMobile?null:handleMouseEnter}
            onMouseLeave={isMobile?null:handleMouseLeave} style={{position:'relative'}}>
                <NotificationsSvg/>
                {notifications.filter(n=>n.verb!='message' && n.unread==true).length>0?
                <span className="new-circle">

                </span>:null}
                {isOpen && notifications.length>0?/*<BoxNotifications notifications={notifications}/> */null:null}
            </div>
        :<ResponsiveNotifications>
            <PageNotifications notifications={notifications} loaded={loaded}
                getMoreNotifications={getMoreNotifications} hasMore={hasMore}
            />
        </ResponsiveNotifications>
    )
}

function PageNotifications({notifications,loaded,hasMore,getMoreNotifications}){
    const theme = useTheme();
    const loader = <div className="flex-fill center-items" style={{margin:20}}>
    <MoonLoader
        sizeUnit={"px"}
        size={20}
        color={'#123abc'}
        loading={true}
    /></div>
    
    return(
        <>
        <Helmet>
            <title>Notifications - Subranch</title>
            <meta name="description" content="Your notifications." />
        </Helmet>
        <div className="main-column" style={{border:`1px solid ${theme.borderColor}`}}>
            {!loaded?
            <div className="flex-fill load-spinner-wrapper">
                <MoonLoader
                    sizeUnit={"px"}
                    size={20}
                    color={'#123abc'}
                    loading={true}
                />
            </div>:
            notifications.length>0?
                <InfiniteScroll
                scrollableTarget={document.getElementById('mobile-content-container')?
                document.getElementById('mobile-content-container'):null}
                dataLength={notifications.length}
                next={getMoreNotifications}
                hasMore={hasMore}
                loader={loader}>
                {notifications.map(n=>{
                    // can be null
                        if(n.action_object){
                            return(
                            <React.Fragment key={n.id}>
                                <NotificationMatcher notification={n}/>
                            </React.Fragment>
                        )}else{
                            return null
                        }
                    }
                    
                )}
                </InfiniteScroll>:
                <div className="info-message flex-fill center-items">
                    <span>You don't have any new notifications</span>
                </div>
            }
        </div>
        </>
    )
}

function ResponsiveNotifications({children}){
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

function NotificationMatcher({notification}){

    if(notification.verb=="become_child" || notification.verb=="become_parent"){
        return <BranchNotification notification={notification}/>
    }else if(notification.verb=='react' || notification.verb=="add_leaf"){
        return <ReactNotification notification={notification}/>;
    }else if(notification.verb=='follow'){
        return <FollowNotification notification={notification}/>;
    }else if(notification.verb=='conversation_invite'){
        return <ChatRequestNotification notification={notification}/>
    }else if(notification.verb=='reply'){
        return <ReplyNotification notification={notification}/>
    }else{
        return null;
    }
}

function FollowNotification({notification}){

    let linkTo = `/${notification.actor.uri}`;
    
    return(
        <div css={theme=>borderBottom(theme)}>
            <div className="notification-timestamp">
            {formatRelative(new Date(notification.timestamp.replace(' ', 'T')), new Date())}</div>

            <NotificationLinkBody to={linkTo} id={notification.id}>
                <NotificationBranch image={notification.actor.branch_image} uri={notification.actor.uri}/>
                <span style={{padding:10}}> {notification.description} </span>
            </NotificationLinkBody>
        </div>
    ) 
}


function ChatRequestNotification({notification}){
    const [status,setStatus] = useState(notification.action_object.status);

    function updateRequest(event,status,viewedBranch,requestId){
        let uri = `/api/v1/branches/${viewedBranch.uri}/conversation_invitations/${requestId}/`;
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
                setStatus(status);
            })
    }

    return(
        <div css={theme=>borderBottom(theme)}>
            <div className="notification-timestamp">
            {formatRelative(new Date(notification.timestamp.replace(' ', 'T')), new Date())}</div>
            <NotificationLinkBody to="#" id={notification.id}>
                <NotificationBranch image={notification.actor.branch_image} uri={notification.actor.uri}/>
                <span style={{padding:10}}> {notification.description} </span>
                <NotificationBranch image={notification.action_object.branch_chat.image} 
                uri={notification.action_object.branch_chat.name}/>
            </NotificationLinkBody>
            <div>
                
                    {status=='on hold' || !status?
                    <>
                    <button className="accept-btn"
                    onClick={(e)=>updateRequest(e,'accepted',notification.target,notification.action_object.id)}>accept</button>
                    <button className="decline-btn" 
                    onClick={(e)=>updateRequest(e,'declined',notification.target,notification.action_object.id)}>decline</button>
                    </>:
                    <p className="form-succeed-message" 
                    style={{margin:10}}>{status=='accepted'?'Request accepted':'Request declined'}</p>}
                    
                </div>
        </div>
    ) 
}


function ReactNotification({notification}){
    const [post,setPost] = useState(null);
    const userContext = useContext(UserContext);
    const postsContext = useContext(SingularPostContext);
    const theme = useTheme();

    async function getPost(){
        let response = await axios.get(`/api/post/${notification.action_object.id}/`);
        setPost(response.data);
    }

    useEffect(()=>{
        getPost();
    },[])

    if(post){
        let linkTo = `/${notification.target.uri}/leaves/${post.id}`;
        return(
            <>
            <div className="notification-timestamp">
            {formatRelative(new Date(notification.timestamp.replace(' ', 'T')), new Date())}</div>
            <div style={{alignItems:'center',WebkitAlignItems:'center',WebkitFlexFlow:'row wrap',
            flexFlow:'row wrap',borderBottom:`1px solid ${theme.borderColor}`}}
            className="notification flex-fill" css={theme=>notificationCss(theme)}>
                <NotificationBranch image={notification.actor.branch_image} uri={notification.actor.uri}/>
                <span style={{padding:10}}> {notification.description} </span>
                <div style={{margin:10,fontSize:'0.5em',width:'100%'}}>
                    <Post post={post} postsContext={postsContext} 
                    activeBranch={userContext.currentBranch} viewAs="embeddedPost"/>
                </div>
            </div>
            </>
        )
    }else{
        return null;
    } 
}

function ReplyNotification({notification}){
    const [post,setPost] = useState(null);
    const [reply,setReply] = useState(null)
    const userContext = useContext(UserContext);
    const postsContext = useContext(SingularPostContext);
    const theme = useTheme();

    async function getPost(){
        let response = await axios.get(`/api/post/${notification.action_object.id}/`);
        setPost(response.data);
    }

    async function getReply(){
        let response = await axios.get(`/api/post/${notification.action_object.replied_to.id}/`);
        setReply(response.data);
    }

    useEffect(()=>{
        getPost();
        getReply();
    },[])

    if(post && reply){
        let linkTo = `/${notification.target.uri}/leaves/${post.id}`;
        return(
            <>
            <div className="notification-timestamp">
            {formatRelative(new Date(notification.timestamp.replace(' ', 'T')), new Date())}</div>
            <div style={{alignItems:'center',WebkitAlignItems:'center',WebkitFlexFlow:'row wrap',
            flexFlow:'row wrap',borderBottom:`1px solid ${theme.borderColor}`}}
            className="notification flex-fill" css={theme=>notificationCss(theme)}>
                <NotificationBranch image={notification.actor.branch_image} uri={notification.actor.uri}/>
                <span style={{padding:10}}> {notification.description} </span>
                <div style={{margin:10,fontSize:'0.5em',width:'100%'}}>
                    <Post post={reply} postsContext={postsContext} 
                    activeBranch={userContext.currentBranch} viewAs="embeddedPost"/>
                    <Post post={post} postsContext={postsContext} 
                    activeBranch={userContext.currentBranch} viewAs="embeddedPost"/>
                </div>
            </div>
            </>
        )
    }else{
        return null;
    } 
}

function BranchNotification({notification}){
    let n = notification;
    let linkTo = n.verb=="become_child"?`/${n.target.uri}/branches/children`:`/${n.target.uri}/branches/parents`;
    const [status,setStatus] = useState(notification.action_object.status);

    function updateRequest(event,status,viewedBranch,requestId){
        event.stopPropagation();
        let uri = `/api/branches/${viewedBranch.uri}/received_request/update/${requestId}/`;
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
                setStatus(status);
            })
    }

    return(
        <div css={theme=>borderBottom(theme)}>
            <div className="notification-timestamp">
            {formatRelative(new Date(n.timestamp.replace(' ', 'T')), new Date())}</div>
            <NotificationLinkBody to={linkTo} id={n.id}>
                <NotificationBranch image={n.actor.branch_image} uri={n.actor.uri}/>
                <span style={{padding:10}}>{n.description}</span>
                <NotificationBranch image={n.target.branch_image} uri={n.target.uri}/>                
            </NotificationLinkBody>
            {n.verb=="become_child" || n.verb=="become_parent" && n.action_object?
                <div>
                
                    {status=='on hold' || !status?
                    <>
                    <button className="accept-btn"
                    onClick={(e)=>updateRequest(e,'accepted',n.target,n.action_object.id)}>accept</button>
                    <button className="decline-btn" 
                    onClick={(e)=>updateRequest(e,'declined',n.target,n.action_object.id)}>decline</button>
                    </>:
                    <p className="form-succeed-message" 
                    style={{margin:10}}>{status=='accepted'?'Request accepted':'Request declined'}</p>}
                    
                </div>
            :null}
        </div>
    )
}

function NotificationBranch({image,uri}){
    const theme = useTheme();
    return(
        <div style={{display:'inline-block',backgroundColor:theme.notificationBranchColor,padding:10,borderRadius:50,margin:'3px 0'}}>
            <div className="flex-fill" style={{alignItems:'center',WebkitAlignItems:'center'}}>
                <div className="round-picture" style={{width:48,height:48,backgroundImage:`url('${image}')`,
                display:'inline-block'}}></div>
                <span style={{padding:10}}>{uri}</span>
            </div>
        </div>
    )
}

function NotificationLinkBody({to,id,children}){
    const theme = useTheme();
    return(
        <Link to={to} key={id} 
            style={{alignItems:'center',WebkitAlignItems:'center',color:theme.textColor,
            flexFlow:'row wrap',WebkitFlexFlow:'row wrap',textDecoration:'none'}}
            className="notification flex-fill" css={theme=>notificationCss(theme)}>
            {children}
        </Link>
    )
}


function BoxNotifications({notifications}){
    return(
        <div className="hoverable-box" style={{width:500}}>
            <div style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a',borderRadius:15,overflow:'hidden',
            color:'#333'}}> 
                {notifications.length>0?
                notifications.filter(n=>n.verb!='message').map(n=>{
                    return(
                    <div key={n.id} className="notification" css={theme=>notificationCss(theme)}>
                        <div style={{display:'inline-block'}}>
                            <div className="round-picture" style={{width:24,height:24,backgroundImage:`url('${n.actor.branch_image}')`,
                            display:'inline-block'}}></div>
                            <span>@{n.actor.uri}</span>
                        </div>
                        <span> {n.description} </span>
                        <div style={{display:'inline-block'}}>
                            <div className="round-picture" style={{width:24,height:24,backgroundImage:`url('${n.target.branch_image}')`,
                            display:'inline-block'}}></div>
                            <span>@{n.target.uri}</span>
                        </div>

                    </div>
                    )
                }):null}
            </div>
        </div>
    )
}

const icon = theme =>css({
    fill:theme.textColor
})

const NotificationsSvg = props => (
    <div className="flex-fill" style={{borderRadius:'50%',overflow:'hidden',
    WebkitMaskImage:'-webkit-radial-gradient(white, black)'}}>
        <svg className="nav-icon" x="0px" y="0px" viewBox="0 0 260 260" xmlSpace="preserve" {...props}>
        <path
            d="M205.2 167c-6.1-3.3-16.3-8.7-16.3-65.4 0-14.1-5.1-27.8-14.3-38.5-8.2-9.5-19.2-16.1-31.3-18.9-.4-6.1-4.7-11.3-10.6-12.5-.9-.2-1.8-.3-2.7-.3-7.2 0-13 5.7-13.3 12.8-12.1 2.8-23.1 9.4-31.3 18.9-9.2 10.7-14.3 24.3-14.3 38.5 0 25.6-2 43.7-6 53.9-3 7.6-6.2 9.3-9.7 11-5.5 2.8-10.1 6.1-10.1 18 0 5.2 4.2 9.5 9.5 9.5h43.6c-.9 1-1.4 2.3-1.3 3.7 1.1 17.3 15.5 30.9 32.9 30.9s31.8-13.6 32.9-30.9c.1-1.3-.4-2.7-1.3-3.7h43.6c5.2 0 9.5-4.2 9.5-9.5v-1.3c0-10.2-4.3-13.4-9.5-16.2zM130 218.5c-10.2 0-19-6.8-21.9-16.2H152c-3 9.4-11.8 16.2-22 16.2zm74.7-34.5H55.3c.1-6.2 1.3-6.8 4.6-8.5 8.9-4.6 21.1-10.8 21.1-73.9 0-24.2 17.4-44.5 41.3-48.3 2.4-.4 4.2-2.5 4.2-4.9v-3.6c0-2.1 1.9-3.7 4.1-3.3 1.5.3 2.6 1.8 2.6 3.6v3.2c0 2.5 1.8 4.6 4.2 4.9 24 3.7 41.3 24 41.3 48.3 0 57.9 10.2 68.2 21.5 74.3 3.4 1.8 4.3 2.3 4.3 7.4v.8z"
            css={theme=>icon(theme)}
        />
        </svg>
    </div>
  );