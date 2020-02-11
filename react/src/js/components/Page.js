import React, {useContext,useState,useRef,useEffect} from "react";
import {css} from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import {ResponsiveNavigationBar} from "./presentational/Navigation"
import {RefreshContext} from "./container/ContextContainer"
import {LandingPage} from "./presentational/LandingPage"

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
    height:'100vh',
})

export const Page = React.memo(function Page(props){
    const isMobileOrTablet = useMediaQuery({
        query: '(max-device-width: 1223px)'
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

    if(isMobileOrTablet){
        document.body.style.overflowY = 'auto';
    }else{
        document.body.style.overflowY = 'scroll';
    }

    return(
        <div className="root-wrapper">
            <div>
                <div id="main-wrapper" className="main-wrapper">
                    <div id={isMobileOrTablet?'mobile-content-container':'content-container'}
                    className="wide-content-container" style={{height:isMobileOrTablet?contentHeight:null}}
                    css={isMobileOrTablet?()=>contentContainer(contentHeight):null}>
                        {props.children}
                    </div>
                    <div ref={navBar} id="nav-container" className="flex-fill center-items" 
                    style={{display:isMobileOrTablet?'block':null}}>
                        <ResponsiveNavigationBar/>
                    </div>
                </div>
            </div>
            <LandingPage/>
            <div className="success-message-container" style={{ display: 'none' }}>
                <p id="success-message" />
            </div>
        </div>
    )
})

