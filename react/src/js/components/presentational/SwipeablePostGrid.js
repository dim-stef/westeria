import React, {useState,useRef,useEffect,useLayoutEffect,useCallback} from "react";
import {css} from "@emotion/core";
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import {PreviewPost} from "./PreviewPost"
import {Post} from "./SingularPost"
import {useMediaQuery} from 'react-responsive'
import axios from "axios";

function cssPropertyValueSupported(prop, value) {
    var d = document.createElement('div');
    d.style[prop] = value;
    return d.style[prop] === value;
}

const gridContainer = () =>css({
    height:'100%',
    display:'grid',
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

const animatedDiv = (theme,supportsGrid) =>css({
    overflow:supportsGrid?'hidden':'auto',
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


export function SwipeablePostGrid({postsContext,activeBranch,posts,fetchData,hasMore,width,height,refresh}){

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

    const pages = getPages();
    const pagesRef = useRef();
    pagesRef.current = pages;
 
    const movX = useRef(null);
    const shouldOpen = useRef(true);
    const shouldUpdate = useRef(false);
    const jumpedToBack = useRef(false);
    const resetPages = useRef(false);

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
                //stop();
                if(jumpedToBack.current){
                    jumpedToBack.current = false;
                    indexRef.current = 0;

                    // Timeout for whatever reason prevents flashing after setIndex
                    setTimeout(()=>{setIndex(0);},5)
                }else if(shouldUpdate.current){
                    dataIndexChanged.current = true;
                    shouldUpdate.current = false;
                    if(movX.current > 0){
                        if(indexRef.current != 0){
                            indexRef.current -=1
                            setIndex(indexRef.current)
                        }
                    }else{
                        if(pagesRef.current[indexRef.current]){
                            indexRef.current +=1
                            setIndex(indexRef.current)
                        }
                    }
                }
            }
        }
    }))

    function jumpToBack(){
        jumpedToBack.current = true;
        // jump to 1st index
        // then capture index change on effect and play animation to index 0
        setIndex(1);
    }

    useLayoutEffect(()=>{
        if(!jumpedToBack.current){
            postsContext.lastPage = indexRef.current;

            set(()=> ({
                from:ani(0),
                to:ani(0),
                immediate:true,
            }))
    
            // if user is on the middle page fetch more pages
            if(index>=Math.round(pages.length/2)){
                fetchData();
            }
        }else{
            set(()=>({
                to:ani(width),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },
            }))
        }
        
    },[index])

    let previewPostContainer = document.getElementById('leaf-preview-root');

    const mxRef = useRef(0);
    const velocityTrigger = useRef(false);
    const mxTrigger = useRef(false);

    const bind = useDrag(({ down, velocity, movement: [mx], direction: [xDir,yDir], distance,cancel,canceled }) => {
        if(previewPostContainer.childElementCount>0) cancel();
        isDown.current = down;
        movX.current = mx;

        if(Math.abs(mx) > 10){
            shouldOpen.current = false;
        }else{
            shouldOpen.current = true;
        }

        const trigger = velocity > 0.2;
        if(trigger){
            velocityTrigger.current = true;
        }

        const isGone = (!down && Math.abs(mx)>20 || (Math.abs(mx)>200));

        mxRef.current = mx;
        if(isGone) cancel();

        set(()=>{
            //const x = isGone ? xDir > 0 ? -width : width : down ? mx : 0;
            let x;
            if(isGone){
                shouldUpdate.current = true

                if(xDir < 0){
                    x = -width;
                }else{
                    // there is no left side here, index goes out of bounds
                    if(index == 0){

                        // if left side movement is bigger than 50 refresh
                        // "pull to side" to refresh
                        if(mx>100){
                            refresh();
                        }
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

    // if grid is not supported old posts kick in
    // in order to not open when the user is dragging the page this is needed
    const shouldOpenNonGridPost = Math.abs(movX.current) < 5
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
        columnCount:columnCount,
        movX:movX
    }

    let supportsGrid = cssPropertyValueSupported('display', 'grid');

    return (
        <div style={{position:'relative',width:width,height:height}}>
            {index>1?<SendToStartArrow jumpToBack={jumpToBack}/>:null}
            <animated.div key={index - 1} data-index={index - 1} css={theme=>animatedDiv(theme,supportsGrid)}
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
            <animated.div {...bind()} key={index} data-index={index} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?0:x}px)`),position:'absolute',
            width:'100%',zIndex:1,height:'100%'}}>
                <animated.div className="noselect" style={{height:'100%'}}>
                    {pages[index]?
                        <Page index={index} page={pages[index]} 
                        {...pageProps}
                    />:hasMore?<p>Loading</p>:<p>Seen everything</p>}
                </animated.div>
            </animated.div>
            <animated.div key={index + 1} data-index={index + 1} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?width + offset:
            1.5*x + width + offset<0?0:1.5*x + width + offset}px)`),
            width:'100%',zIndex:0,height:'100%'}}>
                <animated.div className="noselect" style={{height:'100%'}}>
                    {pages[index + 1]?
                        <Page index={index + 1} page={pages[index + 1]} 
                        {...pageProps}
                    />:hasMore?<p>Loading</p>:<p>Seen everything</p>}
                </animated.div>
            </animated.div>
        </div>
    )
}

