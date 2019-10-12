import React, {useContext,useState,useRef,useEffect} from "react";
import {css} from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import Pullable from 'react-pullable';
import {ResponsiveNavigationBar} from "./presentational/Navigation"
import {RefreshContext} from "./container/ContextContainer"


if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}


const contentContainer = (contentHeight) =>css({
    overflowY:'auto',
    overflowX:'hidden',
    display:'flex',
    flexFlow:'column',
    paddingBottom:0,
    height:contentHeight
})

export const Page = React.memo(function Page(props){
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })
    const context = useContext(RefreshContext);
    const navBar = useRef(null);
    const [contentHeight,setContentHeight] = useState(window.innerHeight);
    const [refresh,setRefresh] = useState(()=>{});

    useEffect(()=>{
        if(navBar.current){
            resizeContent();
        }
    },[navBar])

    function resizeContent(){
        setContentHeight(window.innerHeight - navBar.current.firstElementChild.clientHeight);
    }

    useEffect(()=>{
        window.addEventListener('resize',resizeContent)

        return ()=>{
            window.removeEventListener('resize',resizeContent)
        }
    },[])

    if(isMobile){
        document.body.style.overflowY = 'auto';
    }else{
        document.body.style.overflowY = 'scroll';
    }

    return(
        <div className="root-wrapper">
            <div>
                <div id="main-wrapper" className="main-wrapper">
                    <div id={isMobile?'mobile-content-container':'content-container'}
                    className="wide-content-container" css={isMobile?()=>contentContainer(contentHeight):null}>
                        {props.children}
                    </div>
                    <div ref={navBar} id="nav-container" className="flex-fill center-items" 
                    style={{display:isMobile?'block':null}}>
                        <ResponsiveNavigationBar/>
                    </div>
                </div>
            </div>

            <div className="success-message-container" style={{ display: 'none' }}>
                <p id="success-message" />
            </div>
        </div>
    )
})

