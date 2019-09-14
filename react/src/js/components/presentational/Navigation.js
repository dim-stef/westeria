import React, { Component, useState,useEffect,useRef,useContext } from "react";
import {Link, NavLink } from "react-router-dom"
import Responsive from 'react-responsive';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {UserContext,NotificationsContext} from "../container/ContextContainer"
import {FrontPage,FrontPageFeed} from "./Routes"
import {NotificationsContainer} from "./Notifications"
import {SideDrawer} from "./SideDrawer"
import { RoutedTabs, NavTab } from "react-router-tabs";
import {isMobile} from 'react-device-detect';
import {Desktop,Tablet,Mobile} from './Responsive'
import { askForPermissionToReceiveNotifications } from '../../push-notification';
import axios from 'axios'

export function ResponsiveNavigationBar(){
    const notificationsContext = useContext(NotificationsContext);

    function readNotifications(uri,callBack, match, location){
        if (!match) {
            return false
        }

        axios.get(uri)
        callBack();
    }

    function readContextNotifications(){
        askForPermissionToReceiveNotifications();
        let shouldUpdate = false;
        if(notificationsContext.notifications.filter(n=>n.verb!='message' && n.unread==true).length!=0){
            shouldUpdate = true;
        }

        let newNotifications = notificationsContext.notifications.map(n=>{
            if(n.verb!='message'){
                n.unread = false;
            }

            return n;
        })

        // prevent infinite update loop
        if(shouldUpdate){
            notificationsContext.setNotifications(newNotifications);
        }
    }

    function readContextMessages(){
        let shouldUpdate = false;
        if(notificationsContext.notifications.filter(n=>n.verb=='message' && n.unread==true).length!=0){
            shouldUpdate = true;
        }
        
        let newNotifications = notificationsContext.notifications.map(n=>{
            if(n.verb=='message'){
                n.unread = false;
            }

            return n;
        })

        // prevent infinite update loop
        if(shouldUpdate){
            notificationsContext.setNotifications(newNotifications);
        }
    }

    let notificationUri = '/api/notifications/mark_all_notifications_as_read/';
    let messageUri = '/api/notifications/mark_all_messages_as_read/';

    let props = {
        readAllMessages:(match, location)=>readNotifications(messageUri,readContextMessages,match, location),
        readAllNotifications:(match, location)=>readNotifications(notificationUri,readContextNotifications,match, location)
    }

    return(
        <>
        <Desktop>
            <DesktopNavigationBar {...props}/>
        </Desktop>
        
        <Tablet>
            <MobileNavigationBar {...props}/>
        </Tablet>
        
        <Mobile>
            <MobileNavigationBar {...props}/>
        </Mobile>
        </>
    )
}

export function DesktopNavigationBar({readAllMessages,readAllNotifications}){

    const context = useContext(UserContext);
    const notificationsContext = useContext(NotificationsContext);

    let activeStyle={
        borderBottom:'2px solid #2397f3'
    };
    let style={
        justifyContent:'center',alignItems:'center',height:'100%',width:'100%'
    }
    return(
        <div style={{
            height: 50,
            position: "fixed",
            width: "100%",
            backgroundColor: "white",
            maxWidth:1200,
            zIndex: 5,
            top:0
        }}
        >
            <div className="flex-fill" style={{
                justifyContent:'space-between',
                WebkitJustifyContent:'space-between',
                borderBottom:'2px solid rgb(226, 234, 241)',
                height:'100%',
                }}>
                <NavLink exact to="/" className="flex-fill nav-icon-container center-items"
                activeStyle={activeStyle} activeClassName="active-tab-route"
                style={style}>
                    <Home/>
                </NavLink>
                <NavLink to="/search" className="flex-fill nav-icon-container center-items" activeClassName="active-tab-route"
                style={style} activeStyle={activeStyle}>
                    <SearchSvg/>
                </NavLink>
                {context.isAuth?
                    <NavLink to="/notifications" activeClassName="active-tab-route" className="flex-fill nav-icon-container center-items"
                    style={style} activeStyle={activeStyle} onClick={readAllNotifications}>
                        <NotificationsContainer inBox/>
                    </NavLink>:null
                }

                {context.isAuth?
                    <NavLink to="/messages" activeClassName="active-tab-route" className="flex-fill nav-icon-container center-items"
                    style={style} activeStyle={activeStyle} onClick={readAllMessages}>
                    <div style={{position:'relative'}}>
                    <MessageSvg/>
                    {notificationsContext.notifications.filter(n=>n.verb=='message' && n.unread==true).length>0?
                        <span className="new-circle">

                        </span>:null}
                    </div>
                        
                    </NavLink>:null
                }
                
                <div className="flex-fill center-items"
                style={style}>
                    <Profile/>
                </div>
                
   
            </div>
        </div>
    )
}

