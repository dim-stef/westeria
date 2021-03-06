import React, {useContext, useEffect, useRef, useState} from "react";
import {Link, NavLink} from "react-router-dom"
import { css } from "@emotion/core";
import {useTheme as useEmotionTheme} from "emotion-theming"
import { createRipples } from 'react-ripples';
import {NotificationsContext, UserContext,LandingPageContext} from "../container/ContextContainer"
import {NotificationsContainer} from "./Notifications"
import {SideDrawer} from "./SideDrawer"
import {Messages} from "./Messages";
import {NavTab, RoutedTabs} from "react-router-tabs";
import {isMobile} from 'react-device-detect';
import {Desktop, Mobile, Tablet} from './Responsive'
import {useTheme} from "../container/ThemeContainer";
import {askForPermissionToReceiveNotifications} from '../../push-notification';
import history from "../../history"
import axios from 'axios'

function getScrollbarWidth() {

    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);
  
    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);
  
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
  
    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
  
    return scrollbarWidth;
  
  }

const Ripple = createRipples({
    color: '#607d8b21',
    during: 600,
})

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
        if(notificationsContext.notifications.filter(n=>n.unread==true).length!=0){
            shouldUpdate = true;
        }

        let newNotifications = notificationsContext.notifications.map(n=>{
            n.unread = false;
            return n;
        })

        // prevent infinite update loop
        if(shouldUpdate){
            notificationsContext.setNotifications(newNotifications);
        }
    }

    function readContextMessages(){
        let shouldUpdate = false;
        if(notificationsContext.messages.filter(n=>n.unread==true).length!=0){
            shouldUpdate = true;
        }
        
        let newMessages = notificationsContext.messages.map(n=>{
            n.unread = false;
            return n;
        })

        // prevent infinite update loop
        if(shouldUpdate){
            notificationsContext.setMessages(newMessages);
        }
    }

    let notificationUri = '/api/notifications/mark_all_notifications_as_read/';
    let messageUri = '/api/notifications/mark_all_messages_as_read/';

    let props = {
        readAllMessages:(match, location)=>readNotifications(messageUri,readContextMessages,match, location),
        readAllNotifications:(match, location)=>readNotifications(notificationUri,readContextNotifications, match, location)
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

const navBarContainer = theme => css({
    borderBottom:`2px solid transparent`,
    justifyContent:'center',
    height:'100%'
})

//0px 0px 4px 0px #0000004d

const navBarPositioner = (theme,isDark) => css({
    height: 50,
    position: "fixed",
    width: "100%",
    backgroundColor: theme.navBarColor,
    boxShadow:isDark?null:'0px 0px 4px 0px #0000004d',
    maxWidth:1200,
    zIndex: 1001,
    top:0,
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    paddingRight:getScrollbarWidth(),
    borderBottomRightRadius:15,
    borderBottomLeftRadius:15
})


export function DesktopNavigationBar({readAllMessages,readAllNotifications}){

    const getTheme = useTheme();
    const context = useContext(UserContext);
    const notificationsContext = useContext(NotificationsContext);

    let activeStyle={
        borderBottom:'2px solid #2397f3'
    };
    let style={
        justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',WebkitAlignItems:'center',height:'100%',width:'100%'
    }
    return(
        <div css={theme=>navBarPositioner(theme,getTheme.isDark)}
        >
            <div className="flex-fill" css={theme=>navBarContainer(theme)}>
                <Ripple>
                    <NavLink exact to={{pathname:"/",state:'front'}} className="flex-fill nav-icon-container center-items"
                    activeStyle={activeStyle} activeClassName="active-tab-route"
                    style={style}>
                        <Home/>
                    </NavLink>
                </Ripple>
                <Ripple>
                    <NavLink to={{pathname:"/search",state:'search'}} className="flex-fill nav-icon-container center-items" 
                    activeClassName="active-tab-route"
                    style={style} activeStyle={activeStyle}>
                        <SearchSvg/>
                    </NavLink>
                </Ripple>
                {context.isAuth?
                    <Ripple>
                        <NavLink to={{pathname:"/notifications",state:'notifications'}}
                        activeClassName="active-tab-route" className="flex-fill nav-icon-container center-items"
                        style={style} activeStyle={activeStyle} onClick={readAllNotifications}>
                            <NotificationsContainer inBox/>
                        </NavLink>
                    </Ripple>:null
                }

                {context.isAuth?
                    <Ripple>
                        <NavLink to={{pathname:"/messages",state:'messages'}} 
                        activeClassName="active-tab-route" className="flex-fill nav-icon-container center-items"
                        style={style} activeStyle={activeStyle} onClick={readAllMessages}>
                        <div style={{position:'relative'}}>
                        <Messages/>
                        {notificationsContext.messages.filter(n=>n.unread==true).length>0?
                            <span className="new-circle">

                            </span>:null}
                        </div>
                            
                        </NavLink>
                    </Ripple>:null
                }
                {!context.isAuth?
                <div className="flex-fill center-items"
                style={style}>
                    <Profile/>
                </div>:null}
            </div>
        </div>
    )
}


const mobileNavBarPositioner = theme => css({
    height: 50,
    position: 'fixed',
    width: '100%',
    backgroundColor: theme.navBarColor,
    boxShadow:'0px 0px 4px 0px #0000004d',
    zIndex: 1001,
    alignItems: 'center',
    bottom: 0
})

const mobileNavBarContainer = theme => css({
    boxSizing:'border-box',
    borderTop:`2px solid transparent`,
    height:'100%',
    width:'100%',
    textDecoration:'none',
})

export function MobileNavigationBar({readAllMessages,readAllNotifications}){
    const context = useContext(UserContext);
    const navRef = useRef(null);
    const homeRef = useRef(null)
    const searchRef = useRef(null);
    const messRef = useRef(null);
    const notRef = useRef(null);
    const profRef = useRef(null);
    const [drawerOpen,setDrawerOpen] = useState(false);
    const notificationsContext = useContext(NotificationsContext);
    const [touchCoordinates,setCoordinates] = useState(null)
    let activeStyle={borderTop:'2px solid #2397f3'};


    function handleSendToTop(){
        if(location.pathname==='/'){
            let scrollElement = document.getElementById('mobile-content-container')
            try{
                scrollElement.scrollTo({top:0,behavior:'smooth'})
            }catch(e){
                scrollElement.scrollTop = 0
            }
        }
    }

    return(
        <div ref={navRef} className="flex-fill" id="mobile-nav-bar" css={theme=>mobileNavBarPositioner(theme)}>
            <div style={{width:'100%',height:'100%'}} onClick={handleSendToTop}>
                <Ripple>
                    <NavLink exact to={{pathname:"/",state:'front'}} className="flex-fill center-items"
                    activeClassName="active-tab-route"
                    activeStyle={activeStyle}
                    css={theme=>mobileNavBarContainer(theme)}>
                        <div ref={homeRef} className="flex-fill center-items" style={{width:'100%',height:'100%'}}>
                            <Home/>
                        </div>
                    </NavLink>
                </Ripple>
            </div>
            <Ripple>
                <NavLink to={{pathname:"/search",state:'search'}} className="flex-fill center-items"
                activeClassName="active-tab-route" activeStyle={activeStyle}
                css={theme=>mobileNavBarContainer(theme)}>
                    <div ref={searchRef} className="flex-fill center-items" style={{width:'100%',height:'100%'}}>
                        <SearchSvg/>
                    </div>
                </NavLink>
            </Ripple>
            {context.isAuth?
                <Ripple>
                    <NavLink to={{pathname:"/notifications",state:'notifications'}}
                    className="flex-fill center-items"
                    activeClassName="active-tab-route"
                    activeStyle={activeStyle}
                    css={theme=>mobileNavBarContainer(theme)} 
                    onClick={readAllNotifications}>
                        <div ref={notRef} className="flex-fill center-items" style={{width:'100%',height:'100%'}}>
                            <NotificationsContainer inBox/>
                        </div>
                    </NavLink>
                </Ripple>:null
            }

            {context.isAuth?
                <Ripple>
                    <NavLink to={{pathname:"/messages",state:'messages'}}
                    activeClassName="active-tab-route"
                    className="flex-fill center-items"
                    activeStyle={activeStyle}
                    css={theme=>mobileNavBarContainer(theme)} onClick={readAllMessages}>
                        <div ref={messRef} className="flex-fill center-items" style={{width:'100%',height:'100%'}}>
                            <div style={{position:'relative'}}>
                                <Messages/>
                                {notificationsContext.messages.filter(n=>n.unread==true).length>0?
                                <span className="new-circle">

                                </span>:null}
                            </div>
                        </div>
                    </NavLink>
                </Ripple>:null
            }
            {!context.isAuth?
            <div ref={profRef} className="flex-fill center-items" style={{width:'100%',height:'100%'}}>
                <Profile/>
            </div>
            :null}
        </div>
    )  
}

function ProfileDropDown({setFocused}){
    const context = useContext(UserContext);
    const theme = useTheme();
    const emotionTheme = useEmotionTheme();
    
    function unFocus(){
        setFocused(false);
    }

    return(
        <div className="hoverable-box" style={{width:150,borderRadius:15}}>
            <div className="flex-fill" 
            style={{backgroundColor:emotionTheme.backgroundDarkColor,
            boxShadow:'0px 0px 1px 1px #0000001a',flexFlow:'column',WebkitFlexFlow:'column',borderRadius:5,
            overflow:'hidden'}}>

                <RoutedTabs
                tabClassName="profile-dropdown-option"
                className="flex-fill profile-dropdown-container"
                activeTabClassName="active"
                >
                {context.isAuth?
                    <>
                        <NavTab to={`/${context.currentBranch.uri}`} onClick={unFocus} className="profile-dropdown-option"
                        style={{color:emotionTheme.textColor}}>Profile</NavTab>
                        <NavTab to="/settings" onClick={unFocus} className="profile-dropdown-option"
                        style={{color:emotionTheme.textColor}}>Settings</NavTab>
                        <button className="profile-dropdown-option" 
                        style={{textAlign:'inherit',backgroundColor:'inherit',border:0,color:emotionTheme.textColor}} 
                        onClick={theme.toggle}>
                        {theme.dark?'Light mode':'Dark mode'}</button>

                        <div style={{height:1,margin:'10px 0',backgroundColor:'gainsboro'}}></div>
                        <NavTab to="/logout/instant" onClick={unFocus} className="profile-dropdown-option"
                        style={{color:emotionTheme.textColor}}>Logout</NavTab>
                    </>:
                    <>
                        <NavTab to="/login" onClick={unFocus} className="profile-dropdown-option"
                        style={{color:emotionTheme.textColor}}>Login</NavTab>
                        <NavTab to="/register" onClick={unFocus} className="profile-dropdown-option"
                        style={{color:emotionTheme.textColor}}>Register</NavTab>
                        <button className="profile-dropdown-option" 
                        style={{textAlign:'inherit',backgroundColor:'inherit',border:0,color:emotionTheme.textColor}} 
                        onClick={theme.toggle}>
                        {theme.dark?'Light mode':'Dark mode'}</button>
                    </>
                }
                </RoutedTabs>
            </div>
        </div>
    )
}

function Home(props){
    return(
        <div css={{display:'flex',alignItems:'center'}}>
            <HomeSvg/>
        </div>
    )
}


function Profile(){
    const context = useContext(UserContext);
    const landingPageContext = useContext(LandingPageContext);
    const [focused,setFocused] = useState(false);
    const ref = useRef(null)
    
    function handleClick(){
        landingPageContext.setOpen(true);
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
        <div ref={ref} style={{position:'relative',cursor:'pointer',width:'100%',height:'100%'}} className="flex-fill center-items" 
        onClick={handleClick}>
        {context.isAuth?
            <div className="round-picture" style={{
                width:32,
                height:32,
                backgroundImage:`url(${context.currentBranch.branch_image})`}}>
        </div>:<UserSvg css={theme=>({fill:theme.textColor,width:32,height:32,'@media (max-device-width:767px)':{
            height:28,width:28
        }})}/>}
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

const icon = theme =>css({
    fill:theme.textColor
})

const HomeSvg = props => (
    <div className="flex-fill" style={{borderRadius:'50%',overflow:'hidden',
    WebkitMaskImage:'-webkit-radial-gradient(white, black)'}}>
        <svg className="nav-icon" x="0px" y="0px" viewBox="0 0 260 260" xmlSpace="preserve" {...props}>
        <path
            d="M228.9 100.7l-92.4-68.5c-4-3-9.4-3-13.4 0l-92.4 68.5c-1.3.9-2 2.4-2 4v21.7c0 2.8 2.2 5 5 5h7.5v88c0 6.2 5 11.2 11.2 11.2h154.9c6.2 0 11.2-5 11.2-11.2v-88h7.4c2.8 0 5-2.2 5-5v-21.7c0-1.6-.7-3.1-2-4zM110.1 220.5v-52h39.6v52h-39.6zm103.4-99.1h-12.4c-2.8 0-5 2.2-5 5s2.2 5 5 5h7.4v88c0 .7-.5 1.2-1.2 1.2h-47.7v-57c0-2.8-2.2-5-5-5H105c-2.8 0-5 2.2-5 5v57H52.4c-.7 0-1.2-.5-1.2-1.2v-88h7.4c2.8 0 5-2.2 5-5s-2.2-5-5-5H38.8v-14.2l90.4-67c.4-.3 1-.3 1.4 0l90.4 67v14.2h-7.5z"
            css={theme=>icon(theme)}
        />
        </svg>
    </div>
);


const SearchSvg = props => (
    <div className="flex-fill" style={{borderRadius:'50%',overflow:'hidden',
    WebkitMaskImage:'-webkit-radial-gradient(white, black)'}}>
        <svg
        x="0px"
        y="0px"
        viewBox="0 0 260 260"
        xmlSpace="preserve"
        className="nav-icon"
        {...props}
        >
        <path
            css={theme=>icon(theme)}
            d="M104.3 166.2c-34.1 0-61.9-27.8-61.9-61.9 0-34.1 27.8-61.9 61.9-61.9s61.9 27.8 61.9 61.9c0 34.2-27.7 61.9-61.9 61.9zm0-113.8c-28.6 0-51.9 23.3-51.9 51.9 0 28.6 23.3 51.9 51.9 51.9 28.6 0 51.9-23.3 51.9-51.9 0-28.6-23.3-51.9-51.9-51.9z"
        />
        <path
            css={theme=>icon(theme)}
            d="M69.1 123.6c-2 0-3.9-1.2-4.6-3.1-2.1-5.1-3.1-10.5-3.1-16.1 0-2.8 2.2-5 5-5s5 2.2 5 5c0 4.3.8 8.4 2.4 12.3 1 2.6-.2 5.5-2.8 6.5-.6.2-1.2.4-1.9.4zM69.1 95.1c-.6 0-1.3-.1-1.9-.4-2.6-1-3.8-4-2.8-6.5 6.6-16.3 22.2-26.8 39.8-26.8 2.8 0 5 2.2 5 5s-2.2 5-5 5c-13.5 0-25.5 8.1-30.5 20.6-.7 1.9-2.6 3.1-4.6 3.1z"
        />
        <path
            css={theme=>icon(theme)}
            d="M218.2 236.6c-4.7 0-9.4-1.8-13-5.4L147 173c-16.2 10.1-35.3 14.1-54.5 11.3-35.7-5.1-63.8-33.6-68.4-69.4-3.2-25.3 5.1-50 23-67.9C65 29.3 89.7 20.9 115 24.1c35.8 4.6 64.3 32.7 69.4 68.4 2.7 19.1-1.3 38.3-11.3 54.5l58.2 58.2c7.2 7.2 7.2 18.9 0 26.1-3.7 3.5-8.4 5.3-13.1 5.3zm-70.6-75c1.3 0 2.6.5 3.5 1.5l61 61c3.3 3.3 8.6 3.3 11.9 0 3.3-3.3 3.3-8.6 0-11.9l-61-61c-1.7-1.7-2-4.4-.6-6.4 10.3-14.8 14.5-32.8 12-50.9C170 62.7 145 38.1 113.7 34c-22.2-2.8-43.9 4.5-59.5 20.2-15.7 15.7-23 37.4-20.1 59.5 4 31.3 28.6 56.3 59.9 60.7 18 2.6 36.1-1.7 50.8-12 .8-.5 1.8-.8 2.8-.8z"
        />
        </svg>
    </div>
);

function UserSvg(props) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 480 480"
        className="nav-icon"
        {...props}
      >
        <path d="M240 0C107.453 0 0 107.453 0 240s107.453 240 240 240c7.23 0 14.434-.324 21.602-.969 6.664-.597 13.27-1.511 19.824-2.656l2.52-.445c121.863-22.743 206.359-134.551 194.96-257.996C467.508 94.488 363.97.039 240 0zm-19.281 463.152h-.567a221.883 221.883 0 01-18.52-2.449c-.35-.062-.702-.101-1.046-.168a223.092 223.092 0 01-17.77-3.95l-1.418-.362a223.244 223.244 0 01-16.949-5.352c-.578-.207-1.16-.39-1.738-.605-5.465-2.008-10.832-4.258-16.117-6.692-.656-.293-1.313-.574-1.969-.887-5.184-2.398-10.266-5.101-15.25-7.945-.703-.398-1.414-.797-2.117-1.191a226.827 226.827 0 01-14.403-9.176c-.71-.496-1.43-.977-2.136-1.473a224.986 224.986 0 01-13.512-10.398L96 411.449V344c.059-48.578 39.422-87.941 88-88h112c48.578.059 87.941 39.422 88 88v67.457l-1.063.887a217.439 217.439 0 01-13.777 10.601c-.625.438-1.258.856-1.879 1.285a223.69 223.69 0 01-14.625 9.336c-.625.364-1.265.707-1.886 1.067-5.06 2.879-10.204 5.597-15.45 8.047-.601.28-1.207.543-1.816.8a220.521 220.521 0 01-16.246 6.743c-.547.203-1.098.379-1.602.57-5.601 2.008-11.281 3.824-17.031 5.383l-1.379.344a225.353 225.353 0 01-17.789 3.96c-.344.063-.687.106-1.031.16a222.58 222.58 0 01-18.54 2.458h-.566c-6.398.55-12.8.847-19.28.847-6.481 0-12.935-.242-19.321-.793zM400 396.625V344c-.066-57.41-46.59-103.934-104-104H184c-57.41.066-103.934 46.59-104 104v52.617C-6.164 308.676-5.203 167.68 82.148 80.918 169.5-5.84 310.5-5.84 397.852 80.918c87.351 86.762 88.312 227.758 2.148 315.7zm0 0"></path>
        <path d="M240 64c-44.184 0-80 35.816-80 80s35.816 80 80 80 80-35.816 80-80c-.047-44.164-35.836-79.953-80-80zm0 144c-35.348 0-64-28.652-64-64s28.652-64 64-64 64 28.652 64 64c-.04 35.328-28.672 63.96-64 64zm0 0"></path>
      </svg>
    );
}