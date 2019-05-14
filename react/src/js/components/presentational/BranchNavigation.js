import React, { Component, useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import {ActionArrow} from "./Temporary"

export class BranchNavigation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div style={{position:'sticky',top:51,zIndex:5000}}>
                <div style={{height:'100%',position:'absolute',left:100,width:210,display:'flex',alignItems:'center'}}>
                    <DropProfile branch={this.props.branch}/>
                </div>
                <div style={{backgroundColor:'white',boxShadow:'0 4px 4px -4px rgba(0,0,0,0.25)'}}>
                    <div id="branch-navigation" className="group-navigation-container flex-fill">
                        <FeedButton branch={this.props.branch}/>
                        <ChatButton branch={this.props.branch}/>
                        <BranchesButton branch={this.props.branch}/>
                    </div>
                </div>
                <ActionArrow refresh={this.props.refresh}/>
            </div>   
        )
    }
}

function FollowButton(){
    return(
        <button
            style={{
            border: "2px solid rgb(34, 98, 160)",
            background: "transparent",
            borderRadius: 20,
            margin:'0 auto',
            padding: "8px 30px",
            fontSize: "1.6em",
            fontWeight: 600,
            color: "rgb(34, 98, 160)"
        }}>Follow</button>
    )
}

function DropProfile({branch}){
    const [backgroundOpacity,setBackgroundOpacity] = useState(0);
    const [className,setClassName] = useState("");

    useEffect(()=>{
        var branchNavigation = document.getElementById('branch-navigation');
        var scrollListener = function(e) {
            var viewportOffset = branchNavigation.getBoundingClientRect();
            if(viewportOffset.top===50){
                setBackgroundOpacity(1);
            }
            else{
                setBackgroundOpacity(0);
            }
        }

        window.addEventListener('scroll', scrollListener);

        return () => {
            window.removeEventListener('scroll', scrollListener);
        };
    })

    return(
        <img src={branch.branch_image} className="opacity-animation" style={{
        width:38,
        height:38,
        objectFit:'cover',
        borderRadius:'50%',
        position:'absolute',
        left:0,
        opacity:backgroundOpacity}}>

        </img>
    )
}

function BannerDrop({branch}){
    const [backgroundOpacity,setBackgroundOpacity] = useState(0);
    const [className,setClassName] = useState("");

    useEffect(()=>{
        var branchNavigation = document.getElementById('branch-navigation');
        var scrollListener = function(e) {
            var viewportOffset = branchNavigation.getBoundingClientRect();
            if(viewportOffset.top===150){
                setBackgroundOpacity(1);
                setClassName("slide-bottom");
            }
            else{
                setBackgroundOpacity(0);
                setClassName("slide-top");
            }
        }

        window.addEventListener('scroll', scrollListener);

        return () => {
            window.removeEventListener('scroll', scrollListener);
        };
    })

    return(
        <div className={className} /*set className={className} and remove opacity for slide animation*/ style={{width:38,position:'fixed',height:38,top:-50,left:0,backgroundColor:'transparent',
        /*opacity:backgroundOpacity,*/
        backgroundImage:`url(${branch.branch_banner})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center center"}}>

        </div>
    )
}

function WhiteBackGround(){
    const [backgroundColor,setBackgroundColor] = useState("transparent");
    const [boxShadow,setBoxShadow] = useState("none");

    function checkViewPort(viewportOffset){
        if(viewportOffset.top===150){
            setBackgroundColor("white");
            setBoxShadow('0px 2px 2px -2px');
        }
        else{
            setBackgroundColor("transparent");
            setBoxShadow('none');
        }
    }

    useEffect(()=>{
        var branchNavigation = document.getElementById('branch-navigation');

        var viewportOffset = branchNavigation.getBoundingClientRect();
        checkViewPort(viewportOffset);

        var scrollListener = function(e) {
            var viewportOffset = branchNavigation.getBoundingClientRect();
            checkViewPort(viewportOffset);
        }

        window.addEventListener('scroll', scrollListener);

        return () => {
            window.removeEventListener('scroll', scrollListener);
        };
    })

    return(
        <div style={{width:'100vw',position:'fixed',height:50,top:150,left:0,backgroundColor:backgroundColor,boxShadow:boxShadow}}>

        </div>
    )
}

function useHandleButton(branch, buttonLink){
    const [className,setClassName] = useState('');

    useEffect(() => {
        let match1 = `/${branch.uri}/${buttonLink}/`;
        let match2 = `/${branch.uri}/${buttonLink}`;
        
        let match3 = `/${branch.uri}/`;
        let match4 = `/${branch.uri}`;
        if(window.location.pathname === match1 || window.location.pathname === match2){
            setClassName("clicked-navigation-button");
        }
        else if((window.location.pathname === match3 || window.location.pathname === match4) && buttonLink===''){
            setClassName("clicked-navigation-button");
        }
        else{
            setClassName("");
        }
    })

    return className;
}

const FeedButton = ({branch}) => {
    const className = useHandleButton(branch,'');

    return(
        <Link to={`/${branch.uri}`} className={`user-color group-navigation-button ${className}`}>
            
            <div className="navigation-button-text">
                {/*<i className="material-icons navigation-icon">list</i>*/}
                <div style={{padding:10}}>Posts</div>
            </div>
        </Link>
    )
}

const ChatButton = ({branch}) => {
    const className = useHandleButton(branch,'chat');

    return(
        <Link to={`/${branch.uri}/chat`}  className={`user-color group-navigation-button ${className}`}>
            <div className="navigation-button-text">
                {/*<i className="material-icons navigation-icon">chat_bubble_outline</i>*/}
                <div style={{padding:10}}>Chat</div>
            </div>
        </Link>
    )
}

const BranchesButton = ({branch}) => {
    const className = useHandleButton(branch,'branches');

    return(
        <Link to={`/${branch.uri}/branches`} className={`user-color group-navigation-button ${className}`}>
            <div className="navigation-button-text">
                {/*<i className="material-icons navigation-icon">more</i>*/}
                <div style={{padding:10}}>{branch.children.length} Branches</div>
            </div>
        </Link>
    )
}