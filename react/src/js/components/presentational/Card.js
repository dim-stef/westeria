import React, {useContext, useEffect, useState} from "react";
import { createPortal } from 'react-dom';
import {useTransition, animated} from 'react-spring'
import { css } from "@emotion/core";
import { useTheme } from 'emotion-theming'
import {useMediaQuery} from 'react-responsive'
import {UserContext} from "../container/ContextContainer"
import {Link} from 'react-router-dom'
import Linkify from 'linkifyjs/react';
import axios from 'axios'


export default function Card({branch}){
    let height = branch.description ? 200 : 90
    return(
        <div style={{width:'100%',height:height,position:'relative'}}>
            <Identifiers branch={branch}/>
            <FollowInfo followersCount={branch.followers_count} followingCount={branch.following_count} branch={branch}/>
        </div>
    )
}

const followCss = theme =>css({
    display: 'inline',
    padding: '3px 10px',
    borderRadius: 5,
    cursor:'pointer',
    '&:hover':{
        backgroundColor:theme.hoverColor
    }
})

function FollowInfo({followersCount,followingCount,branch}){
    const theme = useTheme();

    return(
        <div style={{height:'100%',width:270,position:'absolute',right:0}}>
            <h1>
                <Link to={`/${branch.uri}/followers`} style={{textDecoration:'none'}}>
                    <div css={followCss}>
                        <span style={{color: '#2196f3'}}>{followersCount}{' '}</span>
                        <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Followers</span>
                    </div>
                </Link>
            </h1>
            <h1>
                <Link to={`/${branch.uri}/following`} style={{textDecoration:'none'}}>
                    <div css={theme=>followCss(theme)}>
                        <span style={{color: '#2196f3'}}>{followingCount}{' '}</span>
                        <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Following</span>
                    </div>
                </Link>
            </h1>
        </div>
    )
}

