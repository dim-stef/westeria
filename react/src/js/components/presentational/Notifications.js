import React, { useState,useEffect,useContext } from "react";
import {Link, NavLink } from "react-router-dom"
import {isMobile} from 'react-device-detect';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {UserContext,SingularPostContext} from "../container/ContextContainer"
import {FrontPageLeftBar} from "./FrontPage"
import {Post} from "./SingularPost"
import {Desktop,Tablet,Mobile} from "./Responsive"
import axios from 'axios'

export function NotificationsContainer({inBox}){
    const context = useContext(UserContext);
    const [notifications,setNotifications] = useState([]);
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
    
        chatSocket.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let message = data['message'];
            let request_to = data['request_to'];
            let id = data['id'];
            setId(id);
        }
    }

    async function receiveId(id){
        if(id){
            let response = await axios.get(`/api/notifications/${id}/`);
            let data = await response.data
            let newNotifications = [data,...notifications];
            setNotifications(newNotifications);
        }
    }

    async function getNotifications(){
        let response = await axios.get('/api/notifications/');
        let data = await response.data
        setNotifications(data);
    }

    return(
        <Notifications notifications={notifications} inBox={inBox}/>
    )
}

export function Notifications({notifications,inBox}){
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
                <button
                style={{height:'100%',width:50,backgroundColor:'transparent',border:0}}>
                    <NotificationsSvg/>
                </button>
                
                {isOpen?<BoxNotifications notifications={notifications}/>:null}
            </div>
        :<ResponsiveNotifications>
            <PageNotifications notifications={notifications}/>
        </ResponsiveNotifications>
    )
}

function PageNotifications({notifications}){
    return(
        <div className="main-column">
            {notifications.length>0?
            notifications.map(n=>{
                return(
                    <NotificationMatcher notification={n}/>
                )
            }):null}
        </div>
    )
}

function ResponsiveNotifications({children}){
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

function NotificationMatcher({notification}){

    if(notification.verb=="become_child" || notification.verb=="become_parent"){
        return <BranchNotification notification={notification}/>
    }else if(notification.verb=='react'){
        return <ReactNotification notification={notification}/>;
    }else{
        return null;
    }
}

function ReactNotification({notification}){
    const [post,setPost] = useState(null);
    const userContext = useContext(UserContext);
    const postsContext = useContext(SingularPostContext);

    async function getPost(){
        let response = await axios.get(`/api/post/${notification.action_object.post}/`);
        setPost(response.data);
    }

    useEffect(()=>{
        getPost();
    },[])

    if(post){
        let linkTo = `/${notification.target.uri}/leaves/${post.id}`;
        return(
            <div style={{alignItems:'center',
            flexFlow:'row wrap',borderBottom:'1px solid #e2eaf1'}}
            className="notification flex-fill">
                <NotificationBranch image={notification.actor.branch_image} uri={notification.actor.uri}/>
                <span style={{padding:10}}> {notification.description} </span>
                <div style={{margin:10,fontSize:'0.5em',width:'100%'}}>
                    <Post post={post} postsContext={postsContext} 
                    activeBranch={userContext.currentBranch} viewAs="embeddedPost"/>
                </div>
            </div>
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
                let status = response.data.action_object;
                setStatus(status);
            }).catch(error => {
        })
    }

    return(
        <div style={{borderBottom:'1px solid #e2eaf1'}}>
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
    return(
        <div style={{display:'inline-block',backgroundColor:'#e2eaf1',padding:10,borderRadius:50,margin:'3px 0'}}>
            <div className="flex-fill" style={{alignItems:'center'}}>
                <div className="round-picture" style={{width:48,height:48,backgroundImage:`url('${image}')`,
                display:'inline-block'}}></div>
                <span style={{padding:10}}>{uri}</span>
            </div>
        </div>
    )
}

function NotificationLinkBody({to,id,children}){
    return(
        <Link to={to} key={id} 
            style={{alignItems:'center',
            flexFlow:'row wrap',color:'#252525',textDecoration:'none'}}
            className="notification flex-fill">
            {children}
        </Link>
    )
}


function BoxNotifications({notifications}){
    return(
        <div className="hoverable-box" style={{width:500}}>
            <div style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a',borderRadius:25,overflow:'hidden',
            color:'#333'}}> 
                {notifications.length>0?
                notifications.map(n=>{
                    return(
                    <div key={n.id} className="notification">
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

function NotificationsSvg(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 512 512"
            style={{ enableBackground: "new 0 0 512 512",width:30 }}
            xmlSpace="preserve"
            >
            <path d="M467.819 431.851l-36.651-61.056a181.486 181.486 0 0 1-25.835-93.312V224c0-82.325-67.008-149.333-149.333-149.333S106.667 141.675 106.667 224v53.483c0 32.875-8.939 65.131-25.835 93.312l-36.651 61.056a10.665 10.665 0 0 0-.149 10.731 10.704 10.704 0 0 0 9.301 5.419h405.333c3.84 0 7.403-2.069 9.301-5.419a10.665 10.665 0 0 0-.148-10.731zm-395.648-5.184l26.944-44.907A202.631 202.631 0 0 0 128 277.483V224c0-70.592 57.408-128 128-128s128 57.408 128 128v53.483c0 36.736 9.984 72.789 28.864 104.277l26.965 44.907H72.171z" />
            <path d="M256 0c-23.531 0-42.667 19.136-42.667 42.667v42.667C213.333 91.221 218.112 96 224 96s10.667-4.779 10.667-10.667V42.667c0-11.776 9.557-21.333 21.333-21.333s21.333 9.557 21.333 21.333v42.667C277.333 91.221 282.112 96 288 96s10.667-4.779 10.667-10.667V42.667C298.667 19.136 279.531 0 256 0zm46.165 431.936c-3.008-5.077-9.515-6.741-14.613-3.819-5.099 2.987-6.805 9.536-3.819 14.613 2.773 4.715 4.288 10.368 4.288 15.936 0 17.643-14.357 32-32 32s-32-14.357-32-32c0-5.568 1.515-11.221 4.288-15.936 2.965-5.099 1.259-11.627-3.819-14.613-5.141-2.923-11.627-1.259-14.613 3.819-4.715 8.064-7.211 17.301-7.211 26.731C202.667 488.085 226.581 512 256 512s53.333-23.915 53.376-53.333c0-9.43-2.496-18.667-7.211-26.731z" />
        </svg>

    )
}