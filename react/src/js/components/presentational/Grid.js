import React, {useState,useRef} from "react";
import {css} from "@emotion/core";

// proceed with caution

const gridContainer = () =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:'repeat(2, 1fr)',
    gridTemplateRows:'repeat(2, 1fr)',
    gridAutoFlow:'dense',
    gridGap:10,
    height:600
})

const nestedContainer = (size,item,parentGridSize) =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:`repeat(${size}, 1fr)`,
    gridTemplateRows:`repeat(${size}, 1fr)`,
    gridRow:`span ${item.isFlat?'initial':parentGridSize}`,
    gridColumn:`span ${item.isFlat?parentGridSize:'initial'}`,
    gridAutoFlow:'dense',
    gridGap:10,
})

const smallGrid = (isParentFlat,isBigFlat) =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:`repeat(2, 1fr)`,
    gridTemplateRows:`repeat(2, 1fr)`,
    gridRow:`span ${isParentFlat?isBigFlat?2:1:isBigFlat?4:2}`,
    gridColumn:`span ${isParentFlat?isBigFlat?2:4:isBigFlat?1:2}`,
    gridAutoFlow:'dense',
    gridGap:10,
})

const cell = (item,isFlat=false,isParentFlat) =>css({
    gridColumn:`span ${item.size.getDimensions(isFlat,isParentFlat)[0]}`,
    gridRow:`span ${item.size.getDimensions(isFlat,isParentFlat)[1]}`,
})

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


export function Grid({posts}){
    let sizes = {
        xsmall:{
            getDimensions:(isFlat,isParentFlat)=>{
                if(isFlat){
                    return [1,2]
                }else{
                    return [2,1]
                }
            },
            label:'xsmall',
        },
        small:{
            getDimensions:(isFlat,isParentFlat)=>{
                if(isFlat){
                    if(isParentFlat){
                        return [2,2]
                    }else{
                        return [4,1]
                    }
                }else{
                    if(isParentFlat){
                        return [1,4]
                    }else{
                        return [2,2]
                    }
                }
            },
            label:'small'
        },
        medium:{
            getDimensions:(isParentFlat)=>{
                if(isParentFlat){
                    return [2,4]
                }else{
                    return [4,2]
                }
            },
            label:'medium'
        },
        large:{
            getDimensions:(isFlat)=>{
                if(isFlat){
                    return [2,1]
                }else{
                    return [1,2]
                }
            },
            label:'large'
        }
    }


    let items = [
        {
            size:sizes.large,
            isFlat:false
        },
        {
            size:sizes.medium,
            isFlat:false
        },
        {
            size:sizes.small,
            isFlat:true
        },
        {
            size:sizes.xsmall,
            isFlat:false
        },
        {
            size:sizes.xsmall,
            isFlat:false
        }
    ]

    return(
        <div css={gridContainer}>
            <div style={{backgroundColor:'black',order:getRandomInt(2)}} 
            css={()=>cell(items[0],items[0].isFlat)}></div>
            <div css={()=>nestedContainer(4,items[0],2)}>
                <div style={{backgroundColor:'green'}} 
                css={()=>cell(items[1],items[0].isFlat)}></div>
                <div style={{backgroundColor:'red',order:getRandomInt(3)-1}} 
                css={()=>cell(items[2],items[2].isFlat,items[0].isFlat)}></div>
                <div css={()=>smallGrid(items[2].isFlat,items[0].isFlat)}>
                    <div style={{backgroundColor:'purple',order:getRandomInt(2)}} 
                    css={()=>cell(items[3],items[2].isFlat,items[0].isFlat)}></div>
                    <div style={{backgroundColor:'blue',order:getRandomInt(2)-1}} 
                    css={()=>cell(items[4],items[2].isFlat,items[0].isFlat)}></div>
                </div>
            </div>
        </div>
    )
}