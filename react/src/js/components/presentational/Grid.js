import React from "react";
import {css} from "@emotion/core";

const gridContainer = () =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:'repeat(4, 1fr)',
    gridTemplateRows:'repeat(4, 1fr)',
    gridGap:10,
    height:400
})

const cell = size =>css({
    gridColumnStart:`span ${size[0]}`,
    gridRowStart:`span ${size[1]}`,
})

var randomProperty = function (obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
};

// [x,y]
const sizes = {
    small:[1,1],
    medium:[2,2],
    large:[2,4]
}

export function Grid(){
    return(
        <div css={gridContainer}>
            <div style={{backgroundColor:'red'}} css={()=>cell(randomProperty(sizes))}></div>
            <div style={{backgroundColor:'purple'}}></div>
            <div style={{backgroundColor:'green'}}></div>
            <div style={{backgroundColor:'black'}}></div>
            <div style={{backgroundColor:'blue'}}></div>
            <div style={{backgroundColor:'yellow'}}></div>
        </div>
    )
}