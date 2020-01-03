import React, {Component, useContext, useEffect, useState} from "react"
import {Link} from "react-router-dom"
import { css } from "@emotion/core";
import history from "../../history";
import {useTheme} from "../container/ThemeContainer"
import {UserContext} from "../container/ContextContainer";
import {BranchSwitcher} from "./BranchSwitcher"
import {FollowButton} from "./Card"

const desktopProfile = (backgroundColor) =>css({
    height:'100%',width:'100%',padding:'10px 20px',display:'flex',flexFlow:'column',alignItems:'center',boxSizing:'border-box',
      boxShadow:'0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',borderRadius:15,backgroundColor:backgroundColor
  })

const description = theme =>css({
    color:theme.textHarshColor,
    fontSize:'2em',
    wordBreak:'break-word',
})

const followContainerCss = theme =>css({
    display: 'inline-flex',
    margin:14,
    borderRadius: 5,
    fontSize:'1.4em'
})

const followCss = theme =>css({
    display: 'block',
    borderRadius: 5,
    padding:3,
    margin:'2px 0',
    cursor:'pointer',
    '&:hover':{
        backgroundColor:theme.embeddedHoverColor
    }
})

const profilePicture = () =>css({
    height:100,width:100,objectFit:'cover',borderRadius:'50%',
    border:'3px solid transparent',
    boxSizing:'border-box',
    '&:hover':{
        boxShadow:'0px 0px 0px 3px #208ce3'
    }
})

const icon = theme =>css({
    height:20,
    width:20,
    borderRadius:'50%',
    padding:7,
    borderRadius:'50%',
    overflow:'visible',
    fill:theme.textHarshColor,
    cursor:'pointer',
    '&:hover':{
        backgroundColor:theme.embeddedHoverColor
    }
})

const nameDetails = (theme) =>css({
    display:'flex',flexFlow:'column',
    color:theme.textColor,
    '&:hover':{
        textDecoration:'underline'
    }
})

export function DesktopProfile({branch,noSettings=false}){
    const theme = useTheme();
    const userContext = useContext(UserContext);
    const viewedBranch = branch || userContext.currentBranch

    let backgroundColor = theme.dark?'#090a10':null
    
    return(
        userContext.isAuth || viewedBranch?
        <div css={()=>desktopProfile(backgroundColor)}>
            <Link rel="canonical" to={`/${viewedBranch.uri}`}>
                <img src={viewedBranch.branch_image} css={profilePicture}/>
            </Link>

            <Link to={`/${viewedBranch.uri}`} style={{textDecoration:'none'}}>
                <div css={nameDetails}>
                    <Name name={viewedBranch.name}/>
                    <Uri uri={viewedBranch.uri}/>
                </div>
            </Link>
            <div css={{margin:'20px 0',flex:1,display:'flex',flexFlow:'column',alignItems:'center'}}>
                <div style={{margin:'10px 0'}}>
                    <span css={theme=>description(theme)}>{viewedBranch.description}</span>
                </div>
                <div css={{margin:'10px 0',width:'100%'}}>
                    <FollowInfo branch={viewedBranch}/>
                </div>
                <div css={{margin:'10px 0',alignSelf:'center'}}>
                    <FollowButton branch={viewedBranch} style={{margin:0}}/>
                </div>
           
            </div>
            {noSettings?null:<UserSettings branch={viewedBranch}/>}
        </div>:
            <div css={()=>desktopProfile(backgroundColor)}>
                <NonAuthenticationColumn/>
            </div>
    )
}

export function DesktopProfileWrapper(props){

    return(
        <div className="flex-fill" style={{flexFlow:'row wrap',width:'100%'}}>
            <div style={{flexBasis:'22%',WebkitFlexBasis:'22%'}}>
              <DesktopProfile branch={props.branch}/>
            </div>
            {props.children}
            
        </div>
    )
}

export function Name({name}){
    return(
        <span css={{fontSize:'2em',fontWeight:'bold'}}>{name}</span>
    )
}

export function Uri({uri}){
    return(
        <span css={theme=>({color:theme.textColor,fontSize:'1.3em'})}>@{uri}</span>
    )
}

