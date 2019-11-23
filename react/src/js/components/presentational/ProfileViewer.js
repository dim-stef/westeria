import React, {Component, useContext, useEffect, useState} from "react"
import { css } from "@emotion/core";
import {useTheme} from "../container/ThemeContainer"
import {BranchSwitcher} from "./BranchSwitcher"

const desktopProfile = (backgroundColor) =>css({
    height:'100%',width:'100%',padding:'10px 20px',display:'flex',flexFlow:'column',alignItems:'center',boxSizing:'border-box',
      boxShadow:'0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',borderRadius:15,backgroundColor:backgroundColor
  })

const description = theme =>css({
    color:theme.textHarshColor,
    fontSize:'2em',
    wordBreak:'break-word',
})

export function DesktopProfile({branch}){
    const theme = useTheme();

    let backgroundColor = theme.dark?'#090a10':null
    return(
        <div css={()=>desktopProfile(backgroundColor)}>
        <img src={branch.branch_image} css={{height:100,width:100,objectFit:'cover',borderRadius:'50%'}}/>
        <div css={{display:'flex',flexFlow:'column'}}>
            <span css={{fontSize:'2em',fontWeight:'bold'}}>{branch.name}</span>
            <span css={theme=>({color:theme.textColor,fontSize:'1.3em'})}>@{branch.uri}</span>
        </div>
        <div css={{margin:'20px 0',flex:1}}>
            <span css={theme=>description(theme)}>{branch.description}</span>
            
        </div>
        <div style={{borderRadius:'50%',width:'fit-content'}} >
                <BranchSwitcher defaultBranch={branch} changeCurrentBranch 
                preview={false} previewClassName="branch-switcher-preview" showOnTop>
                    <BranchSwitchIcon/>
                </BranchSwitcher>
            
            </div>
        </div>
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
        style={{ enableBackground: "new 0 0 489.4 489.4",height:20,width:20,padding:5 }}
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