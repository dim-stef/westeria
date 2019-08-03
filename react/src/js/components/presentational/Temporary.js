import React, { Component, useState,useContext,useEffect,useRef } from "react";
import ReactDOM from 'react-dom';
import {FollowButton} from "./Card"
import {RefreshContext} from "../container/ContextContainer"
import axios from "axios"

export default function BranchFooter({branch,pending,requestId,viewedBranch}){
    console.log(branch)

    function handleAccept(){
        updateRequest('accepted');
    }

    function handleDecline(){
        updateRequest('declined');
    }

    function updateRequest(status){
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
        <div className="branch-footer flex-fill" style={{position:'relative'}}>
            <TopBar branch={branch}/>
            <DescriptionBox description={branch.description}/>
            <div className="flex-fill" style={{margin:10,width:'100%',justifyContent:'space-around'}}>
                <FollowButton uri={branch.uri} id={branch.id}/>
                {pending?
                <div>
                    <button onClick={handleAccept}>accept</button>
                    <button onClick={handleDecline}>decline</button>
                </div>
                :null}
            </div>
        </div>
    )
}

function TopBar({branch}){
    let left = 100 + 6 + 20 +10; //picture dimension + border x2 + picture left position +empty space
    return(
        <div style={{height:180,width:'100%', position:'relative'}}>
            <div style={{position:'absolute',left:left}}>
                <NameBox name={branch.name} uri={branch.uri}/>
            </div>
        </div>
    )
}

function NameBox({name,uri}){
    return(
        <div>
            <p style={{margin:0,fontSize:'2em'}}>
                {name}
            </p>
            <span style={{fontSize:'1.6em',color:'gray'}}>@{uri}</span>
        </div>
    )
}

function DescriptionBox({description}){
    return(
        <div style={{height:'100%',width:'100%',marginTop:20}}>
            <p style={{margin:'0 10px', fontSize:'1.5em'}}>{description}</p>
        </div>
    )
}

import { CSSTransition,Transition } from 'react-transition-group';

export const ToggleContent = ({ toggle, content }) => {
    const [isShown, setIsShown] = useState(false);
    const hide = () => setIsShown(false);
    const show = () => setIsShown(true);
  
    return (
        <>
            {toggle(show)}
            {isShown && content(hide)}
        </>
    );
};

export const Modal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);

var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);
    console.log(top)
    return {
        top: top,
        left: left
    };
};

function useIsScrolledTop(){
    var scrollPosition = useScrollListener();
    return scrollPosition===0?true:false;
}

function useIsScrolledTop2({el}){
    var scrollPosition = useScrollListener2(el);
    return scrollPosition===0?true:false;
}

function useScrollListener2({el}){
    const [scroll,setScroll] = useState(0);

    useEffect(()=>{
        if(el){
            var scrollListener = function (event) {
                setScroll(cumulativeOffset(el).top + 10); //was this.scrollY
            }
            el.addEventListener("scroll", scrollListener );
        }
        
        return () =>{
            if(el){
                el.removeEventListener("scroll", scrollListener);
            }    
        }
    },[])

    return scroll;
}

function useScrollListener(){
    const [scroll,setScroll] = useState(0);

    useEffect(()=>{
        var scrollListener = function (event) {
            setScroll(this.scrollY);
        }
        window.addEventListener("scroll", scrollListener );

        return () =>{
            window.removeEventListener("scroll", scrollListener );
        }
    },[])

    return scroll;
}

export function ActionArrow(){
    const context = useContext(RefreshContext);
    const ref = useRef(null);
    const [navigationTopPosition,setNavigationTopPosition] = useState(0);
    const [windowScroll,setWindowScroll] = useState(0);

    useEffect(()=>{
        if(ref){
            setNavigationTopPosition(cumulativeOffset(ref.current).top - 50);
            var scrollListener = function (event) {
                
                setWindowScroll(window.scrollY);
            }
            window.addEventListener("scroll", scrollListener );
        }
        
        return () =>{
            window.removeEventListener("scroll", scrollListener);
        }
        
    },[ref])

    function onClick(){
        if(windowScroll<navigationTopPosition + 1){
            context.refresh();
        }else{
            window.scrollTo({ top: navigationTopPosition, behavior: 'smooth' });
        }
    }
    console.log(windowScroll,navigationTopPosition);
    return(
        <div ref={ref} style={{
            position: "absolute",
            height: 60,
            top: 0,
            right: 270,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
        <button style={{border:0,backgroundColor:'transparent'}} onClick={onClick}>
            {windowScroll<navigationTopPosition + 1 ?<RefreshArrowSvg/>:<TopArrowSvg/>}
        </button>
        
        </div>
    )
}

function TopArrowSvg(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="493.348px"
            height="493.349px"
            viewBox="0 0 493.348 493.349"
            style={{
                enableBackground: "new 0 0 493.348 493.349",
                width: 21,
                height: 21
            }}
            xmlSpace="preserve"
            >
            <path
                d="M354.034 112.488L252.676 2.853C250.771.95 248.487 0 245.82 0c-2.478 0-4.665.95-6.567 2.853l-99.927 109.636c-2.475 3.049-2.952 6.377-1.431 9.994 1.524 3.616 4.283 5.424 8.28 5.424h63.954v356.315c0 2.663.855 4.853 2.57 6.564 1.713 1.707 3.899 2.562 6.567 2.562h54.816c2.669 0 4.859-.855 6.563-2.562 1.711-1.712 2.573-3.901 2.573-6.564V127.907h63.954c3.806 0 6.563-1.809 8.274-5.424 1.53-3.621 1.052-6.949-1.412-9.995z"
                style={{ fill: "#2d2d2d" }}
            />
        </svg>
    )
}

function RefreshArrowSvg(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="305.836px"
            height="305.836px"
            viewBox="0 0 305.836 305.836"
            style={{ width: 21, height: 21, fill: "rgb(45, 45, 45)" }}
            xmlSpace="preserve"
            >
            <path d="M152.924 300.748c84.319 0 152.912-68.6 152.912-152.918 0-39.476-15.312-77.231-42.346-105.564 0 0 3.938-8.857 8.814-19.783 4.864-10.926-2.138-18.636-15.648-17.228l-79.125 8.289c-13.511 1.411-17.999 11.467-10.021 22.461l46.741 64.393c7.986 10.992 17.834 12.31 22.008 2.937l7.56-16.964c12.172 18.012 18.976 39.329 18.976 61.459 0 60.594-49.288 109.875-109.87 109.875-60.591 0-109.882-49.287-109.882-109.875 0-19.086 4.96-37.878 14.357-54.337 5.891-10.325 2.3-23.467-8.025-29.357-10.328-5.896-23.464-2.3-29.36 8.031C6.923 95.107 0 121.27 0 147.829c0 84.319 68.602 152.919 152.924 152.919z" />
        </svg>
    )
}