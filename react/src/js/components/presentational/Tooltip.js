import React, {useContext, useEffect, useRef, useState} from "react"
import {Link} from "react-router-dom"
import { css, keyframes } from "@emotion/core";
import {useTheme as useEmotionTheme} from "emotion-theming";
import {ToggleContent} from './Temporary'
import {UserContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import {useMyBranches} from "../container/BranchContainer"
import {CreateNewBranch} from "./CreateNewBranch"
import {CSSTransition} from 'react-transition-group';
import {useTheme} from "../container/ThemeContainer";
import ReactDOM from 'react-dom';

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
`

export function TooltipChain({delay,children}){

    const [tooltipIndex,setIndex] = useState(0);

    function moveIndex(){
        setIndex(i=>i+1);
    }

    useEffect(()=>{
        let count = React.Children.count(children);

        if(tooltipIndex<count){
            setTimeout(moveIndex,delay);
        }
        
    },[tooltipIndex])

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
}

export function Tooltip({index,setIndex,position,children}){
    return(
        <div style={{position:'absolute',left:position.left, top:position.top,zIndex:231231231323123123}}>
            <div css={tooltipCss}>
                {children}
            </div>
        </div>
    )
}