function FollowInfo({branch}){
    const theme = useTheme();

    return(
        <div css={{display:'flex',flexFlow:'row',fontSize:'1.5em',margin:'5px 0',width:'100%',justifyContent:'space-evenly'}}>
            <Link to={{pathname:`/${branch.uri}/followers`,state:'followers'}} 
            css={theme=>({textDecoration:'none',color:theme.textLightColor})}>
                <div css={followCss}>
                    <span style={{color: '#2196f3',fontWeight:'bold'}}>{branch.followers_count}{' '}</span>
                    <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Followers</span>
                </div>
            </Link>
            <Link to={{pathname:`/${branch.uri}/following`,state:'following'}} 
            css={theme=>({textDecoration:'none',color:theme.textLightColor})}>
                <div css={followCss}>
                    <span style={{color: '#2196f3',fontWeight:'bold'}}>{branch.following_count}{' '}</span>
                    <span style={{fontWeight:500,fontSize:'0.9em',color:theme.textLightColor}}>Following</span>
                </div>
            </Link>
        </div>
    )
}

export function UserSettings({branch}){
    const userContext = useContext(UserContext);

    const ownsBranch = userContext.isAuth ? userContext.branches.some(b=>b.uri===branch.uri) : false;

    return(
        <>
        {ownsBranch?<>
            <div css={{width:'100%',display:'flex',justifyContent:'space-evenly'}}>
                <BranchSwitch defaultBranch={userContext.currentBranch}/>
                <Settings/>
                <CreateNew/>
            </div>
            <div css={{width:'100%',display:'flex',justifyContent:'space-evenly'}}>
                <ThemeSwitcher/>
                <Logout/>
            </div>
        </>:<div css={{width:'100%',display:'flex',justifyContent:'space-evenly'}}>
            <ThemeSwitcher/>
        </div>}
        </>
    )
}

export function BranchSwitch({defaultBranch}){
    return(
        <div style={{borderRadius:'50%',width:'fit-content'}} >
            <BranchSwitcher defaultBranch={defaultBranch} changeCurrentBranch 
            preview={false} showOnTop>
                <BranchSwitchIcon/>
            </BranchSwitcher>
        </div>
    )
}

export function Settings(){
    
    function handleClick(){
        history.push('/settings')
    }

    return(
        <div onClick={handleClick}>
            <SettingsSvg/>
        </div>
    )
}

export function CreateNew(){
    
    function handleClick(){
        history.push('/settings/branches/new')
    }

    return(
        <div onClick={handleClick}>
            <PlusSvg/>
        </div>
    )
}

export function ThemeSwitcher(){
    const getTheme = useTheme();

    return(
        <div onClick={getTheme.toggle}>
            {getTheme.dark?<SunSvg/>:<MoonSvg/>}
        </div>
    )
}

export function Logout(){

    function handleClick(){
        history.push('/logout/instant');
    }

    return(
        <div onClick={handleClick}>
            <LogoutSvg/>
        </div>
    )
}

function NonAuthenticationColumn(){
    return(
        <>
        <div className="flex-fill" style={{padding:'10px 20px',
        alignItems:'center',WebkitAlignItems:'center',flexFlow:'column',WebkitFlexFlow:'column'}}>
            <Link to="/login" className="login-or-register">Login</Link>
            <span style={{fontSize:'1.4rem',color:'#a4a5b2'}}>or</span>
            <Link to="/register" className="login-or-register">Register</Link>
        </div>
        <div css={{width:'100%',display:'flex',justifyContent:'space-evenly'}}>
            <ThemeSwitcher/>
        </div>
        </>
    )
}


