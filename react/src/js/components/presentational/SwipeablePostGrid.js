import React, {useState,useRef,useEffect,useLayoutEffect,useContext} from "react";
import {css} from "@emotion/core";
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import {PreviewPost} from "./PreviewPost"
import {Post} from "./SingularPost"
import {SkeletonFixedGrid} from "./SkeletonGrid"
import {SwipeablePostGridContext} from "../container/ContextContainer";
import {useMediaQuery} from 'react-responsive'

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

/*
bigItemCount:0,
mediumItemCount:1,
responsiveItemCount:3,
smallItemCount:4 

bigItemCount:1,
mediumItemCount:1,
responsiveItemCount:3,
smallItemCount:3

bigItemCount:1,
mediumItemCount:1,
responsiveItemCount:4,
smallItemCount:2
*/

export function SwipeablePostGrid({postsContext,activeBranch,posts,fetchData,hasMore,width,height,refresh}){

    const swipeablePostGridContext = useContext(SwipeablePostGridContext);
    let containerHeight = 860;
    let columnCount = 4;
    let rowCount = Math.round(4 * containerHeight / width);
    let itemCount = 8;
    let pageType;
    if(width/height < 0.6){
        pageType={
            type:'mobile',
            size:8,
            bigItemCount:1,
            mediumItemCount:2,
            responsiveItemCount:2,
            smallItemCount:3
        }
    }
    if(height<=640){
        pageType={
            type:'mobile',
            size:8,
            bigItemCount:1,
            mediumItemCount:2,
            responsiveItemCount:2,
            smallItemCount:3
        }
    }else if(height <= 760){
        pageType={
            type:'largeMobile',
            size:8,
            bigItemCount:1,
            mediumItemCount:2,
            responsiveItemCount:1,
            smallItemCount:4
        }
    }else{
        pageType={
            type:'desktop',
            size:8,
            bigItemCount:0,
            mediumItemCount:1,
            responsiveItemCount:3,
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

    // this ref is need in order to keep track of "pages" state inside the "onFrame" function
    const pagesRef = useRef();
    pagesRef.current = pages;
 
    const movX = useRef(null);
    const shouldOpen = useRef(true);

    // index state is only changed after animation ends in order to virtually
    // render infinite pages
    // this ref is needed to change the index state on the "onFrame" function after animation ends
    const shouldUpdate = useRef(false);
    const jumpedToBack = useRef(false);
    const didRefresh = useRef(false);
    const sentToLeft = useRef(false);
    const sentToRight = useRef(false);
    const shouldCaptureWheel = useRef(true);
    const container = useRef(null);
    let offsetLeft = 15;

    const isDown = useRef(false);
    const [index,setIndex] = useState(postsContext.lastPage);

    // ref is needed to keep track of index in the onFrame function
    // which does not pick up on rerenders
    const indexRef = useRef(postsContext.lastPage);
    const widthRef = useRef(width);
    widthRef.current = width;
    // ref to capture render end after index change
    // used to apply correct values to left and right pages
    const dataIndexChanged = useRef(false);


    // the functions inside spring are not aware of state changes so multiple refs
    // are used to keep track of state changes
    const [props, set, stop] = useSpring(()=>({
        from:from(),
        config:{ mass: 1, tension: 500, friction: 35 },
        onRest:()=>{
            if(dataIndexChanged.current){
                dataIndexChanged.current = false;
            }
        },
        onFrame:(f)=>{
            if(f.x!=0){
                shouldCaptureWheel.current = false;
            }

            // When user is rapid swiping or switching pages animations would not play
            // for whatever reason this stop fixes this
            stop();

            if((Math.abs(f.x) - offsetLeft > widthRef.current && Math.abs(f.x) - offsetLeft - 1 < widthRef.current)
            || (Math.abs(f.x) > widthRef.current && Math.abs(f.x) - 1 < widthRef.current)){
                if(didRefresh.current){
                    didRefresh.current = false
                    indexRef.current = 0;
                    setIndex(0);
                    refresh();
                }

                if(jumpedToBack.current){
                    jumpedToBack.current = false;
                    indexRef.current = 0;

                    // Timeout for whatever reason prevents flashing after setIndex
                    setTimeout(()=>{setIndex(0);},5)
                }
                else if(shouldUpdate.current){
                    dataIndexChanged.current = true;
                    shouldUpdate.current = false;
                    if(movX.current > 0 || sentToLeft.current){
                        movX.current = 0;
                        if(indexRef.current != 0){
                            sentToLeft.current = false;
                            indexRef.current -=1
                            setIndex(indexRef.current)
                        }
                    }else{
                        if(pagesRef.current[indexRef.current]){
                            sentToRight.current = false;
                            indexRef.current +=1
                            setIndex(indexRef.current)
                        }
                    }
                }
            }
        }
    }))

    function jumpToBack(){
        if(indexRef.current == 1){
            goToLeft();
        }else{
            jumpedToBack.current = true;
            // jump to 1st index
            // then capture index change on effect and play animation to index 0
            indexRef.current = 1;
            setIndex(1);
        }
    }

    function changeIndex(i){
        indexRef.current = i;
        setTimeout(()=>{setIndex(i);},5)
    }

    swipeablePostGridContext.setIndex = changeIndex;


    function goToLeft(){
        if(indexRef.current != 0){
            sentToLeft.current = true;
            shouldUpdate.current = true;
    
            set(()=>({
                to:ani(width),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },
            }))
        }
    }

    function goToRight(){
        if(indexRef.current!=pages.length){
            sentToRight.current = true;
            shouldUpdate.current = true;
    
            set(()=>({
                to:ani(-width - offsetLeft),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },
            }))
        }
    }

    useLayoutEffect(()=>{
        shouldCaptureWheel.current = true;
        if(!jumpedToBack.current){
            postsContext.lastPage = indexRef.current;

            set(()=> ({
                from:ani(0),
                to:ani(0),
                immediate:true,
            }))
                
        }else{
            set(()=>({
                to:ani(width),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },
            }))
        }
        if(index>=Math.round(pages.length - 3) && index !=0){
            fetchData();
        }
        
    },[index])

    function wheelEvent(e){
        e.preventDefault();

        if(shouldCaptureWheel.current){
            // check horizontal movement first
            // if there isn't fall back to vertical movement
            if(e.wheelDeltaX != 0){
                if(e.wheelDeltaX < 0){
                    goToRight();
                }else{
                    goToLeft();
                }
            }else{
                if(e.wheelDelta > 0){
                    goToRight();
                }else if(e.wheelDelta <0){
                    goToLeft();
                }
            }
        }
    }

    useEffect(()=>{
        if(container.current){
            container.current.addEventListener('wheel',wheelEvent)
        }

        return () =>{
            if(container.current){
                container.current.removeEventListener('wheel',wheelEvent)
            }
        }
    },[index,container])

    let previewPostContainer = document.getElementById('leaf-preview-root');

    const mxRef = useRef(0);
    const velocityTrigger = useRef(false);

    const bind = useDrag(({ down, velocity, movement: [mx], direction: [xDir,yDir],cancel }) => {

        if(previewPostContainer.childElementCount>0) cancel();
        const isLastPage = index==pages.length
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

        const isGone = (!down && trigger || (Math.abs(mx)>200));

        mxRef.current = mx;
        if(isGone) cancel();

        set(()=>{
            //const x = isGone ? xDir > 0 ? -width : width : down ? mx : 0;
            let x;
            if(isGone){
                shouldUpdate.current = true

                if(xDir < 0){
                    x = -width - offsetLeft;
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

            // if there is no right side stop moving
            if(xDir < 0 && isLastPage){
                x = 0;
                shouldUpdate.current = false;
            }

            return {
                to:ani(x),
                from:ani(0),
                immediate:false,
                config:{ mass: 1, tension: 500, friction: 35 },                
            }
        })
    })

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
        <div style={{position:'relative',width:width,height:height}} ref={container}>
            <NavigationArrows index={index} pages={pages} goToRight={goToRight} goToLeft={goToLeft} container={container}/>
            {index>0?<SendToStartArrow jumpToBack={jumpToBack}/>:<Refresh refresh={refresh}/>}
            <animated.div key={index - 1} data-index={index - 1} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{position:'absolute',zIndex:2,transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?-width - offsetLeft:
            1.5*x - width- offsetLeft>0?0:1.5*x-width - offsetLeft}px)`),
            width:'100%',height:'100%'}}>
                <div className="noselect" style={{height:'100%'}}>
                {pages[index - 1] && index!=-1?
                    <Page index={index-1} page={pages[index-1]}
                    {...pageProps}
                    />:null
                }
                </div>
            </animated.div>
            <animated.div {...bind()} key={index} data-index={index} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?0:x}px)`),position:'absolute',
            width:'100%',zIndex:1,height:'100%'}}>
                <div className="noselect" style={{height:'100%'}}>
                    {pages[index]?
                        <Page index={index} page={pages[index]} 
                        {...pageProps}
                    />:hasMore?<SkeletonFixedGrid/>:<div css={{width:'100%',display:'flex',justifyContent:'center',marginTop:50}}>
                    <p css={{fontSize:'1.5rem',fontWeight:'bold'}}>Seen everything</p></div>}
                </div>
            </animated.div>
            <animated.div key={index + 1} data-index={index + 1} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{position:'absolute',transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?width + offsetLeft:
            1.5*x + width + offsetLeft<0?0:1.5*x + width + offsetLeft}px)`),
            width:'100%',zIndex:0,height:'100%'}}>
                <div className="noselect" style={{height:'100%'}}>
                    {pages[index + 1]?
                        <Page index={index + 1} page={pages[index + 1]} 
                        {...pageProps}
                    />:hasMore?<SkeletonFixedGrid/>:<div css={{width:'100%',display:'flex',justifyContent:'center',marginTop:50}}>
                    <p css={{fontSize:'1.5rem',fontWeight:'bold'}}>Seen everything</p></div>}
                </div>
            </animated.div>
        </div>
    )
}

function NavigationArrows({index,pages,goToLeft,goToRight,container}){
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })
    const [hovering,setHovering] = useState(false);

    function onMouseOver(){
        setHovering(true);
    }

    function onMouseOut(){
        setHovering(false);
    }

    useEffect(()=>{
        if(container && container.current){
            container.current.addEventListener('mouseover',onMouseOver)
            container.current.addEventListener('mouseleave',onMouseOut)
        }

        return ()=>{
            if(container && container.current){
                container.current.removeEventListener('mouseover',onMouseOver)
                container.current.removeEventListener('mouseleave',onMouseOut)
            }
        }
    },[container])

    return(
        <>
        {!isMobile && hovering && index!=0?<LeftPageArrow goToLeft={goToLeft}/>:null}
        {!isMobile && hovering && index!=pages.length?<RightPageArrow goToRight={goToRight}/>:null}
        </>
    )
}


function Refresh({refresh}){
    return(
        <div css={{position:'absolute',bottom:15,right:15,zIndex:555}} onClick={refresh}>
            <RefreshSvg css={{height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:'#2397f3',
            fill:'white'}}/>
        </div>
    )
}
function SendToStartArrow({jumpToBack}){
    return(
        <div css={{position:'absolute',bottom:15,right:15,zIndex:555}} onClick={jumpToBack}>
            <LeftArrowSvg css={{height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:'#2397f3',
            fill:'white'}}/>
        </div>
    )
}

function LeftPageArrow({goToLeft}){
    return(
        <div css={{position:'absolute',top:'50%',left:15,zIndex:555}} onClick={goToLeft}>
            <LeftArrowSvg css={theme=>({height:15,width:15,padding:10,borderRadius:'50%',backgroundColor:theme.hoverColor,opacity:0.9,
            fill:theme.textLightColor,boxShadow:'0px 1px 3px 0px #0000005e'})}/>
        </div>
    )
}

function RightPageArrow({goToRight}){
    return(
        <div css={{position:'absolute',top:'50%',right:15,zIndex:555}} onClick={goToRight}>
            <LeftArrowSvg css={theme=>({height:15,width:15,padding:10,borderRadius:'50%',
            backgroundColor:theme.hoverColor,opacity:0.9,
            fill:theme.textLightColor,
            boxShadow:'0px 1px 3px 0px #0000005e',transform:'rotate(180deg)'})}/>
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
            flatDimensions:[3,3],
            label:'xsmall',
            isFlat:false
        },
        //responsive:[2,Math.round(rowCount/2)],
        responsive:{
            defaultDimensions:[!isMobile?3:3,!isMobile?6:6],
            flatDimensions:[!isMobile?6:6,!isMobile?3:3],
            label:'small',
            isFlat:false
        },
        medium:{
            defaultDimensions:[!isMobile?6:6,!isMobile?6:6],
            flatDimensions:[!isMobile?6:6,!isMobile?6:6],
            label:'medium',
            isFlat:false
        },
        big:{
            defaultDimensions:[!isMobile?6:6,!isMobile?12:10],
            flatDimensions:[!isMobile?9:12,!isMobile?6:6],
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
    
    function isFlat(post){
        if(post.images.length > 0){
            if(post.images[0].height < post.images[0].width){
                return true
            }
        }else if(post.videos.length > 0){
            if(post.videos[0].height < post.videos[0].width){
                return true
            }
        }
        return false
    }

    return(
        supportsGrid?
        <div className="noselect" css={theme=>gridContainer(theme,rowCount,columnCount,implicitRowCount,height)}>
            {order.map(o=>{
                return <div css={()=>cell(isFlat(o.post)?o.size.flatDimensions:o.size.defaultDimensions,isMobile)}>
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
        xmlSpace="preserve"
        {...props}
        >
        <g>
            <path d="M145.188,238.575l215.5-215.5c5.3-5.3,5.3-13.8,0-19.1s-13.8-5.3-19.1,0l-225.1,225.1c-5.3,5.3-5.3,13.8,0,19.1l225.1,225   c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1L145.188,238.575z" />
        </g>
        </svg>
    )
}

const RefreshSvg = props =>{
    return(
        <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 260 260"
        xmlSpace="preserve"
        {...props}
        >
        <path d="M223.7,140.7c-3.8,0-6.8,3-6.8,6.8c0,48.8-39.7,88.6-88.6,88.6s-88.6-39.7-88.6-88.6  c0-48.7,39.5-88.4,88.2-88.5l-20.5,20.5c-2.7,2.7-2.7,7,0,9.6c1.3,1.3,3.1,2,4.8,2c1.7,0,3.5-0.7,4.8-2L149.2,57c1.3-1.3,2-3,2-4.8  c0-1.8-0.7-3.5-2-4.8l-32.1-32.1c-2.7-2.7-7-2.7-9.6,0c-2.7,2.7-2.7,7,0,9.6l20.4,20.4c-56.1,0.2-101.8,46-101.8,102.2  c0,56.3,45.8,102.2,102.2,102.2s102.2-45.8,102.2-102.2C230.5,143.7,227.4,140.7,223.7,140.7z" />
        </svg>
    )
}