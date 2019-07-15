import React, { Component, useState,useEffect,useRef,useContext } from "react";
import {Link, NavLink } from "react-router-dom"
import Responsive from 'react-responsive';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {UserContext} from "../container/ContextContainer"
import {FrontPage,FrontPageFeed} from "./Routes"
import {NotificationsContainer} from "./Notifications"
import {ChatRoomsContainer} from "../container/ChatRoomsContainer"
import { RoutedTabs, NavTab } from "react-router-tabs";
import axios from 'axios'


const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
const Tablet = props => <Responsive {...props} minDeviceWidth={768} maxDeviceWidth={1223} />;
const Mobile = props => <Responsive {...props} maxDeviceWidth={767} />;

export default class NavigationBar extends Component{
    static contextType = UserContext
    render(){
        return(
            <div style={{
                    height: 50,
                    position: "fixed",
                    width: "100%",
                    backgroundColor: "white",
                    zIndex: 5,
                    top:0
                }}
            >
            <div style={{display:'flex',
                    justifyContent:'space-between',
                    borderBottom:'2px solid #c3c3c3',
                    height:'100%',
                    margin:'0 auto',
                    maxWidth:1200}}>
                    <Home/>
                    <Search/>
                    <div style={{display:'flex'}}>
                        {this.context.isAuth ?
                            <>
                                <Notifications/>
                                <Profile/>
                            </>
                        : null}
                    </div>
            </div>
                
            </div>
        )
    }
}

export function TabbedNavigationBar(){
    const context = useContext(UserContext);

    return(
        <div style={{
            height: 50,
            position: "fixed",
            width: "100%",
            backgroundColor: "white",
            zIndex: 5,
            top:0
        }}
        >
            <div style={{display:'flex',
                justifyContent:'space-between',
                borderBottom:'2px solid rgb(226, 234, 241)',
                height:'100%',
                margin:'0 auto',
                maxWidth:1200}}>
                <NavLink exact to="/" className="flex-fill" activeClassName="active-tab-route"
                style={{justifyContent:'center',alignItems:'center',height:'100%',width:'100%',textDecoration:'none'}}>
                    <Home/>
                </NavLink>
                <NavLink to="/search" className="flex-fill" activeClassName="active-tab-route"
                style={{justifyContent:'center',alignItems:'center',height:'100%',width:'100%'}}>
                    <SearchSvg/>
                </NavLink>
                {context.isAuth?
                    <NavLink to="/notifications" activeClassName="active-tab-route" className="flex-fill"
                    style={{justifyContent:'center',alignItems:'center',height:'100%',width:'100%'}}>
                        <NotificationsContainer inBox/>
                    </NavLink>:null
                }

                {context.isAuth?
                    <div className="flex-fill"
                    style={{justifyContent:'center',alignItems:'center',height:'100%',width:'100%'}}>
                        <MessageSvg/>
                    </div>:null
                }
                
                {context.isAuth?
                    <div className="flex-fill"
                    style={{justifyContent:'center',alignItems:'center',height:'100%',width:'100%'}}>
                        <Profile/>
                    </div>:null
                }
   
            </div>
        </div>
    )
}

export function MobileNavigationBar(){
    /*if ('scrollRestoration' in history) {
        // Back off, browser, I got this...
        history.scrollRestoration = 'manual';
    }*/

    //console.log(history)
    return(
        <div className="flex-fill" 
        style={{position:'fixed',top:0,zIndex:10,height:60,backgroundColor:'white',width:'100%',alignItems:'center'}}>
            <div style={{width:'100%',textAlign:'center'}}>
                <NavLink to="/">Home</NavLink>
            </div>
            <div style={{width:'100%',textAlign:'center'}}>
                <Link to="/search">Search</Link>
            </div>
            
        </div>
    )  
}

export function MobileNavigationBar2(){
    return(
        <Tabs>
            <TabList>
            <Tab>Title 1</Tab>
            <Tab>Title 2</Tab>
            <Tab>Title 3</Tab>
            <Tab>Title 4</Tab>
            </TabList>

            <TabPanel>
                <FrontPageFeed device="tablet"/>
            </TabPanel>
            <TabPanel>
            <h2>Any content 2</h2>
            </TabPanel>
            <TabPanel>
            <h2>Any content 3</h2>
            </TabPanel>
            <TabPanel>
            <h2>Any content 4</h2>
            </TabPanel>
        </Tabs>
    )  
}

function Notifications(props){
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
        <div style={{position:'relative'}}>
            <button onClick={handleClick} style={{height:'100%',width:50,backgroundColor:'transparent',border:0}}>
                <NotificationsSvg/>
            </button>
            {isOpen?<NotificationsBox notifications={notifications}/>:null}
        </div>
    )
}

function NotificationsBox({notifications}){
    function renderNotifications(){
        return notifications.map(n=>{
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
        })
    }
    return(
        <div style={{position:'absolute',width:500,marginTop:10,right:0}}>
            <div style={{position:'relative',height:10}}>
                <div style={{right:79,left:'auto'}} className="arrow-upper"></div>
                <div style={{right:80,left:'auto'}} className="arrow-up"></div>
            </div>
            
            <div style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a'}}> 
                {notifications.length>0?renderNotifications():null}
            </div>
        </div>
    )
}