const BranchSwitchIcon = (props) =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="Capa_1"
        x="0px"
        y="0px"
        viewBox="0 0 489.4 489.4"
        style={{ enableBackground: "new 0 0 489.4 489.4"}}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M370.2,468.9c0,6.8,5.5,12.3,12.3,12.3s12.3-5.5,12.3-12.3V50.1l73.6,73.6c2.4,2.4,5.5,3.6,8.7,3.6s6.3-1.2,8.7-3.6    c4.8-4.8,4.8-12.5,0-17.3l-94.5-94.5c-4.6-4.6-12.7-4.6-17.3,0l-94.5,94.5c-4.8,4.8-4.8,12.5,0,17.3c4.8,4.8,12.5,4.8,17.3,0    l73.6-73.6v418.8H370.2z" />
            <path d="M209.9,365.7c-4.8-4.8-12.5-4.8-17.3,0L119,439.3V20.5c0-6.8-5.5-12.3-12.3-12.3s-12.3,5.5-12.3,12.3v418.8l-73.5-73.6    c-4.8-4.8-12.5-4.8-17.3,0s-4.8,12.5,0,17.3l94.5,94.5c2.4,2.4,5.5,3.6,8.7,3.6s6.3-1.2,8.7-3.6L210,383    C214.6,378.3,214.6,370.5,209.9,365.7z" />
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>

    )
}

const SettingsSvg = (props)=>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="Capa_1"
        x="0px"
        y="0px"
        viewBox="0 0 478.703 478.703"
        style={{ enableBackground: "new 0 0 478.703 478.703" }}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M454.2,189.101l-33.6-5.7c-3.5-11.3-8-22.2-13.5-32.6l19.8-27.7c8.4-11.8,7.1-27.9-3.2-38.1l-29.8-29.8    c-5.6-5.6-13-8.7-20.9-8.7c-6.2,0-12.1,1.9-17.1,5.5l-27.8,19.8c-10.8-5.7-22.1-10.4-33.8-13.9l-5.6-33.2    c-2.4-14.3-14.7-24.7-29.2-24.7h-42.1c-14.5,0-26.8,10.4-29.2,24.7l-5.8,34c-11.2,3.5-22.1,8.1-32.5,13.7l-27.5-19.8    c-5-3.6-11-5.5-17.2-5.5c-7.9,0-15.4,3.1-20.9,8.7l-29.9,29.8c-10.2,10.2-11.6,26.3-3.2,38.1l20,28.1    c-5.5,10.5-9.9,21.4-13.3,32.7l-33.2,5.6c-14.3,2.4-24.7,14.7-24.7,29.2v42.1c0,14.5,10.4,26.8,24.7,29.2l34,5.8    c3.5,11.2,8.1,22.1,13.7,32.5l-19.7,27.4c-8.4,11.8-7.1,27.9,3.2,38.1l29.8,29.8c5.6,5.6,13,8.7,20.9,8.7c6.2,0,12.1-1.9,17.1-5.5    l28.1-20c10.1,5.3,20.7,9.6,31.6,13l5.6,33.6c2.4,14.3,14.7,24.7,29.2,24.7h42.2c14.5,0,26.8-10.4,29.2-24.7l5.7-33.6    c11.3-3.5,22.2-8,32.6-13.5l27.7,19.8c5,3.6,11,5.5,17.2,5.5l0,0c7.9,0,15.3-3.1,20.9-8.7l29.8-29.8c10.2-10.2,11.6-26.3,3.2-38.1    l-19.8-27.8c5.5-10.5,10.1-21.4,13.5-32.6l33.6-5.6c14.3-2.4,24.7-14.7,24.7-29.2v-42.1    C478.9,203.801,468.5,191.501,454.2,189.101z M451.9,260.401c0,1.3-0.9,2.4-2.2,2.6l-42,7c-5.3,0.9-9.5,4.8-10.8,9.9    c-3.8,14.7-9.6,28.8-17.4,41.9c-2.7,4.6-2.5,10.3,0.6,14.7l24.7,34.8c0.7,1,0.6,2.5-0.3,3.4l-29.8,29.8c-0.7,0.7-1.4,0.8-1.9,0.8    c-0.6,0-1.1-0.2-1.5-0.5l-34.7-24.7c-4.3-3.1-10.1-3.3-14.7-0.6c-13.1,7.8-27.2,13.6-41.9,17.4c-5.2,1.3-9.1,5.6-9.9,10.8l-7.1,42    c-0.2,1.3-1.3,2.2-2.6,2.2h-42.1c-1.3,0-2.4-0.9-2.6-2.2l-7-42c-0.9-5.3-4.8-9.5-9.9-10.8c-14.3-3.7-28.1-9.4-41-16.8    c-2.1-1.2-4.5-1.8-6.8-1.8c-2.7,0-5.5,0.8-7.8,2.5l-35,24.9c-0.5,0.3-1,0.5-1.5,0.5c-0.4,0-1.2-0.1-1.9-0.8l-29.8-29.8    c-0.9-0.9-1-2.3-0.3-3.4l24.6-34.5c3.1-4.4,3.3-10.2,0.6-14.8c-7.8-13-13.8-27.1-17.6-41.8c-1.4-5.1-5.6-9-10.8-9.9l-42.3-7.2    c-1.3-0.2-2.2-1.3-2.2-2.6v-42.1c0-1.3,0.9-2.4,2.2-2.6l41.7-7c5.3-0.9,9.6-4.8,10.9-10c3.7-14.7,9.4-28.9,17.1-42    c2.7-4.6,2.4-10.3-0.7-14.6l-24.9-35c-0.7-1-0.6-2.5,0.3-3.4l29.8-29.8c0.7-0.7,1.4-0.8,1.9-0.8c0.6,0,1.1,0.2,1.5,0.5l34.5,24.6    c4.4,3.1,10.2,3.3,14.8,0.6c13-7.8,27.1-13.8,41.8-17.6c5.1-1.4,9-5.6,9.9-10.8l7.2-42.3c0.2-1.3,1.3-2.2,2.6-2.2h42.1    c1.3,0,2.4,0.9,2.6,2.2l7,41.7c0.9,5.3,4.8,9.6,10,10.9c15.1,3.8,29.5,9.7,42.9,17.6c4.6,2.7,10.3,2.5,14.7-0.6l34.5-24.8    c0.5-0.3,1-0.5,1.5-0.5c0.4,0,1.2,0.1,1.9,0.8l29.8,29.8c0.9,0.9,1,2.3,0.3,3.4l-24.7,34.7c-3.1,4.3-3.3,10.1-0.6,14.7    c7.8,13.1,13.6,27.2,17.4,41.9c1.3,5.2,5.6,9.1,10.8,9.9l42,7.1c1.3,0.2,2.2,1.3,2.2,2.6v42.1H451.9z" />
            <path d="M239.4,136.001c-57,0-103.3,46.3-103.3,103.3s46.3,103.3,103.3,103.3s103.3-46.3,103.3-103.3S296.4,136.001,239.4,136.001    z M239.4,315.601c-42.1,0-76.3-34.2-76.3-76.3s34.2-76.3,76.3-76.3s76.3,34.2,76.3,76.3S281.5,315.601,239.4,315.601z" />
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}

