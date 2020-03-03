import React, {useState,useEffect,useLayoutEffect,useCallback,useRef,useContext} from "react";
import { createPortal } from 'react-dom';
import history from "../../history"
import { useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import {to as aniTo} from 'react-spring/web.cjs'
import {css,keyframes } from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import {UserContext,LandingPageContext} from "../container/ContextContainer";
import {FadeImage} from "./FadeImage"
import {ThemeSwitcher} from "./ProfileViewer"

const registerButton = theme =>css({
    border:0,
    padding:'15px 10px',
    width:'40%',
    borderRadius:50,
    color:'white',
    fontWeight:'bold',
    fontSize:'1.6rem',
    background:'linear-gradient(90deg, rgb(0, 150, 218) 0%, rgb(189, 65, 230) 100%)',
    maxWidth:150
})

const continueButton = theme =>css({
    border:`1px solid ${theme.borderColor}`,
    padding:'15px 10px',
    width:'40%',
    borderRadius:50,
    color:theme.textLightColor,
    fontWeight:500,
    fontSize:'1.6rem',
    backgroundColor:'transparent',
    maxWidth:150
})

const icon = (theme,isSelected) =>css({
    padding:10,
    height:30,
    width:30,
    backgroundColor:isSelected?theme.primaryColor:theme.backgroundDarkColor,
    fill:isSelected?'white':theme.landingPageButtonColor,
    overflow:'visible',
    borderRadius:'50%'
})

const imageCss = theme =>css({
    boxShadow:'0px 6px 6px -5px #000000a8',
    borderRadius:15,
    width:'100%'
})

const pages = [
    'https://sb-static.s3.eu-west-2.amazonaws.com/static/branches1610-min.jpg',
    'https://sb-static.s3.eu-west-2.amazonaws.com/static/tree1610-min.jpg',
    'https://sb-static.s3.eu-west-2.amazonaws.com/static/tags1610-min.jpg',
]

export function LandingPage(){
    const imgRef = useRef(null);
    const userContext = useContext(UserContext)
    const landingPageContext = useContext(LandingPageContext);
    const [height,setHeight] = useState(0);
    const [index,setIndex] = useState(0);
    let shouldOpen = true;

    // should open by default only when the user is already logged in or
    // when the user first visits the website
    if(userContext.isAuth){
        shouldOpen = false;
    }else{
        if(localStorage.getItem('autoLandingPage')){
            shouldOpen = false;
        }
    }

    const [isOpen,setOpen] = useState(shouldOpen);
    landingPageContext.setOpen = setOpen;

    const openTransitions = useTransition(isOpen, null, {
        from: {  transform: 'translateY(-100%)'},
        enter: { transform: 'translateY(0)'},
        leave: {transform: 'translateY(-100%)'},
        config:{
            duration:250,
            easing:t => t*(2-t)
        }
    });

    localStorage.setItem('autoLandingPage','true');

    const transitions = useTransition([index], item => item, {
        from: { opacity: 0, transform: 'translateY(10px)' , position: 'absolute'},
        enter: { opacity: 1, transform: 'translateY(0px)'},
        leave: {opacity: 0, transform: 'translateY(100px)'}
    });

    useLayoutEffect(()=>{
        if(isOpen){
            // force preload first image
            const img = new Image();
            img.src = pages[0];
        }
    },[])

    useLayoutEffect(()=>{
        if(imgRef.current){
            // force 16:10 ratio
            setHeight(imgRef.current.clientWidth/1.6);
        }
    },[imgRef,isOpen])

    function changeHeight(){
        setHeight(imgRef.current.clientWidth/1.6);
    }

    useEffect(()=>{
        window.addEventListener('resize',changeHeight);
        return () =>{
            window.removeEventListener('resize',changeHeight);
        }
    },[])

    let primaryImgText = '';
    let secondaryImgText = '';
    if(index == 0){
        primaryImgText = <span><b>Search</b> for a community. <b>Find more like it.</b></span>
        secondaryImgText = <span>Own a community? <b>Expand</b> it by connecting with others.</span>
    }else if(index==1){
        primaryImgText = <span>View <b>everything related</b> to your interests.</span>
    }else{
        primaryImgText = <span>Create <b>once</b>. Post <b>anywhere.</b></span>
    }

    return(
        createPortal(
            openTransitions.map(({item, props, key}) => (
                item && <animated.div style={props} key={key} 
                css={theme=>({height:'100%',width:'100%',padding:30,display:'flex',flexFlow:'column',
                alignItems:'center',boxSizing:'border-box',backgroundColor:theme.backgroundLightColor,overflow:'auto',
                position:'fixed',top:0,left:0,zIndex:10000})}>
                    <div css={{flex:1}}></div>
                    <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                        <img src="https://sb-static.s3.eu-west-2.amazonaws.com/static/static/android-chrome-256x256.png"
                            css={{height:60,width:60}}
                        />
                        
                        <h1 css={{margin:'5px 0'}}>Westeria</h1>
                        <h2 css={theme=>({color:theme.textLightColor,marginTop:5})}>You took the right root</h2>
                    </div>
                    <div css={{width:'100%',display:'flex',flexFlow:'column',flex:1,maxWidth:600}}>
                        <div css={theme=>({height:height,backgroundColor:theme.skeletonColor,position:'relative',
                        overflow:'hidden',borderRadius:15,boxShadow:'0px 6px 6px -5px #000000a8'})} ref={imgRef}>
                        {transitions.map(({item, props, key}) => (
                            <animated.div key={key} style={props} css={{willChange:'transform, opacity'}}>
                                <FadeImage src={pages[item]}
                                    css={imageCss}/>
                                </animated.div>
                            ))}
                        </div>
                        <div css={{minHeight:60,marginTop:10,display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center',
                        fontSize:'1.5rem'}}>
                            <span css={{textAlign:'center'}}>{primaryImgText}</span>
                            <span css={{textAlign:'center'}}>{secondaryImgText}</span>
                        </div>
                        <div css={{display:'flex',justifyContent:'space-evenly',alignItems:'center',margin:'10px 0'}}>
                            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                                <BranchesSvg css={theme=>icon(theme,index==0)} onClick={()=>setIndex(0)}/>
                                <span css={{fontSize:'1.4rem',fontWeight:'bold',visibility:index==0?'visible':'hidden'}}>Branches</span>
                            </div>
                            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                                <TreeSvg css={theme=>icon(theme,index==1)} onClick={()=>setIndex(1)}/>
                                <span css={{fontSize:'1.4rem',fontWeight:'bold',visibility:index==1?'visible':'hidden'}}>Tree</span>
                            </div>
                            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                                <TagSvg css={theme=>icon(theme,index==2)} onClick={()=>setIndex(2)}/>
                                <span css={{fontSize:'1.4rem',fontWeight:'bold',visibility:index==2?'visible':'hidden'}}>Tags</span>
                            </div>
                        </div>
                    </div>
                    <div css={{display:'flex',width:'100%',justifyContent:'space-around',margin:'10px 0',maxWidth:600,alignItems:'center'}}>
                        <button css={registerButton} onClick={()=>{setOpen(false);history.push('/register')}}>Sign up</button>
                        <ThemeSwitcher/>
                        <button css={continueButton} onClick={()=>setOpen(false)}>Explore</button>
                    </div>
                    <div css={{flex:1}}></div>
                </animated.div>
                ))
        ,document.getElementById('hidden-elements')
        )
    )
}

const TreeSvg = props =>(
    <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    version="1.1"
    x="0px"
    y="0px"
    viewBox="0 0 343.906 343.906"
    style={{ enableBackground: "new 0 0 343.906 343.906" }}
    xmlSpace="preserve"
    {...props}
    >
    <g>
        <path d="M201.203,299.906c0-4.418-3.582-8-8-8h-43c-4.418,0-8,3.582-8,8v36c0,4.418,3.582,8,8,8h43c4.418,0,8-3.582,8-8V299.906z" />
        <path d="M296.151,146.44c3.604-8.668,5.428-17.852,5.428-27.361c0-39.431-32.079-71.511-71.51-71.511   c-2.086,0-4.192,0.095-6.303,0.283C220.011,20.619,196.797,0,168.725,0c-30.648,0-55.582,24.934-55.582,55.582   c0,3.551,0.341,7.092,1.018,10.578c-33.032,10.149-55.689,40.521-55.689,75.52c0,4.238,0.349,8.504,1.039,12.731   c-22.799,7.918-38.348,29.487-38.348,53.993c0,31.519,25.642,57.161,57.16,57.161c0.148,0,0.297-0.004,0.502-0.013l177.51,0.007   c0.093,0.004,0.187,0.006,0.281,0.006c36.464,0,66.129-29.665,66.129-66.129C322.744,178.419,312.88,158.913,296.151,146.44z" />
    </g>
    </svg>
)

const TagSvg = props =>(
    <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    version="1.1"
    x="0px"
    y="0px"
    viewBox="0 0 426.667 426.667"
    style={{
        enableBackground: "new 0 0 426.667 426.667",
        transform: "rotate(90deg)"
    }}
    xmlSpace="preserve"
    {...props}
    >
    <g>
        <g>
        <path d="M414.08,204.373L222.187,12.48C214.4,4.8,203.733,0,192,0H42.667C19.093,0,0,19.093,0,42.667V192    c0,11.84,4.8,22.507,12.587,30.187l192,192c7.68,7.68,18.347,12.48,30.08,12.48s22.507-4.8,30.187-12.48l149.333-149.333    c7.68-7.787,12.48-18.453,12.48-30.187C426.667,222.827,421.867,212.16,414.08,204.373z M74.667,106.667    c-17.707,0-32-14.293-32-32s14.293-32,32-32s32,14.293,32,32S92.373,106.667,74.667,106.667z" />
        </g>
    </g>
    </svg>
)

const BranchesSvg = props =>(
    <svg
    xmlns="http://www.w3.org/2000/svg"
    version={1.0}
    width="157.000000pt"
    height="166.000000pt"
    viewBox="0 0 157.000000 166.000000"
    {...props}
    >
    <g
        stroke="none"
        transform="translate(0.000000,166.000000) scale(0.100000,-0.100000)"
    >
        <path d="M403 1530 c-93 -22 -155 -96 -161 -194 -3 -46 0 -72 13 -97 22 -43 62 -87 98 -105 l27 -15 0 -299 0 -299 -27 -15 c-36 -18 -76 -62 -98 -105 -26 -51 -17 -146 18 -199 79 -121 252 -129 345 -16 81 98 52 254 -59 316 l-40 23 3 57 c7 93 47 121 293 208 247 88 362 168 402 281 10 28 26 52 36 55 31 10 87 65 109 107 30 60 22 152 -18 209 -34 49 -88 83 -145 92 -140 22 -271 -116 -240 -253 12 -54 52 -114 91 -137 36 -22 37 -34 5 -72 -34 -41 -134 -91 -305 -152 -80 -29 -162 -61 -182 -71 -21 -11 -40 -19 -43 -19 -3 0 -5 64 -5 143 l0 142 40 23 c79 45 121 145 99 236 -16 67 -85 138 -151 154 -52 13 -59 13 -105 2z" />
    </g>
    </svg>
)