function ProfileDropDown(){
    const context = useContext(UserContext);

    return(
        <div style={{position:'absolute',width:150,marginTop:10,right:0}}>
            <div style={{position:'relative',height:10}}>
                <div style={{right:7,left:'auto'}} className="arrow-upper"></div>
                <div style={{right:8,left:'auto'}} className="arrow-up"></div>
            </div>
            
            <div className="flex-fill" 
            style={{backgroundColor:'white',boxShadow:'0px 0px 1px 1px #0000001a',flexFlow:'column'}}> 

                <RoutedTabs
                tabClassName="profile-dropdown-option"
                className="flex-fill profile-dropdown-container"
                activeTabClassName="active"
                >
                <NavTab to={`/${context.currentBranch.uri}`} >Profile</NavTab>
                <NavTab to="/settings" >Settings</NavTab>
                <div style={{height:1,margin:'10px 0',backgroundColor:'gainsboro'}}></div>
                <NavTab to="/logout" >Logout</NavTab>
                </RoutedTabs>
            </div>
        </div>
    )
}

function Home(props){
    return(
        <Link to="/" style={{textDecoration:'none'}}>
            <div style={{display:'flex',alignItems:'center'}}>
                <span className="material-icons user-color">home</span>
                <span style={{color: "#156bb7",fontWeight:500,fontSize:17}}>Home</span>
            </div>
        </Link>
    )
}


class ProfilePictureButton extends Component{
    static contextType = UserContext
    render(){
        return(
            <Link to={`/${this.context.currentBranch.uri}`}>
                <div style={{
                        width:32,
                        height:32,
                        backgroundImage:`url(${this.context.currentBranch.branch_image})`, 
                        backgroundRepeat:'no-repeat',
                        backgroundSize:'cover',
                        backgroundPosition:'center',
                        borderRadius:'50%',
                        border:0}}>
                </div>
            </Link>
        )
    }
}


function Profile(){
    const context = useContext(UserContext);
    const [focused,setFocused] = useState(false);

    function handleClick(){
        setFocused(!focused);
    }

    return(
        <div style={{position:'relative'}}>
            <div onClick={handleClick} className="round-picture" style={{
                width:32,
                height:32,
                backgroundImage:`url(${context.currentBranch.branch_image})`}}>
            </div>
            {focused?<ProfileDropDown/>:null}
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
        console.log(results)
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

function SearchSvg({fill='#424242'}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="475.084px"
            height="475.084px"
            viewBox="0 0 475.084 475.084"
            style={{ enableBackground: "new 0 0 475.084 475.084", height:25,width:25,fill:fill}}
            xmlSpace="preserve"
            >
            <path d="M464.524 412.846l-97.929-97.925c23.6-34.068 35.406-72.047 35.406-113.917 0-27.218-5.284-53.249-15.852-78.087-10.561-24.842-24.838-46.254-42.825-64.241-17.987-17.987-39.396-32.264-64.233-42.826C254.246 5.285 228.217.003 200.999.003c-27.216 0-53.247 5.282-78.085 15.847C98.072 26.412 76.66 40.689 58.673 58.676c-17.989 17.987-32.264 39.403-42.827 64.241C5.282 147.758 0 173.786 0 201.004c0 27.216 5.282 53.238 15.846 78.083 10.562 24.838 24.838 46.247 42.827 64.234 17.987 17.993 39.403 32.264 64.241 42.832 24.841 10.563 50.869 15.844 78.085 15.844 41.879 0 79.852-11.807 113.922-35.405l97.929 97.641c6.852 7.231 15.406 10.849 25.693 10.849 9.897 0 18.467-3.617 25.694-10.849 7.23-7.23 10.848-15.796 10.848-25.693.003-10.082-3.518-18.651-10.561-25.694zM291.363 291.358c-25.029 25.033-55.148 37.549-90.364 37.549-35.21 0-65.329-12.519-90.36-37.549-25.031-25.029-37.546-55.144-37.546-90.36 0-35.21 12.518-65.334 37.546-90.36 25.026-25.032 55.15-37.546 90.36-37.546 35.212 0 65.331 12.519 90.364 37.546 25.033 25.026 37.548 55.15 37.548 90.36 0 35.216-12.519 65.331-37.548 90.36z" />
        </svg>

    )
}

function MessageSvg({fill='#424242'}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 483.3 483.3"
            style={{ enableBackground: "new 0 0 483.3 483.3", height:25,width:25,fill:fill }}
            xmlSpace="preserve"
            >
            <path d="M424.3 57.75H59.1c-32.6 0-59.1 26.5-59.1 59.1v249.6c0 32.6 26.5 59.1 59.1 59.1h365.1c32.6 0 59.1-26.5 59.1-59.1v-249.5c.1-32.6-26.4-59.2-59-59.2zm32.1 308.7c0 17.7-14.4 32.1-32.1 32.1H59.1c-17.7 0-32.1-14.4-32.1-32.1v-249.5c0-17.7 14.4-32.1 32.1-32.1h365.1c17.7 0 32.1 14.4 32.1 32.1v249.5h.1z" />
            <path d="M304.8 238.55l118.2-106c5.5-5 6-13.5 1-19.1-5-5.5-13.5-6-19.1-1l-163 146.3-31.8-28.4c-.1-.1-.2-.2-.2-.3-.7-.7-1.4-1.3-2.2-1.9L78.3 112.35c-5.6-5-14.1-4.5-19.1 1.1-5 5.6-4.5 14.1 1.1 19.1l119.6 106.9-119.1 111.5c-5.4 5.1-5.7 13.6-.6 19.1 2.7 2.8 6.3 4.3 9.9 4.3 3.3 0 6.6-1.2 9.2-3.6l120.9-113.1 32.8 29.3c2.6 2.3 5.8 3.4 9 3.4s6.5-1.2 9-3.5l33.7-30.2 120.2 114.2c2.6 2.5 6 3.7 9.3 3.7 3.6 0 7.1-1.4 9.8-4.2 5.1-5.4 4.9-14-.5-19.1l-118.7-112.7z" />
        </svg>
    )
}