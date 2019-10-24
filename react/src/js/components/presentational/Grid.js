import React, {useState,useRef} from "react";
import {css} from "@emotion/core";

const gridContainer = () =>css({
    display:'grid',
    placeContent:'stretch',
    gridTemplateColumns:'repeat(4, 1fr)',
    gridTemplateRows:'repeat(4, 1fr)',
    gridAutoFlow:'dense',
    gridGap:10,
    height:400
})

const cell = size =>css({
    gridColumn:`span ${size[0]}`,
    gridRow:`span ${size[1]}`,
})

var randomProperty = function (obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}
/*[
    // [row, available cells]
    [1,2],
    [2,2],
    []
]*/

let orde2r = [1,2,3,4,5]

export function Grid(){
    // 4x4 grid
    let availableSize = [4,4];

    function getOrder(){

    }
    
    //const [order,setOrder] = useState(shuffle([1,2,3,4,5]))

    const order = useRef([1,2,3,4,5])
    let sizes = {
        small:{
            dimensions:[1,1],
            label:'xsmall'
        },
        flat:{
            dimensions:[2,1],
            label:'small'
        },
        stand:{
            dimensions:[1,2],
            label:'small'
        },
        square:{
            dimensions:[2,2],
            label:'medium'
        },
        bigFlat:{
            dimensions:[4,2],
            label:'large'
        },
        bigStand:{
            dimensions:[2,4],
            label:'large'
        }
    }


    function getOrder(size){
        
        if(order.current.length == 0){
            order.current = [1,2,3,4,5]
        }
        let num;
        if(size=='large'){
            num = [1,6][Math.floor(Math.random()*[1,6].length)];
        }else if(size=='medium'){
            num = [2,3,4][Math.floor(Math.random()*[2,3,4].length)];
        }else if(size=='small'){
            let intersection = [2,3,4,5].filter(value => -1 !== order.current.indexOf(value))
            num = intersection[Math.floor(Math.random()*intersection.length)];
        }else{
            let intersection = [1,2,3,4,5].filter(value => -1 !== order.current.indexOf(value))
            num = intersection[Math.floor(Math.random()*intersection.length)];
        }

        let index = order.current.indexOf(num);
        if (index > -1) {
            order.current.splice(index, 1);
        }



        console.log(num,order.current)
        //console.log(ord,order,order[ord])
        return num
    }

    let items = [
        {
            size:sizes.stand,
            order:getOrder(sizes.stand.label)
        },
        {
            size:sizes.small,
            order:getOrder(sizes.stand.label)

        },
        {
            size:sizes.square,
            order:getOrder(sizes.square.label)

        },
        {
            size:sizes.bigStand,
            order:getOrder(sizes.bigFlat.label)

        },
        {
            size:sizes.small,
            order:getOrder(sizes.small.label)

        }
    ]
    //cell(randomProperty(sizes)

    return(
        <div css={gridContainer}>
            <div style={{backgroundColor:'red',order:items[0].order}} css={()=>cell(items[0].size.dimensions)}></div>
            <div style={{backgroundColor:'green',order:items[2].order}} css={()=>cell(items[2].size.dimensions)}></div>
            <div style={{backgroundColor:'purple',order:items[1].order}} css={()=>cell(items[1].size.dimensions)}></div>
            <div style={{backgroundColor:'blue',order:items[4].order}} css={()=>cell(items[4].size.dimensions)}></div>
            <div style={{backgroundColor:'black',order:items[3].order}} css={()=>cell(items[3].size.dimensions)}></div>

        </div>
    )
}