export function MobileNavigationBar({readAllMessages,readAllNotifications}){
    const context = useContext(UserContext);
    const notificationsContext = useContext(NotificationsContext);

    let style={height:'100%',width:'100%',textDecoration:'none',
    borderTop:'2px solid rgb(226, 234, 241)'}
    let activeStyle={borderTop:'2px solid #2397f3'};


    return(
        <div className="flex-fill mobile-navigation" >
                <NavLink exact to="/" className="flex-fill center-items"
                activeClassName="active-tab-route"
                activeStyle={activeStyle}
                style={style}>
                    <Home/>
                </NavLink>
                <NavLink to="/search" className="flex-fill center-items"
                activeClassName="active-tab-route" activeStyle={activeStyle}
                style={style}>
                    <SearchSvg/>
                </NavLink>
                {context.isAuth?
                    <NavLink to="/notifications"
                    className="flex-fill center-items"
                    activeClassName="active-tab-route"
                    activeStyle={activeStyle}
                    style={style} onClick={readAllNotifications}>
                        <NotificationsContainer inBox/>
                    </NavLink>:null
                }

                {context.isAuth?
                    <NavLink to="/messages"
                    activeClassName="active-tab-route"
                    className="flex-fill center-items"
                    activeStyle={activeStyle}
                    style={style} onClick={readAllMessages}>
                    <div style={{position:'relative'}}>
                        <MessageSvg/>
                        {notificationsContext.notifications.filter(n=>n.verb=='message' && n.unread==true).length>0?
                        <span className="new-circle">

                        </span>:null}
                        </div>
                    </NavLink>:null
                }
                <SideDrawer>
                    <Profile/>
                </SideDrawer>
        </div>
    )  
}

function ProfileDropDown({setFocused}){
    const context = useContext(UserContext);

    function unFocus(){
        setFocused(false);
    }

    return(
        <div className="hoverable-box" style={{width:150,borderRadius:15}}>
            <div className="flex-fill" 
            style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a',flexFlow:'column',WebkitFlexFlow:'column',borderRadius:5,
            overflow:'hidden'}}>

                <RoutedTabs
                tabClassName="profile-dropdown-option"
                className="flex-fill profile-dropdown-container"
                activeTabClassName="active"
                >
                {context.isAuth?
                    <>
                        <NavTab to={`/${context.currentBranch.uri}`} onClick={unFocus} className="profile-dropdown-option">Profile</NavTab>
                        <NavTab to="/settings" onClick={unFocus} className="profile-dropdown-option">Settings</NavTab>
                        <div style={{height:1,margin:'10px 0',backgroundColor:'gainsboro'}}></div>
                        <NavTab to="/logout/instant" onClick={unFocus} className="profile-dropdown-option">Logout</NavTab>
                    </>:
                    <>
                        <NavTab to="/login" onClick={unFocus} className="profile-dropdown-option">Login</NavTab>
                        <NavTab to="/register" onClick={unFocus} className="profile-dropdown-option">Register</NavTab>
                    </>
                }
                </RoutedTabs>
            </div>
        </div>
    )
}

