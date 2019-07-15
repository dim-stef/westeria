import React, { Component, useState,useEffect,useRef,useContext } from "react";
import {Link, NavLink } from "react-router-dom"
import Responsive from 'react-responsive';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {UserContext} from "../container/ContextContainer"
import {FrontPageLeftBar} from "./FrontPage"
import {Desktop,Tablet,Mobile} from "./Responsive"
import { RoutedTabs, NavTab } from "react-router-tabs";
import axios from 'axios'

export function NotificationsContainer({inBox}){
    const context = useContext(UserContext);
    const [isOpen,setOpen] = useState(false);
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
        var chatSocket = new WebSocket(
            'ws://' + window.location.host +
            '/ws/notifications/' + context.currentBranch.uri + '/');
    
        chatSocket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            var message = data['message'];
            var request_to = data['request_to'];
            var id = data['id'];
            setId(id);
            console.log(message,request_to,id)
        }
    }

    async function receiveId(id){
        let response = await axios.get(`/api/notifications/${id}/`);
        let data = await response.data
        let newNotifications = [data,...notifications];
        setNotifications(newNotifications);
    }

    async function getNotifications(){
        var response = await axios.get('/api/notifications/');
        let data = await response.data
        console.log(response);
        setNotifications(data);
    }

    function handleClick(){
        setOpen(!isOpen);
    }

    return(
        <Notifications notifications={notifications} inBox={inBox}/>
        /*<div style={{position:'relative'}}>
            <button onClick={handleClick} style={{height:'100%',width:50,backgroundColor:'transparent',border:0}}>
                <NotificationsSvg/>
            </button>
            {isOpen?<Notifications notifications={notifications} inBox/>:null}
        </div>*/
    )
}

export function Notifications({notifications,inBox}){
    const [isOpen,setOpen] = useState(false);
    function handleClick(){
        setOpen(!isOpen);
    }

    function handleEnter(){
        setOpen(true);
    }

    function handleLeave(){
        setOpen(false);
    }

    return(
        inBox?
            <div
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave} style={{position:'relative'}}>
                
                <button
                style={{height:'100%',width:50,backgroundColor:'transparent',border:0}}>
                    <NotificationsSvg/>
                </button>
                
                {isOpen?<BoxNotifications notifications={notifications}/>:null}
            </div>
        :<PageNotifications notifications={notifications}/>
    )
}

function PageNotifications({notifications}){

    return(
        <>
        <Desktop>
            <FrontPageLeftBar/>
            <div className="main-column">
                {notifications.length>0?
                notifications.map(n=>{
                    console.log("nnnn",n)
                    return(
                        <NotificationMatcher notification={n}/>
                    )
                }):null}
            </div>
        </Desktop>
        <Tablet>
            <div className="main-column">
                {notifications.length>0?
                notifications.map(n=>{
                    console.log("nnnn",n)
                    return(
                        <NotificationMatcher notification={n}/>
                    )
                }):null}
            </div>
        </Tablet>
        <Mobile>
            <div className="main-column">
                {notifications.length>0?
                notifications.map(n=>{
                    console.log("nnnn",n)
                    return(
                        <NotificationMatcher notification={n}/>
                    )
                }):null}
            </div>
        </Mobile>
        </>
    )
}

function NotificationMatcher({notification}){
    if(notification.verb=="become_child" || notification.verb=="become_parent"){
        return <BranchNotification notification={notification}/>
    }
}

function BranchNotification({notification}){
    
    let n = notification;
    let linkTo = n.verb=="become_child"?`/${n.target.uri}/branches/children`:`/${n.target.uri}/branches/parents`;

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
                console.log(response);
            }).catch(error => {
            console.log(error)
        })
    }

    return(
        <div style={{borderBottom:'1px solid #e2eaf1'}}>
            <Link to={linkTo} key={n.id} 
            style={{alignItems:'center',
            flexFlow:'row wrap',color:'#252525',textDecoration:'none'}} 
                className="notification flex-fill">
                <div style={{display:'inline-block',backgroundColor:'#e2eaf1',padding:10,borderRadius:50}}>
                    <div className="flex-fill" style={{alignItems:'center'}}>
                        <div className="round-picture" style={{width:48,height:48,backgroundImage:`url('${n.actor.branch_image}')`,
                        display:'inline-block'}}></div>
                        <span style={{padding:10}}>{n.actor.uri}</span>
                    </div>
                </div>
                <span style={{padding:10}}>{n.description}</span>
                <div style={{display:'inline-block',backgroundColor:'#e2eaf1',padding:10,borderRadius:50}}>
                    <div className="flex-fill" style={{alignItems:'center'}}>
                        <div className="round-picture" style={{width:48,height:48,backgroundImage:`url('${n.target.branch_image}')`,
                        display:'inline-block'}}></div>
                        <span style={{padding:10}}>{n.target.uri}</span>
                    </div>
                </div>
                
            </Link>
            {n.verb=="become_child" || n.verb=="become_parent" && n.action_object?
                <div>
                    <button className="accept-btn" onClick={(e)=>updateRequest(e,'accepted',n.target,n.action_object.id)}>accept</button>
                    <button className="decline-btn" onClick={(e)=>updateRequest(e,'declined',n.target,n.action_object.id)}>decline</button>
                </div>
            :null}
        </div>
    )
}

function BoxNotifications({notifications}){
    return(
        <div style={{position:'absolute',width:500,marginTop:10,right:0}}>
            <div style={{position:'relative',height:10}}>
                <div style={{right:79,left:'auto'}} className="arrow-upper"></div>
                <div style={{right:80,left:'auto'}} className="arrow-up"></div>
            </div>
            
            <div style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a'}}> 
                {notifications.length>0?
                notifications.map(n=>{
                    return(
                    <div key={n.id} className="notification">
                        <div style={{display:'inline-block'}}>
                            <div className="round-picture" style={{width:24,height:24,backgroundImage:`url('${n.actor.branch_image}')`,
                            display:'inline-block'}}></div>
                            <span>{n.actor.uri}</span>
                        </div>
                        <span>{n.description}</span>
                        <div style={{display:'inline-block'}}>
                            <div className="round-picture" style={{width:24,height:24,backgroundImage:`url('${n.target.branch_image}')`,
                            display:'inline-block'}}></div>
                            <span>{n.target.uri}</span>
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