function Identifiers({branch}){
     
    return(
        <div style={{position:'absolute',left:270,width:672}}>
            <div className="flex-fill" style={{paddingTop:10,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
                <Name name={branch.name}/>
                <FollowButton branch={branch}/>
            </div>
            <Uri uri={branch.uri}/>
            {
                branch.description ? 
                <Description description={branch.description}/> : 
                null
            }
        </div>
    )
}

function Name({name}){
    const theme = useTheme();

    return(
        <h1 style={{margin:0,fontSize:'3rem',color:theme.textHarshColor}}>{name}</h1>
    )
}

function Uri({uri}){
    const theme = useTheme();

    return(
        <span style={{fontSize:'2em',color:theme.textLightColor}}>@{uri}</span>
    )
}

function Description({description}){
    const theme = useTheme();

    return(
        <Linkify><p className="text-wrap" style={{fontSize:'2em',color:theme.textColor}}>{description}</p></Linkify>
    )
}


let CancelToken = axios.CancelToken;
let source = CancelToken.source();


export function FollowButton({branch,style=null}){
    const context = useContext(UserContext);

    let className;
    let initFollowing;
    if(context.isAuth && context.currentFollowing.some(b=>b.uri==branch.uri)){
        className = 'following-secondary'
        initFollowing= true
    }
    else{
        className = 'following-main'
        initFollowing= false
    }
    const [following,setFollowing] = useState(initFollowing);
    const [isDisabled,setDisabled] = useState(false);

    useEffect(()=>{
        if(context.isAuth && context.currentFollowing.some(b=>b.uri==branch.uri)){
            className = 'following-secondary'
            setFollowing(true)
        }
        else{
            className = 'following-main'
            setFollowing(false)
        }
    },[branch,context.isAuth?context.currentBranch.uri:null])

    function followSetter(){
        setDisabled(true);
        if(following){
            context.currentFollowing.splice(context.currentFollowing.findIndex(b=>b.uri==branch.uri),1);
            className = 'following-main';
            setFollowing(false);
        }else{
            context.currentFollowing.push(branch)
            className = 'following-secondary';
            setFollowing(true);
        }
    }

    function onClick(e){
        e.stopPropagation();
        if(!context.isAuth){
            return;
        }

        followSetter();

        var url = `/api/branches/add_follow/${context.currentBranch.uri}/`;
        if(following){
            url = `/api/branches/remove_follow/${context.currentBranch.uri}/`;
        }

        var data = {
            follows:[branch.id]
        }
        axios.patch(
            url,
            data,
            {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            cancelToken: source.token,
            withCredentials: true,
        }).then(response => {
            setDisabled(false);
        }).catch(error => {
            setDisabled(false);
        })
    }

    return(
        <button
            onClick={onClick}
            disabled={isDisabled}
            name="followAction"
            css={{backgroundColor:following?'#2196F3':'transparent',border:following?`2px solid transparent`
            :'2px solid #2196F3',color:following?'white':'#2196F3','&:hover':{
                backgroundColor:following?'#1888e2':'#2196f329'
            }}}
            style={{
            borderRadius: 50,
            display:'block',
            margin:'0 15px',
            padding: "8px",
            width:140,
            fontSize: "1.6em",
            fontWeight: 600,
            maxHeight:60,
            ...style,
        }}>{following ? 'Following':'Follow'}</button>
    )
}


const smallCardContainer = (theme,width,left,top) => css({
    maxWidth:300,width:width || 300,height:'auto',position:'absolute',
    boxShadow:'0px 1px 6px -3px',top:50,backgroundColor:theme.backgroundColor,
    borderRadius:30,zIndex:50,padding:10,cursor:'auto',position:'fixed',zIndex:211110,
    left:left,top:top
})

const uri = theme => css({
    fontSize:'1.4rem',color:theme.textLightColor
})

const name = theme => css({
    fontSize:'1.5rem',margin:0,fontWeight:700,color:theme.textColor
})

const description = theme => css({
    fontSize:'2em',color:theme.textColor
})

const cardNumber = theme => css({
    color:theme.textLightColor,fontWeight:600
})


export function SmallCard({branch,hoverable=true,containerWidth=null,children}){
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    const [showCard,setShowCard] = useState(false);
    const [mousePosition,setMousePosition] = useState(null);

    const transitions = useTransition(showCard, null, {
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config:{
            duration:100
        }
    })

    let setTimeoutConst;
    let setTimeoutConst2;

    function handleMouseEnter(e){
        if(!mousePosition){
            setMousePosition([e.clientX,e.clientY])
        }
        
        clearTimeout(setTimeoutConst2)

        setTimeoutConst = setTimeout(()=>{
            setShowCard(true);
        },1000)
    }

    function handleMouseLeave(){
        clearTimeout(setTimeoutConst)

        setTimeoutConst2 = setTimeout(()=>{
            setShowCard(false);
        },1000)
    }

    function onClick(e){
        e.stopPropagation();
        e.preventDefault();
    }

    return(
        <>
        {React.Children.map(children, (child, i) => {
            return React.cloneElement(child, { onMouseEnter:isMobile || !hoverable?null:handleMouseEnter,
            onMouseLeave:isMobile || !hoverable?null:handleMouseLeave })
        })}
        
        
        {transitions.map(({ item, key, props }) => 
            item && createPortal(
                <animated.div 
                style={props}
                key={key} 
                css={theme=>smallCardContainer(theme,containerWidth,
                mousePosition?mousePosition[0]+20:0,mousePosition?mousePosition[1]+20:0)} onClick={onClick}
                onMouseEnter={isMobile || !hoverable?null:handleMouseEnter} onMouseLeave={isMobile || !hoverable?null:handleMouseLeave}>
                <div style={{position:'relative'}} className="noselect small-branch-container flex-fill">
                    <Link to={`/${branch.uri}`} className="small-branch flex-fill" >
                        <img style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}} src={branch.branch_image}/>
                        <div className="flex-fill" css={{flexDirection:'column',
                        justifyContent:'center',marginLeft:10, flex:'1 1 auto'}}>
                            <p css={theme=>name(theme)}>{branch.name}</p>
                            <span css={theme=>uri(theme)}>@{branch.uri}</span>
                        </div>
                    </Link>
                    <FollowButton branch={branch}/>
                </div>
                <p className="text-wrap" css={theme=>description(theme)}>{branch.description}</p>
                <div className="flex-fill" style={{margin:'10px 0',fontSize:'1.5em',justifyContent:'space-between',
                WebkitJustifyContent:'space-between'}}>
                    <div>
                        <span style={{fontWeight:'bold'}}>Followers </span>
                        <span css={theme=>cardNumber(theme)}>{branch.followers_count}</span>
                    </div>
                    <div>
                        <span style={{fontWeight:'bold'}}>Following </span>
                        <span css={theme=>cardNumber(theme)}>{branch.following_count}</span>
                    </div>
                    <div>
                        <span style={{fontWeight:'bold'}}>Branches </span>
                        <span css={theme=>cardNumber(theme)}>{branch.branch_count?branch.branch_count:0}</span>
                    </div>
                </div>
            </animated.div>
        ,document.getElementById('hoverable-element-root')))}
        
        </>
    )
}