import React, {useState,useRef,useEffect,useContext} from "react";
import {css} from "@emotion/core";
import clamp from 'lodash-es/clamp'
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import {PreviewPost} from "./PreviewPost"
import {useMediaQuery} from 'react-responsive'


const gridContainer = (theme,rows,cols,minmax,height) =>css({
    height:'100%',
    display:'grid',
    gridTemplateColumns: `repeat(${cols},1fr)`,
    gridTemplateRows: `repeat(${rows},1fr)`,
    //gridTemplateColumns:`repeat(auto-fit, minmax(${minmax}px, 1fr))`,
    //gridTemplateRows:`repeat(auto-fit, minmax(${minmax}px, 1fr))`,
    gridTemplateColumns:`repeat(12, minmax(4vmin, 1fr))`,
    gridTemplateRows:`repeat(auto-fit, minmax(4vmin, 1fr))`,
    gridAutoRows:'1fr',
    gridAutoColumns:'1fr',
    gridGap:10,
    gridAutoFlow:'dense',
})

const cell = (size,isBig,isFlat) =>css({
    gridColumn:`span ${size[0]}`,
    gridRow:`span ${size[1]}`,
})

const bigCell = (isFlat,size) =>css({
    gridColumn:isFlat?'1 / -3':`span ${size[0]}`,
    gridRow:isFlat?`span ${size[1]}`:'1 / -5',
})

const animatedDiv = (theme) =>css({
    boxShadow:'rgb(0,0,0) 10px 9px 10px -7px',
    padding:5,
    boxSizing:'border-box',
    backgroundColor:theme.backgroundColor,
    willChange:'transform',
    border:'4px solid transparent',
    '@media (min-device-width: 767px)':{
        '&:hover':{
            borderRadius:10,
            border:'4px solid #2196f3'
        }
    }
})


const to = (x) => ({ x: x,scale: 1,display: 'block'})
const from = (x) => ({ x: x||0,scale: 1,display: 'block'})
const ani = (x) => ({ x: x,scale: 1,display: 'block'})
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r, s) => `rotateX(0deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`
const transX = (x) => `translateX(${x}px)`