function Home(props){
    return(
        <div style={{display:'flex',alignItems:'center'}}>
            {/*<span className="material-icons user-color">home</span>
            <span style={{color: "#156bb7",fontWeight:500,fontSize:17}}>Home</span>*/}
            <HomeSvg/>
        </div>
    )
}


function Profile(){
    const context = useContext(UserContext);
    const [focused,setFocused] = useState(false);
    const ref = useRef(null)
    let imageUrl = context.isAuth?context.currentBranch.branch_image:'https://icon-library.net//images/default-user-icon/default-user-icon-8.jpg';
    
    function handleClick(){
        setFocused(!focused);
    }

    useEffect(()=>{
        document.addEventListener("click", handleClickOutside, false);

        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    },[])

    const handleClickOutside = event => {
        if (ref.current && !ref.current.contains(event.target)) {
          setFocused(false);
        }
    };

    return(
        <div ref={ref} style={{position:'relative',cursor:'pointer'}}>
            <div onClick={handleClick} className="round-picture" style={{
                width:32,
                height:32,
                backgroundImage:`url(${imageUrl})`}}>
            </div>
            {focused && !isMobile?<ProfileDropDown setFocused={setFocused}/>:null}
        </div>
    )
}

function Search(){
    const [results,setResults] = useState([])
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const wrapperRef = useRef(null);

    async function getResults(){
        let safeText = text.trim()
        const response = safeText ? await axios.get(`/api/search/?branch=${safeText}`): null

        if(response && Array.isArray(response.data)){
            setResults(response.data)
        }
    }

    useEffect(()=>{
        if(focused){
            getResults();
        }
        document.addEventListener("click", handleClickOutside, false);
        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    },[text])

    const handleClickOutside = event => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setFocused(false);
        }
    };

    function handleClick(e){
        setText('');
        setFocused(false);
    }

    return(
        <div style={{position:'relative',height:'65%'}} ref={wrapperRef}>
            <input
                placeholder="Search"
                className="search-button"
                value={text}
                onChange={e=> setText(e.target.value)}
                onFocus={e=> setFocused(true)}
                
            />
           {focused && text?<SearchResults results={results.slice(0,5)} onclic={e=>{handleClick(e)}}/>:null}
        </div>
    )
}
//onBlur={e=> setFocused(false)}
function SearchResults({results,onclic}){
    const [displayedResults, setDisplayedResults] = useState([]);

    useEffect(()=>{
         
        var r = results.map(r => {
            return <ResultBranch branch={r} onclic={onclic}/>
        })
        setDisplayedResults(r);
    },[results])

    return(
        <div style={{position:'absolute',width:'100%',marginTop:10}}>
            <div style={{position:'relative',height:10}}>
                <div className="arrow-upper"></div>
                <div className="arrow-up"></div>
            </div>
            
            <div style={{backgroundColor:'white',padding:10,boxShadow:'0px 0px 1px 1px #0000001a'}}> 
                {displayedResults}
            </div>
        </div>
    )
}

