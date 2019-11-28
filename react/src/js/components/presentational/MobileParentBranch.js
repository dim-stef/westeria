import React, {useLayoutEffect, useRef, useState,useEffect} from "react";
import {Link} from 'react-router-dom'
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import {NavLink} from "react-router-dom"
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import Linkify from 'linkifyjs/react';
import {FollowButton} from "./Card"
import { Profile } from "./SettingsPage";
import {DesktopProfile} from "./ProfileViewer"


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

const followContainerCss = theme =>css({
    display: 'inline-flex',
    margin:14,
    borderRadius: 5,
    fontSize:'1.4em'
})

const followCss = theme =>css({
    display: 'inline',
    marginRight: 10,
    borderRadius: 5,
    cursor:'pointer',
})

export const MobileBranchPageWrapper = React.memo(function({branch,children}){
    const theme = useTheme();
    const ref = useRef(null);
    const [left,setLeft] = useState(0);
    const [imageHeight,setImageHeight] = useState(0);

    let defaultBannerUrl = '/images/group_images/banner/default';
    let r = new RegExp(defaultBannerUrl);
    let isDefault = r.test(branch.branch_banner)

    useLayoutEffect(()=>{
        let offsetLeft = ref.current.offsetLeft;
        setLeft(offsetLeft);

        // same height as width
        let height = ref.current.clientWidth;
        setImageHeight(height);
    },[ref])

    return(
        <div className="mobile-branch-front-page">
        <div style={{width:'100%',position:'relative'}}>
            <div style={{
                    display: 'inline-block',
                    width: '100%',
                    height: 'auto',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '34.37% 0 0 0',
                    backgroundColor:getRandomColor()
            }}>
                <img style={{
                    maxWidth: '100%',
                    width:'100%',
                    position: 'absolute',
                    bottom: 0,
                    objectFit: 'cover',
                    top: '50%',
                    right: '50%',
                    transform: 'translate(50%, -50%)',
                }} src={isDefault?null:branch.branch_banner}></img>
            </div>
            <img ref={ref} style={{
                    width: '27%',
                    height: imageHeight,
                    objectFit:'cover',
                    borderRadius: '50%',
                    position: 'absolute',
                    bottom: '-40%',
                    left: '3%',
                    border: `4px solid ${theme.backgroundColor}`
            }} src={branch.branch_image}></img>
            
        </div>
        <ImageNeighbour el={ref} branch={branch}/>
        <div style={{margin:left}}>
            <Description description={branch.description}/>
        </div>
        <div css={followContainerCss} className="center-items">
            <FollowInfo branch={branch} followersCount={branch.followers_count} 
            followingCount={branch.following_count}/>
        </div>
        <NavigationTabs branch={branch}/>
        {children}
        </div>
    )
})

function Description({description}){
    return(
        <Linkify><p className="text-wrap" style={{fontSize:'1.7rem', marginTop:8}}>{description}</p></Linkify>
    )
}