export function SwipeablePostGrid({postsContext,activeBranch,posts,fetchData,width,height}){

    //let width = 660;
    let offset = 25;
    //let height = window.innerHeight;
    let containerHeight = 860;
    let columnCount = 4;
    let rowCount = Math.round(4 * containerHeight / width);
    let itemCount;
    let pageType;
    if(height<=640){
        itemCount = 5;
        pageType={
            type:'mobile',
            size:5,
            bigItemCount:1,
            mediumItemCount:1,
            responsiveItemCount:1,
            smallItemCount:2
        }
    }else if(height <= 760){
        itemCount = 8;
        pageType={
            type:'largeMobile',
            size:8,
            bigItemCount:1,
            mediumItemCount:1,
            responsiveItemCount:2,
            smallItemCount:4
        }
    }else{
        itemCount = 8;
        pageType={
            type:'desktop',
            size:8,
            bigItemCount:1,
            mediumItemCount:1,
            responsiveItemCount:2,
            smallItemCount:4
        }
    }
    function getPages(){
        var perChunk = itemCount // items per chunk    
        var result = posts.reduce((resultArray, item, index) => { 
        const chunkIndex = Math.floor(index/perChunk)

        if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
        }, [])

        return result
    }

    const [pages,setPages] = useState(getPages())
    const movX = useRef(null);
    const shouldOpen = useRef(true);
    const shouldUpdate = useRef(false);

    const isDown = useRef(false);
    const [index,setIndex] = useState(postsContext.lastPage);

    // ref is needed to keep track of index in the onFrame function
    // which does not pick up on rerenders
    const indexRef = useRef(postsContext.lastPage);
    const dataIndexChanged = useRef(false);
    const [props, set, stop] = useSpring(()=>({
        from:from(),
        config:{ mass: 1, tension: 500, friction: 35 },
        onRest:()=>{
            if(dataIndexChanged.current){
                dataIndexChanged.current = false;
            }
        },
        onFrame:(f)=>{
            if((f.x + 10 > 0 && f.x < 0)
            || (Math.abs(f.x) + 10 > width && Math.abs(f.x) < width)
            || (Math.abs(f.x) + 10 > 2 * width && Math.abs(f.x) < 2 * width)){
                stop();
                if(shouldUpdate.current){
                    dataIndexChanged.current = true;
                    if(movX.current > 0){
                        if(indexRef.current != 0){
                            indexRef.current -=1
                            setIndex(indexRef.current)
                        }
                    }else{
                        if(pages[indexRef.current + 1]){
                            indexRef.current +=1
                            setIndex(indexRef.current)
                        }
                    }
                }
            }
        }
    }))

    useEffect(()=>{
        if(shouldUpdate.current){
            shouldUpdate.current = false;
        }
    },[pages])

    useEffect(()=>{
        postsContext.lastPage = indexRef.current;
        if(shouldUpdate.current){
            shouldUpdate.current = false;
        }

        set(()=> ({
            from:ani(0),
            to:ani(0),
            immediate:true,
        }))
    },[index])

    let previewPostContainer = document.getElementById('leaf-preview-root');

    const bind = useDrag(({ down, velocity, movement: [mx], direction: [xDir], distance,cancel }) => {
        if(previewPostContainer.childElementCount>0) cancel();
        isDown.current = down;
        movX.current = mx;

        if(Math.abs(mx) > 10){
            shouldOpen.current = false;
        }else{
            shouldOpen.current = true;
        }

        const trigger = velocity > 0.2;
        const isGone = (!down && trigger) || Math.abs(mx) > 200;
        if(isGone) cancel();

        set(()=>{
            //const x = isGone ? xDir > 0 ? -width : width : down ? mx : 0;
            let x;
            if(isGone){
                shouldUpdate.current = true

                if(xDir < 0){
                    x = -width;
                }else{
                    // there is no left or right side here, index goes out of bounds
                    if(index == 0 || index == pages.length){
                        x = 0;
                        shouldUpdate.current = false;
                    }else{
                        x = width;
                    }
                }
            }else{
                if(!down){
                    x = 0
                }else{
                    x = mx;
                }
            }

            return {
                to:ani(x),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },                
            }
        })
    })

    //console.log(index)
    let pageProps = {
        posts:posts,
        activeBranch:activeBranch,
        postsContext:postsContext,
        shouldOpen:shouldOpen,
        width:width,
        height:window.innerHeight,
        pageType:pageType,
        rowCount:rowCount,
        columnCount:columnCount
    }

    console.log("indexed",pages[index + 1])
    return (
        <div style={{position:'relative',width:width,height:height}}>
            <animated.div key={index - 1} data-index={index - 1} css={theme=>animatedDiv(theme)}
            style={{position:'absolute',zIndex:2,transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?-width - offset:
            1.5*x - width- offset>0?0:1.5*x-width - offset}px)`),
            width:'100%',height:'100%'}}>
                <animated.div className="noselect" style={{height:'100%'}}>
                {pages[index - 1] && index!=-1?
                    <Page index={index-1} page={pages[index-1]}
                    {...pageProps}
                    />:null
                }
                </animated.div>
            </animated.div>
            <animated.div {...bind()} key={index} data-index={index} css={theme=>animatedDiv(theme)}
            style={{transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?0:x}px)`),position:'absolute',
            width:'100%',zIndex:1,height:'100%'}}>
                <animated.div className="noselect" style={{height:'100%'}}>
                    <Page index={index} page={pages[index]}
                    {...pageProps}
                    />
                </animated.div>
            </animated.div>
            <animated.div key={index + 1} data-index={index + 1} css={theme=>animatedDiv(theme)}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?width + offset:
            1.5*x + width + offset<0?0:1.5*x + width + offset}px)`),
            width:'100%',zIndex:0,height:'100%'}}>
                <animated.div className="noselect" style={{height:'100%'}}>
                    {pages[index + 1]?
                        <Page index={index + 1} page={pages[index + 1]} 
                        {...pageProps}
                    />:null}
                    
                </animated.div>
            </animated.div>
        </div>
    )
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function Page({page,activeBranch,postsContext,shouldOpen,pageType,height,rowCount,columnCount}){
    const bigItemTotal = useRef(pageType.bigItemCount);
    const mediumItemTotal = useRef(pageType.mediumItemCount);
    const responsiveItemTotal = useRef(pageType.responsiveItemCount);
    const smallItemTotal = useRef(pageType.smallItemCount);

    const gridGap = 10;
    const implicitRowCount = (height-10*gridGap)/12;

    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    let sizes = {
        small:{
            defaultDimensions:[3,3],
            isFlat:false
        },
        //responsive:[2,Math.round(rowCount/2)],
        responsive:{
            defaultDimensions:[!isMobile?3:3,!isMobile?6:6],
            isFlat:false
        },
        medium:{
            defaultDimensions:[!isMobile?6:6,!isMobile?6:6],
            isFlat:false
        },
        big:{
            defaultDimensions:[!isMobile?6:12,!isMobile?8:6],
            isBig:true,
            isFlat:false
        }
    }

    function getOrder(){
        console.log(page)
        let orderedPosts = [...page];

        // sort posts by engagement order
        // then assign a size to them
        orderedPosts.sort((a, b) => (a.engagement < b.engagement) ? 1 : -1)
        let orderWithSize = []
        for(let i=0;i<orderedPosts.length;i++){
            if(bigItemTotal.current!=0){
                orderWithSize.push({
                    size:sizes.big,
                    post:orderedPosts[i]
                })
                bigItemTotal.current -=1;
            }else if(mediumItemTotal.current!=0){
                orderWithSize.push({
                    size:sizes.medium,
                    post:orderedPosts[i]
                })
                mediumItemTotal.current -=1;
            }else if(responsiveItemTotal.current!=0){
                orderWithSize.push({
                    size:sizes.responsive,
                    post:orderedPosts[i]
                })
                responsiveItemTotal.current -=1;
            }else{
                orderWithSize.push({
                    size:sizes.small,
                    post:orderedPosts[i]
                })
                smallItemTotal.current -=1;
            }
        }
        return shuffle(orderWithSize);
    }

    const [order,setOrder] = useState(getOrder())

    function getPostProps(post){
        let props = {
            post:post,
            key:[post.id,post.spreaders,postsContext.content],
            viewAs:"post",
            activeBranch:activeBranch,
            postsContext:postsContext,
            index:0
        };
        return props;
    }

    
    return(
        <div className="noselect" css={theme=>gridContainer(theme,rowCount,columnCount,implicitRowCount,height)}>
            {order.map(o=>{
                return <div css={()=>cell(o.size.defaultDimensions,isMobile)}>
                    <PreviewPost {...getPostProps(o.post)} viewAs="post" size="large" shouldOpen={shouldOpen}/>
                </div>
            })}
        </div>
    )
}