function ResultBranch({branch,onclic}){
    return(
        <Link to={`/${branch.uri}`} className="search-small-result" style={{color:'#000000d6',textDecoration:'none'}} onClick={onclic}>
            <div style={{marginTop:5,marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center'}}>
                    <img src={branch.branch_image} style={{width:28,height:28,borderRadius:'50%'}}></img>
                    <div style={{marginLeft:10,fontSize:'1.8em'}}>
                        <span style={{fontWeight:'bold'}}>{branch.name}</span>
                        <span style={{color:'gray',fontSize:'0.9em'}}>@{branch.uri}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}



const HomeSvg = props => (
    <div className="flex-fill" style={{borderRadius:'50%',overflow:'hidden',
    WebkitMaskImage:'-webkit-radial-gradient(white, black)'}}>
        <svg className="nav-icon" x="0px" y="0px" viewBox="0 0 260 260" xmlSpace="preserve" {...props}>
        <path
            d="M228.9 100.7l-92.4-68.5c-4-3-9.4-3-13.4 0l-92.4 68.5c-1.3.9-2 2.4-2 4v21.7c0 2.8 2.2 5 5 5h7.5v88c0 6.2 5 11.2 11.2 11.2h154.9c6.2 0 11.2-5 11.2-11.2v-88h7.4c2.8 0 5-2.2 5-5v-21.7c0-1.6-.7-3.1-2-4zM110.1 220.5v-52h39.6v52h-39.6zm103.4-99.1h-12.4c-2.8 0-5 2.2-5 5s2.2 5 5 5h7.4v88c0 .7-.5 1.2-1.2 1.2h-47.7v-57c0-2.8-2.2-5-5-5H105c-2.8 0-5 2.2-5 5v57H52.4c-.7 0-1.2-.5-1.2-1.2v-88h7.4c2.8 0 5-2.2 5-5s-2.2-5-5-5H38.8v-14.2l90.4-67c.4-.3 1-.3 1.4 0l90.4 67v14.2h-7.5z"
            fill="#212121"
        />
        </svg>
    </div>
);


const SearchSvg = props => (
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
            d="M104.3 166.2c-34.1 0-61.9-27.8-61.9-61.9 0-34.1 27.8-61.9 61.9-61.9s61.9 27.8 61.9 61.9c0 34.2-27.7 61.9-61.9 61.9zm0-113.8c-28.6 0-51.9 23.3-51.9 51.9 0 28.6 23.3 51.9 51.9 51.9 28.6 0 51.9-23.3 51.9-51.9 0-28.6-23.3-51.9-51.9-51.9z"
        />
        <path
            className="st0"
            d="M69.1 123.6c-2 0-3.9-1.2-4.6-3.1-2.1-5.1-3.1-10.5-3.1-16.1 0-2.8 2.2-5 5-5s5 2.2 5 5c0 4.3.8 8.4 2.4 12.3 1 2.6-.2 5.5-2.8 6.5-.6.2-1.2.4-1.9.4zM69.1 95.1c-.6 0-1.3-.1-1.9-.4-2.6-1-3.8-4-2.8-6.5 6.6-16.3 22.2-26.8 39.8-26.8 2.8 0 5 2.2 5 5s-2.2 5-5 5c-13.5 0-25.5 8.1-30.5 20.6-.7 1.9-2.6 3.1-4.6 3.1z"
        />
        <path
            className="st0"
            d="M218.2 236.6c-4.7 0-9.4-1.8-13-5.4L147 173c-16.2 10.1-35.3 14.1-54.5 11.3-35.7-5.1-63.8-33.6-68.4-69.4-3.2-25.3 5.1-50 23-67.9C65 29.3 89.7 20.9 115 24.1c35.8 4.6 64.3 32.7 69.4 68.4 2.7 19.1-1.3 38.3-11.3 54.5l58.2 58.2c7.2 7.2 7.2 18.9 0 26.1-3.7 3.5-8.4 5.3-13.1 5.3zm-70.6-75c1.3 0 2.6.5 3.5 1.5l61 61c3.3 3.3 8.6 3.3 11.9 0 3.3-3.3 3.3-8.6 0-11.9l-61-61c-1.7-1.7-2-4.4-.6-6.4 10.3-14.8 14.5-32.8 12-50.9C170 62.7 145 38.1 113.7 34c-22.2-2.8-43.9 4.5-59.5 20.2-15.7 15.7-23 37.4-20.1 59.5 4 31.3 28.6 56.3 59.9 60.7 18 2.6 36.1-1.7 50.8-12 .8-.5 1.8-.8 2.8-.8z"
        />
        </svg>
    </div>
);

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