import React, { Component, useState,useEffect,useRef,useContext,useLayoutEffect } from "react";
import {Link, NavLink } from "react-router-dom"
import Responsive from 'react-responsive';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {UserContext} from "../container/ContextContainer"
import {FrontPage,FrontPageFeed} from "./Routes"
import {FollowButton} from "./Card"
import { RoutedTabs, NavTab } from "react-router-tabs";
import axios from 'axios'


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

export function MobileBranchPageWrapper({branch,children}){
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
        <>
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
                    border: '4px solid white'
            }} src={branch.branch_image}></img>
            
        </div>
        <ImageNeighbour el={ref} branch={branch}/>
        <div style={{margin:left}}>
            <Description description={branch.description}/>
        </div>
        <NavigationTabs branch={branch}/>
        {children}
        </>
    )
}

function Description({description}){
    return(
        <p style={{fontSize:'1.7rem', marginTop:8,overflowWrap:'break-word'}}>{description}</p>
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
        <div style={{width:'100%',height:80}}>
            <div style={{position:'absolute',left:left}}>
                <Identifiers branch={branch}/>
            </div>
        </div>
        
    )
}

function Identifiers({branch}){
    return(

        <div className="flex-fill" style={{alignItems:'center',flexFlow:'row wrap',WebkitFlexFlow:'row wrap'}}>
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
        <p style={{margin:0,fontSize:'2rem',fontWeight:'bold',wordBreak:'break-word'}}>{name}</p>
    )
}

function Uri({uri}){
    return(
        <span style={{fontSize:'2em',color:'rgb(86, 86, 86)'}}>@{uri}</span>
    )
}

function NavigationTabs({branch}){
    return(
        <div className="flex-fill" style={{justifyContent:'center',WebkitJustifyContent:'center',alignItems:'center',
        WebkitAlignItems:'center',padding:10}}>
            <NavLink exact to={`/${branch.uri}`}
            style={{textDecoration:'none',color:'black',textAlign:'center',fontWeight:'bold',fontSize:'2rem',width:'100%'}}
            activeStyle={{borderBottom:'2px solid #2196f3',color:'#2196f3'}}>Posts</NavLink>
            <NavLink to={`/${branch.uri}/branches`}
            style={{textDecoration:'none',color:'black',textAlign:'center',fontWeight:'bold',fontSize:'2rem',width:'100%'}}
            activeStyle={{borderBottom:'2px solid #2196f3',color:'#2196f3'}}>Branches</NavLink>
        </div>
    )
}