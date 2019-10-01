import React, {useContext, useLayoutEffect, useRef, useState} from 'react';
import { css } from "@emotion/core";
import {NavLink} from 'react-router-dom';
import {
    UserContext,
    TourContext
} from "../container/ContextContainer"
import {Tooltip, TooltipChain} from "./Tooltip";
import {useMediaQuery} from 'react-responsive'

export function BranchPagePostList({branch}){
    const ref = useRef(null);
    const tourContext = useContext(TourContext);
    const [top,setTop] = useState(0);
    const [listWidth,setListWidth] = useState(0);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    useLayoutEffect(()=>{
        if(ref.current){
            setTop(ref.current.clientHeight)
            setListWidth(ref.current.clientWidth);
        }
    },[ref.current])

    function onLeave(){
        tourContext.seenBranchPostListTip = true;
    }
    // 20 pixels from excess padding
    let width = listWidth/3 - 20;

    return(
        <div className="flex-fill" css={{justifyContent:'space-around',backgroundColor:'#08aeff',position:'sticky',
        top:isMobile?0:52,zIndex:4}} ref={ref}>
            <NavLink to={`/${branch.uri}`} exact activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                {branch.name}
            </NavLink>
            
            <NavLink to={`/${branch.uri}/tree`} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Tree
            </NavLink>

            <NavLink to={`/${branch.uri}/community`} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Community
            </NavLink>
            {localStorage.getItem('has_seen_tour')==='false' && !tourContext.seenBranchPostListTip?
            <TooltipChain delay={12000} onLeave={onLeave}>
                <Tooltip position={{left:0,top:top}}>
                    <p css={{fontWeight:400,width:width}}>{branch.name}'s leaves</p>
                </Tooltip>
                <Tooltip position={{left:isMobile?0:listWidth/3,top:top}}>
                    <p css={{fontWeight:400,width:isMobile?listWidth-20:width}}>
                    <b>Tree</b>. Content from all the communities <b>similar</b> to {branch.name}
                    </p>
                </Tooltip>
                <Tooltip position={{left:isMobile?0:listWidth/3 * 2,top:top}}>
                    <p css={{fontWeight:400,width:isMobile?listWidth-20:width}}>
                    <b>Community</b>. Content created by {branch.name}'s community</p>
                </Tooltip>
            </TooltipChain>:null}
        </div>
    )
}