const PlusSvg = (props)=>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="Capa_1"
        x="0px"
        y="0px"
        viewBox="0 0 512 512"
        style={{ enableBackground: "new 0 0 512 512" }}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M492,236H276V20c0-11.046-8.954-20-20-20c-11.046,0-20,8.954-20,20v216H20c-11.046,0-20,8.954-20,20s8.954,20,20,20h216    v216c0,11.046,8.954,20,20,20s20-8.954,20-20V276h216c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z" />
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}

const MoonSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-12 0 448 448.04455"
        css={icon}
        >
        <path d="m224.023438 448.03125c85.714843.902344 164.011718-48.488281 200.117187-126.230469-22.722656 9.914063-47.332031 14.769531-72.117187 14.230469-97.15625-.109375-175.890626-78.84375-176-176 .972656-65.71875 37.234374-125.832031 94.910156-157.351562-15.554688-1.980469-31.230469-2.867188-46.910156-2.648438-123.714844 0-224.0000005 100.289062-224.0000005 224 0 123.714844 100.2851565 224 224.0000005 224zm0 0" />
        </svg>

    )
}

const SunSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="Capa_1"
        x="0px"
        y="0px"
        viewBox="0 0 45.16 45.16"
        style={{ enableBackground: "new 0 0 45.16 45.16" }}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M22.58,11.269c-6.237,0-11.311,5.075-11.311,11.312s5.074,11.312,11.311,11.312c6.236,0,11.311-5.074,11.311-11.312    S28.816,11.269,22.58,11.269z" />
            <g>
                <g>
                <path d="M22.58,7.944c-1.219,0-2.207-0.988-2.207-2.206V2.207C20.373,0.988,21.361,0,22.58,0c1.219,0,2.207,0.988,2.207,2.207      v3.531C24.787,6.956,23.798,7.944,22.58,7.944z" />
                </g>
                <g>
                <path d="M22.58,37.215c-1.219,0-2.207,0.988-2.207,2.207v3.53c0,1.22,0.988,2.208,2.207,2.208c1.219,0,2.207-0.988,2.207-2.208      v-3.53C24.787,38.203,23.798,37.215,22.58,37.215z" />
                </g>
                <g>
                <path d="M32.928,12.231c-0.861-0.862-0.861-2.259,0-3.121l2.497-2.497c0.861-0.861,2.259-0.861,3.121,0      c0.862,0.862,0.862,2.26,0,3.121l-2.497,2.497C35.188,13.093,33.791,13.093,32.928,12.231z" />
                </g>
                <g>
                <path d="M12.231,32.93c-0.862-0.863-2.259-0.863-3.121,0l-2.497,2.496c-0.861,0.861-0.862,2.26,0,3.121      c0.862,0.861,2.26,0.861,3.121,0l2.497-2.498C13.093,35.188,13.093,33.79,12.231,32.93z" />
                </g>
                <g>
                <path d="M37.215,22.58c0-1.219,0.988-2.207,2.207-2.207h3.531c1.219,0,2.207,0.988,2.207,2.207c0,1.219-0.988,2.206-2.207,2.206      h-3.531C38.203,24.786,37.215,23.799,37.215,22.58z" />
                </g>
                <g>
                <path d="M7.944,22.58c0-1.219-0.988-2.207-2.207-2.207h-3.53C0.988,20.373,0,21.361,0,22.58c0,1.219,0.988,2.206,2.207,2.206      h3.531C6.956,24.786,7.944,23.799,7.944,22.58z" />
                </g>
                <g>
                <path d="M32.928,32.93c0.862-0.861,2.26-0.861,3.121,0l2.497,2.497c0.862,0.86,0.862,2.259,0,3.12s-2.259,0.861-3.121,0      l-2.497-2.497C32.066,35.188,32.066,33.791,32.928,32.93z" />
                </g>
                <g>
                <path d="M12.231,12.231c0.862-0.862,0.862-2.259,0-3.121L9.734,6.614c-0.862-0.862-2.259-0.862-3.121,0      c-0.862,0.861-0.862,2.259,0,3.12l2.497,2.497C9.972,13.094,11.369,13.094,12.231,12.231z" />
                </g>
            </g>
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}

const LogoutSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        id="Capa_1"
        x="0px"
        y="0px"
        viewBox="0 0 471.2 471.2"
        style={{ enableBackground: "new 0 0 471.2 471.2" }}
        css={icon}
        xmlSpace="preserve"
        >
        <g>
            <g>
            <path d="M227.619,444.2h-122.9c-33.4,0-60.5-27.2-60.5-60.5V87.5c0-33.4,27.2-60.5,60.5-60.5h124.9c7.5,0,13.5-6,13.5-13.5    s-6-13.5-13.5-13.5h-124.9c-48.3,0-87.5,39.3-87.5,87.5v296.2c0,48.3,39.3,87.5,87.5,87.5h122.9c7.5,0,13.5-6,13.5-13.5    S235.019,444.2,227.619,444.2z" />
            <path d="M450.019,226.1l-85.8-85.8c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l62.8,62.8h-273.9c-7.5,0-13.5,6-13.5,13.5    s6,13.5,13.5,13.5h273.9l-62.8,62.8c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.8-85.8    C455.319,239.9,455.319,231.3,450.019,226.1z" />
            </g>
        </g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        <g></g>
        </svg>
    )
}