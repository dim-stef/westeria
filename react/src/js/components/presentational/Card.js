import React, {useContext, useEffect, useState} from "react";
import { css } from "@emotion/core";
import { useTheme } from 'emotion-theming'
import {UserContext} from "../container/ContextContainer"
import {Link} from 'react-router-dom'
import Linkify from 'linkifyjs/react';
import axios from 'axios'


export default function Card({branch}){
    let height = branch.description ? 200 : 90
    return(
        <div style={{width:'100%',height:height,position:'relative'}}>
            <Identifiers branch={branch}/>
            <FollowInfo followersCount={branch.followers_count} followingCount={branch.following_count}/>
        </div>
    )
}

function FollowInfo({followersCount,followingCount}){
    const theme = useTheme();

    return(
        <div style={{height:'100%',width:270,position:'absolute',right:0}}>
            <h1>
                <span style={{color: '#156bb7'}}>{followersCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Followers</span>
            </h1>
            <h1>
                <span style={{color: '#156bb7'}}>{followingCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Following</span>
            </h1>
        </div>
    )
}

function Identifiers({branch}){
     
    return(
        <div style={{position:'absolute',left:270,width:672}}>
            <div className="flex-fill" style={{paddingTop:10,alignItems:'flex-end',WebkitAlignItems:'flex-end'}}>
                <Name name={branch.name}/>
                <FollowButton id={branch.id} uri={branch.uri}/>
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


export function FollowButton({id,uri,style=null}){

    const context = useContext(UserContext);

    let clsName;
    let initFollowing;
    if(context.isAuth && context.currentBranch.follows.includes(uri)){
        clsName = 'following-secondary'
        initFollowing= true
    }
    else{
        clsName = 'following-main'
        initFollowing= false
    }
    const [className,setClassName] = useState(clsName);
    const [following,setFollowing] = useState(initFollowing);
    const [isDisabled,setDisabled] = useState(false);

    useEffect(()=>{
        if(context.isAuth && context.currentBranch.follows.includes(uri)){
            setClassName('following-secondary')
            setFollowing(true)
        }
        else{
            setClassName('following-main')
            setFollowing(false)
        }
    },[uri])

    function followSetter(){
        setDisabled(true);
        if(following){
            context.currentBranch.follows.splice(context.currentBranch.follows.indexOf(uri),1);
            setClassName('following-main');
            setFollowing(false);
        }else{
            context.currentBranch.follows.push(uri)
            setClassName('following-secondary');
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
            follows:[id]
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
            className={className}
            disabled={isDisabled}
            name="followAction"
            style={{
            borderRadius: 50,
            display:'block',
            margin:'0 15px',
            padding: "8px",
            width:140,
            fontSize: "1.6em",
            fontWeight: 600,
            ...style,
        }}>{following ? 'Following':'Follow'}</button>
    )
}


const smallCardContainer = theme => css({
    width:300,height:'auto',position:'absolute',
    boxShadow:'0px 1px 6px -3px',top:50,backgroundColor:theme.backgroundColor,
    borderRadius:30,zIndex:50,padding:10,cursor:'auto'
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

export function SmallCard({branch}){
     
    function onClick(e){
        e.stopPropagation();
        e.preventDefault();
    }

    return(
        <div css={theme=>smallCardContainer(theme)} onClick={onClick}>
            <div
                style={{position:'relative'}} className="noselect small-branch-container flex-fill">
                <Link to={`/${branch.uri}`} className="small-branch flex-fill" >
                    <img style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}} src={branch.branch_image}/>
                    <div className="flex-fill" style={{flexDirection:'column',WebkitFlexDirection:'column',
                    justifyContent:'center',WebkitJustifyContent:'center',marginLeft:10, flex:'1 1 auto',msFlex:'1 1 auto',
                    WebkitFlex:'1 1 auto'}}>
                        <p css={theme=>name(theme)}>{branch.name}</p>
                        <span css={theme=>uri(theme)}>@{branch.uri}</span>
                    </div>
                </Link>
                <FollowButton id={branch.id} uri={branch.uri}/>
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
        </div>
    )
}