function FollowInfo({branch,followersCount,followingCount}){
    const theme = useTheme();

    return(
        <>
        <Link to={{pathname:`/${branch.uri}/followers`,state:'followers'}} style={{textDecoration:'none'}}>
            <div css={followCss}>
                <span style={{color: '#2196f3'}}>{followersCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Followers</span>
            </div>
        </Link>
        <Link to={{pathname:`/${branch.uri}/following`,state:'following'}} style={{textDecoration:'none'}}>
            <div css={followCss}>
                <span style={{color: '#2196f3'}}>{followingCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Following</span>
            </div>
        </Link>
        </>
    )
}

function ImageNeighbour({el,branch}){
    const [left,setLeft] = useState(0);

    useLayoutEffect(()=>{
        let offsetLeft = el.current.offsetLeft;
        let width = el.current.width;
        let extraOffset = 20;
        setLeft(offsetLeft+width+extraOffset);
    },[el])

    return(
        <div style={{width:'100%',height:80,position:'relative'}}>
            <div style={{position:'absolute',left:left}}>
                <Identifiers branch={branch}/>
            </div>
        </div>
        
    )
}

function Identifiers({branch}){
    return(

        <div className="flex-fill" style={{alignItems:'center',WebkitAlignItesm:'center',flexFlow:'row wrap',WebkitFlexFlow:'row wrap'}}>
            <div>
                <Name name={branch.name}/>
                <Uri uri={branch.uri}/>
            </div>
            <FollowButton id={branch.id} uri={branch.uri} style={{width:'auto'}}/>
        </div>
        
    )
}

function Name({name}){
    return(
        <p className="text-wrap" style={{margin:0,fontSize:'2rem',fontWeight:'bold'}}>{name}</p>
    )
}

function Uri({uri}){
    const theme = useTheme();

    return(
        <span style={{fontSize:'2em',color:theme.textLightColor}}>@{uri}</span>
    )
}

function NavigationTabs({branch}){
    const theme = useTheme();
    return(
        <div className="flex-fill" style={{justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',
        WebkitAlignItems:'center',padding:10}}>
            <NavLink exact to={{pathname:`/${branch.uri}`,state:'branch'}}
            style={{textDecoration:'none',color:theme.textHarshColor,textAlign:'center',fontWeight:'bold',fontSize:'2rem',width:'100%'}}
            activeStyle={{borderBottom:'2px solid #2196f3',color:'#2196f3'}}>Posts</NavLink>
            <NavLink to={{pathname:`/${branch.uri}/branches`,state:'branch'}}
            style={{textDecoration:'none',color:theme.textHarshColor,textAlign:'center',fontWeight:'bold',fontSize:'2rem',width:'100%'}}
            activeStyle={{borderBottom:'2px solid #2196f3',color:'#2196f3'}}>
            {branch.branch_count>0?branch.branch_count:0} Branches</NavLink>
        </div>
    )
}


export function MobileParentBranch2({branch,children}){

    return(
        <div style={{height:'100%'}}>
            <ProfileBubble branch={branch}/>
            {children}
        </div>

    )
}
export function ProfileBubble({branch}){
    const isDown = useRef(false);
    const [show,setShow] = useState(false);
    const [props, set] = useSpring(() => ({
        from:{ xy:[20,60], scale: 1 },
        config:{tension:370,friction:27},
        onFrame:(f)=>{
            if(!isDown.current && !show){
                checkBoundaries(f)
            }
        },
        onRest:(f)=>{
            if(!show){
                checkBoundaries(f)
            }
        }
    }))

    function checkBoundaries(f){
        if(f.xy[0] < 0){
            set({ xy:[10,f.xy[1]]})
        }else if(f.xy[0] > window.innerWidth - 40){
            set({ xy:[window.innerWidth - 60,f.xy[1]]})
        }

        if(f.xy[1] < 0){
            set({ xy:[f.xy[0],10]})
        }else if(f.xy[1] > window.innerHeight){
            set({ xy:[f.xy[0],window.innerHeight - 60]})
        }
    }

    const bind = useDrag(({ down, xy: [x, y] }) => {
        isDown.current = down;
        set({ xy:[x,y], scale: down ? 1.2 : 1 })
    })

    function handleClick(e){
        e.stopPropagation();
        setShow(true)
    }

    useEffect(()=>{
        if(show){
            set({ xy:[window.innerWidth,60], scale: 1 })
        }else{
            set({ xy:[20,60], scale: 1 })
        }
    },[show])

    return(
        <>
        <animated.div {...bind()} onClick={handleClick} style={{position:'fixed',zIndex:1002,
        scale:props.scale.interpolate(s=>s),transform : props.xy.interpolate((x,y)=>`translate(${x}px,${y}px)`)}}>
            <img src={branch.branch_image} className="round-picture" css={{objectFit:'cover',height:40,width:40,
            border:'2px solid white',boxShadow:'1px 2px 3px 0px #000000b3'}} onClick={handleClick}/>
        </animated.div>
        <ProfileDrawer branch={branch} shown={show} setShown={setShow}/>
        </>
    )
}

function ProfileDrawer({shown,setShown,branch}){
    
    const transitions = useTransition(shown, null, {
        from: { opacity: 0, transform: 'translate3d(-100%,0,0)' },
        enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
        leave: { opacity: 0, transform: 'translate3d(-100%,0,0)' },
    })

    function handleClick(e){
        e.stopPropagation();
        setShown(false);
    }

    return (
        transitions.map(({ item, props, key }) => {
          return (
            item && <animated.div key={key} css={theme=>({zIndex:1002,height:window.innerHeight,backgroundColor:theme.backgroundColor,
            position:'fixed',width:'100vw'})} style={props} onClick={e=>e.stopPropagation()}>
                <div css={theme=>({height:'100%',width:'100%',position:'relative'})}>
                    <div css={{position:'absolute',top:20,left:20}} onClick={handleClick}>
                        <ArrowLeftSvg/>
                    </div>
                    <DesktopProfile branch={branch}/>
                </div>
            </animated.div>
          )
        })        
    )
}

const ArrowLeftSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 31.494 31.494"
        style={{ enableBackground: "new 0 0 31.494 31.494" }}
        css={theme=>({fill:theme.textHarshColor,width:20,height:20})}
        xmlSpace="preserve"
        >
        <path
            d="M10.273,5.009c0.444-0.444,1.143-0.444,1.587,0c0.429,0.429,0.429,1.143,0,1.571l-8.047,8.047h26.554  c0.619,0,1.127,0.492,1.127,1.111c0,0.619-0.508,1.127-1.127,1.127H3.813l8.047,8.032c0.429,0.444,0.429,1.159,0,1.587  c-0.444,0.444-1.143,0.444-1.587,0l-9.952-9.952c-0.429-0.429-0.429-1.143,0-1.571L10.273,5.009z"
        />
        </svg>
    )
}