function SendToStartArrow({jumpToBack}){
    return(
        <div css={{height:50,width:50,position:'absolute',bottom:0,right:0,zIndex:555}} onClick={jumpToBack}>
            <LeftArrowSvg/>
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

function Page({page,activeBranch,postsContext,pageType,height,shouldOpen,
    movX,rowCount,columnCount}){

    let supportsGrid = cssPropertyValueSupported('display', 'grid');
    const cachedPageLength = useRef(page.length)
    const gridGap = 10;
    const implicitRowCount = (height-10*gridGap)/12;

    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    let sizes = {
        small:{
            defaultDimensions:[3,3],
            label:'xsmall',
            isFlat:false
        },
        //responsive:[2,Math.round(rowCount/2)],
        responsive:{
            defaultDimensions:[!isMobile?3:3,!isMobile?6:6],
            label:'small',
            isFlat:false
        },
        medium:{
            defaultDimensions:[!isMobile?6:6,!isMobile?6:6],
            label:'medium',
            isFlat:false
        },
        big:{
            defaultDimensions:[!isMobile?6:12,!isMobile?8:6],
            label:'large',
            isBig:true,
            isFlat:false
        }
    }

    function getOrder(){
        let bigItemTotal = pageType.bigItemCount;
        let mediumItemTotal = pageType.mediumItemCount;
        let responsiveItemTotal = pageType.responsiveItemCount;
        let smallItemTotal = pageType.smallItemCount;

        let orderedPosts = [...page];

        // sort posts by engagement order
        // then assign a size to them
        orderedPosts.sort((a, b) => (a.engagement < b.engagement) ? 1 : -1)
        let orderWithSize = []
        for(let i=0;i<orderedPosts.length;i++){
            if(bigItemTotal!=0){
                orderWithSize.push({
                    size:sizes.big,
                    post:orderedPosts[i]
                })
                bigItemTotal -=1;
            }else if(mediumItemTotal!=0){
                orderWithSize.push({
                    size:sizes.medium,
                    post:orderedPosts[i]
                })
                mediumItemTotal -=1;
            }else if(responsiveItemTotal!=0){
                orderWithSize.push({
                    size:sizes.responsive,
                    post:orderedPosts[i]
                })
                responsiveItemTotal -=1;
            }else{
                orderWithSize.push({
                    size:sizes.small,
                    post:orderedPosts[i]
                })
                smallItemTotal -=1;
            }
        }
        return shuffle(orderWithSize);
    }

    const [order,setOrder] = useState(getOrder())

    useEffect(()=>{
        if(page.length!=cachedPageLength.current){
            cachedPageLength.current = page.length;
            setOrder(getOrder());
        }
    },[page])

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
        supportsGrid?
        <div className="noselect" css={theme=>gridContainer(theme,rowCount,columnCount,implicitRowCount,height)}>
            {order.map(o=>{
                return <div css={()=>cell(o.size.defaultDimensions,isMobile)}>
                    <PreviewPost {...getPostProps(o.post)} viewAs="post" size={o.size.label} shouldOpen={shouldOpen}/>
                </div>
            })}
        </div>
        :
        <div css={{display:'flex',flexFlow:'column'}}>
            {order.map(o=>{
                return <Post {...getPostProps(o.post)} movement={movX}/>
            })}
        </div>
        
    )
}


const LeftArrowSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 477.175 477.175"
        style={{ enableBackground: "new 0 0 477.175 477.175" }}
        css={theme=>({height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:'#2397f3',
        fill:'white'})}
        xmlSpace="preserve"
        >
        <g>
            <path d="M145.188,238.575l215.5-215.5c5.3-5.3,5.3-13.8,0-19.1s-13.8-5.3-19.1,0l-225.1,225.1c-5.3,5.3-5.3,13.8,0,19.1l225.1,225   c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1L145.188,238.575z" />
        </g>
        </svg>
    )
}