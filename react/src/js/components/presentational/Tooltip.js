import React, {useContext, useEffect, useRef, useState} from "react"
import { css, keyframes } from "@emotion/core";
import {useMediaQuery} from 'react-responsive'

const scale_up_left = keyframes`
  0% {
        transform: scale(0.5);
        transform-origin: 0% 50%;
  }
  100% {
        transform: scale(1);
        transform-origin: 0% 50%;
  }
`

let tooltipCss = css`
    animation: ${scale_up_left} 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    background-color: #2196F3;
    color:white;
    padding:10px;
    box-shadow:0px 3px 5px -2px black;
    font-size:1.4rem;
    display:flex;
    justify-content:center;
    align-items:center;
    flex-flow:column;
`

let gotIt = css`
    border: 0;
    background-color: #1a91ef;
    color: white;
    box-shadow: 0px 0px 6px -2px #000b15;
    padding: 3px 6px;
    border-radius: 10px;
`

export const HoverableTooltip = ({text="",position,children})=>{
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    const [showTooltip,setShowTooltip] = useState(false);
    let setTimeoutConst;
    let setTimeoutConst2;

    function handleMouseEnter(){
        clearTimeout(setTimeoutConst2)

        setTimeoutConst = setTimeout(()=>{
            setShowTooltip(true);
        },500)
    }

    function handleMouseLeave(){
        clearTimeout(setTimeoutConst)

        setTimeoutConst2 = setTimeout(()=>{
            setShowTooltip(false);
        },500)
    }

    function handleClick(){
        setShowTooltip(false);
    }

    return (
        <div>
            {React.Children.map(children, (child, i) => {
                return React.cloneElement(child, { onMouseEnter:isMobile?null:handleMouseEnter,
                onMouseLeave:isMobile?null:handleMouseLeave})
            })}
            {showTooltip?
            <div style={{position:'absolute',left:position.left, top:position.top,zIndex:231}}
            onMouseEnter={isMobile?null:handleMouseEnter} onMouseLeave={isMobile?null:handleMouseLeave}>
                <div css={tooltipCss}>
                    <span>{text}</span>
                </div>
            </div>:null}
        </div>
    )
}

export const TooltipChain = React.memo(({delay,onLeave=null,children})=>{

    const [tooltipIndex,setIndex] = useState(0);

    function moveIndex(){
        setIndex(i=>i+1);
    }

    useEffect(()=>{
        let count = React.Children.count(children);
        let timeout = null;

        if(tooltipIndex<count){
            timeout = setTimeout(moveIndex,delay);
        }

        return ()=>{
            clearTimeout(timeout);
        }
        
    },[tooltipIndex])

    useEffect(()=>{
        return ()=>{
            if(onLeave){
                onLeave();
            }
        }
    },[])

    return (
        <div>
          {React.Children.map(children, (child, i) => {
            if(i==tooltipIndex){
                return React.cloneElement(child, { index:i, setIndex: setIndex })
            }
            return null;
          })}
        </div>
    )
})


export function Tooltip({index,setIndex,position,children}){
    function handleClick(e){
        e.stopPropagation();
        setIndex(index + 1);
    }

    return(
        <div style={{position:'absolute',left:position.left, top:position.top,zIndex:231}}>
            <div css={tooltipCss}>
                {children}
                <button onClick={handleClick} css={gotIt}>Got it</button>
            </div>
        </div>
    )
}