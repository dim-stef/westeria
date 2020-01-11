import React, {useState,useRef,useEffect,useLayoutEffect,useContext} from "react";
import ReactDOM from "react-dom"
import {css} from "@emotion/core";
import { useSpring, useTransition, useChain, animated, config } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import {PreviewPost} from "./PreviewPost"
import {Post} from "./SingularPost"
import {SkeletonFixedGrid} from "./SkeletonGrid"
import StatusUpdate from "./StatusUpdate";
import {SwipeablePostGridContext} from "../container/ContextContainer";
import {useMediaQuery} from 'react-responsive'
import {PlusSvg} from "./Svgs"

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
    boxShadow:'rgba(0, 0, 0, 0.32) 9px 7px 10px -7px',
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

export function SwipeablePostGrid({postsContext,activeBranch,posts,fetchData,hasMore,width,height,refresh,
    updateFeed,isFeed}){

    const swipeablePostGridContext = useContext(SwipeablePostGridContext);
    let containerHeight = 860;
    let columnCount = 4;
    let rowCount = Math.round(4 * containerHeight / width);
    let itemCount = 7;
    let pageType;
    /*if(width/height < 0.6){
        pageType={
            type:'mobile',
            size:8,
            bigItemCount:1,
            mediumItemCount:1,
            responsiveItemCount:3,
            smallItemCount:3
        }
    }*/

    if(height <= 760){
        itemCount = 6;
        pageType={
            type:'largeMobile',
            size:6,
            bigItemCount:1,
            mediumItemCount:2,
            responsiveItemCount:3,
            smallItemCount:0
        }
    }else{
        pageType={
            type:'desktop',
            size:7,
            bigItemCount:0,
            mediumItemCount:1,
            responsiveItemCount:3,
            smallItemCount:3
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
    const xDirRef = useRef(0);
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

    const isSafariFeature = window['safari'] && safari.pushNotification &&
    safari.pushNotification.toString() === '[object SafariRemoteNotification]';

    function isSafariVendor() {
        if (navigator.vendor.match(/[Aa]+pple/g) && navigator.vendor.match(/[Aa]+pple/g).length > 0 ) 
          return true;
        return false;
    }

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
            // for whatever reason this stop() fixes this
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
                    if(xDirRef.current > 0 || sentToLeft.current){
                        xDirRef.current = 0;
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

    useEffect(()=>{
        if(postsContext.content=='branch' && postsContext.lastPage!=index){
            indexRef.current = 0;
            setIndex(0);
        }
    },[activeBranch])

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
    let modal = document.getElementById('disable-slide-swipe')

    const mxRef = useRef(0);
    const velocityTrigger = useRef(false);

    const bind = useDrag(({ down, velocity,swipe:[swipeX,swipeY], movement: [mx,my], direction: [xDir,yDir],xy:[x,y],cancel }) => {
        // if browser is safari and user swipes from edge cancel the interaction
        // let safari handle the native gesture history
        if((isSafariFeature || isSafariVendor()) && 
        (x <= 0.05*window.innerWidth || x>= window.innerWidth - 0.05*window.innerWidth)){
            cancel();
        }

        if(previewPostContainer.childElementCount>0 || modal.childElementCount>0) cancel();
        const isLastPage = index==pages.length
        isDown.current = down;
        movX.current = mx;
        xDirRef.current = xDir;

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
    },{axis:'x'})

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
        movX:movX,
        updateFeed:updateFeed,
        isFeed:isFeed,
        container:container
    }

    let supportsGrid = cssPropertyValueSupported('display', 'grid');

    return (
        <div style={{position:'relative',width:width,height:height}} ref={container} id="grid-container">
            <NavigationArrows index={index} pages={pages} goToRight={goToRight} goToLeft={goToLeft} container={container}/>
            {index>0?<SendToStartArrow jumpToBack={jumpToBack}/>:<Refresh refresh={refresh}/>}
            <animated.div key={index - 1} data-index={index - 1} css={theme=>animatedDiv(theme,supportsGrid)}
            style={{position:'absolute',zIndex:2,transform : props.x.interpolate(x => `translateX(${dataIndexChanged.current?-width - offsetLeft:
            1.5*x - width- offsetLeft>0?0:1.5*x-width - offsetLeft}px)`),
            width:'100%',height:'100%'}}>
                <div className="noselect" style={{height:'100%',borderRadius:15,overflow:'hidden'}}>
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
                <div className="noselect" style={{height:'100%',borderRadius:15,overflow:'hidden'}}>
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
                <div className="noselect" style={{height:'100%',borderRadius:15,overflow:'hidden'}}>
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
    movX,rowCount,columnCount,updateFeed,isFeed,width,container}){

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
            defaultDimensions:[!isMobile?8:12,!isMobile?6:6],
            flatDimensions:[!isMobile?6:6,!isMobile?12:12],
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

        try{
            for(let i=orderWithSize.length - 3; i<orderWithSize.length - 1;i++){
                if(isFlat(orderWithSize[i].post) != isFlat(orderWithSize[i+1].post)){
                    let tmp = orderWithSize[i];
                    orderWithSize[i] = orderWithSize[i+1];
                    orderWithSize[i+1] = tmp;            
                }
            }
        }catch(e){

        }
        
        return orderWithSize //shuffle(orderWithSize);
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

    function shouldBeTall(){
        // if at least 2 of the responsive sized posts are flat
        // this should be standing
        return order.slice(Math.max(order.length) - 3).filter(o=>isFlat(o.post)).length >= 2 ||
               order.slice(Math.max(order.length) - 3).every(o=>!isFlat(o.post));
    }

    function getMenuDimensions(){
        let xy;
        if(isMobile){
            if(shouldBeTall()){
                xy = [3,6]
            }else{
                xy = [6,3]
            }
        }else{
            xy = [3,3]
        }
        return xy
    }

    let menuDimensions = getMenuDimensions();

    return(
        supportsGrid?
        <div className="noselect" css={theme=>gridContainer(theme,rowCount,columnCount,implicitRowCount,height)}>
            {order.map(o=>{
                return <div key={o.post.id} 
                css={()=>cell(isFlat(o.post)?o.size.flatDimensions:o.size.defaultDimensions,isMobile)}>
                    <PreviewPost {...getPostProps(o.post)} viewAs="post" size={o.size.label} shouldOpen={shouldOpen}/>
                </div>
            })}
            <div css={theme=>({gridColumn:`span ${menuDimensions[0]}`,gridRow:`span ${menuDimensions[1]}`,
            display:'flex',alignItems:'center',zIndex:1000,
            backgroundColor:theme.backgroundDarkColor,boxShadow:'0px 2px 6px -4px black',borderRadius:10})}>
                <Menu branch={activeBranch} updateFeed={updateFeed} isFeed={isFeed} postsContext={postsContext}
                    width={width} container={container}
                />
            </div>
        </div>
        :
        <div css={{display:'flex',flexFlow:'column'}}>
            {order.map(o=>{
                return <React.Fragment key={o.post.id}>
                    <Post {...getPostProps(o.post)} movement={movX}/>
                </React.Fragment>
            })}
        </div>
    )
}

const createTo = (y) => ({ y: y })

function Create({activeBranch,postsContext,isFeed,updateFeed,gridContainer}){
    const ref = useRef(null);
    const [show,setShow] = useState(true);
    const [height,setHeight] = useState(0);

    let container = document.getElementById('grid-container');
    let width = container.clientWidth;
    let left = container.getBoundingClientRect().left;

    const [props,set] = useSpring(()=>({
        from:{y:200}
    }))
    
    const bind = useDrag(({ down, movement: [mx, my], velocity,direction:[xDir,yDir] }) => {
        console.log(mx,my)
        const trigger = velocity > 0.2 && xDir < 0;
        const isGone = trigger && !down
        const y = my;
        /*if(isGone){
            setShown(false);
        }*/
        set({ y:y })
    },{domTarget:container, bounds: { top: 0} })

    React.useEffect(bind, [bind])

    function handleHide(e){
        /*try{
            if(!document.getElementById('tag-selector-modal')){
                setShow(false);
            }
        }catch(e){
            setShow(false);
        }*/
    }

    function handleShow(){
        setShow(true);
    }

    useEffect(()=>{
        if(show){
            //set(()=>createTo(0))
        }
    },[show])

    useEffect(()=>{
        if(ref.current){
            setHeight(ref.current.clientHeight);
        }
    },[ref])

    return(
        <>
        <div css={theme=>({display:'flex',fontSize:'1.4rem',padding:5,boxSizing:'border-box',
        backgroundColor:theme.backgroundDarkColor,zIndex:10000,borderRadius:100,alignItems:'center'})}
        onClick={handleShow}>
            <div css={theme=>({display:'flex',padding:5,margin:'0 5px',backgroundColor:theme.backgroundLightColor,
            borderRadius:'50%'})}>
                <PlusSvg css={theme=>({height:20,width:20,fill:theme.textColor})}/>
            </div>
            <span css={{margin:'0 10px',fontWeight:'bold'}}>Create a leaf</span>
        </div>
        {ReactDOM.createPortal(
            <animated.div ref={ref} style={{transform:props.y.interpolate(y=>`translateY(${y}px)`)}}
            css={{width:width,position:'fixed',zIndex:1002,bottom:0,left:left,
            }}>
                <StatusUpdate activeBranch={activeBranch} postsContext={postsContext} updateFeed={updateFeed} 
                isFeed={isFeed} redirect style={{borderTopRightRadius:25,borderTopLeftRadius:25}}/>
            </animated.div>
        ,document.getElementById('disable-slide-swipe'))}
        </>
    )
}

function GoToStartOrRefresh(){
    return <div>Go to start</div>
}

function Menu({activeBranch,postsContext,updateFeed,isFeed,width,container}){
    const [open, set] = useState(false)
    const [xy,setXY] = useState([0,0]);

    let data = [
        {
            component:<Create activeBranch={activeBranch} postsContext={postsContext} updateFeed={updateFeed}
                isFeed={isFeed} width={width} gridContainer={container}
            />,
            key:"create"
        },{
            component:<GoToStartOrRefresh/>,
            key:"GoToStartOrRefresh"
        }];
    const springRef = useRef()
    const { size, left,bottom,...rest } = useSpring({
      ref: springRef,
      config: config.stiff,
      from: { size:1, },
      to: { size:1.2, },
    })
  
    const transRef = useRef()
    const transitions = useTransition(open ? data : [], item => item.key, {
      ref: transRef,
      unique: true,
      trail: 400 / (data.length),
      from: { opacity: 0, transform: 'scale(0)' },
      enter: { opacity: 1, transform: 'scale(1)' },
      leave: { opacity: 0, transform: 'scale(0)' }
    })

    // This will orchestrate the two animations above, comment the last arg and it creates a sequence
    useChain(open ? [springRef, transRef] : [transRef, springRef], [0, open ? 0.1 : 0.6])

    function handleClick(e){
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top;  //y position within the element.
        if(!open){
            setXY([x,y]);
        }
        set(!open)
    }

    return(
        <div style={{height:'100%',width:'100%',position:'relative'}}>
            <animated.div style={{ ...rest, scale:size }}
            css={{width:'100%',height:'100%',display:'flex',justifyContent:'center',
            alignItems:'center',position:'relative'}} onClick={handleClick}>
                <MenuSvg css={theme=>({height:'27%',fill:theme.textColor})}/>
            </animated.div>
            <div css={{position:'absolute',top:-10,width:'100%'}}>
                {transitions.map((tr,index) => {
                    return <animated.div key={tr.key} style={tr.props} css={theme=>({
                    position:'absolute',borderRadius:'10px',boxSizing:'border-box',
                    width:'max-content',bottom:50*index,left:0,right:0,marginLeft:'auto',marginRight:'auto'})}>
                    {tr.item.component}</animated.div>
                })}
            </div>
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

const MenuSvg = props => (
    <svg
      x="0px"
      y="0px"
      width="276.167px"
      height="276.167px"
      viewBox="0 0 276.167 276.167"
      xmlSpace="preserve"
      fill="#fff"
      {...props}
    >
      <path d="M33.144 2.471C15.336 2.471.85 16.958.85 34.765s14.48 32.293 32.294 32.293 32.294-14.486 32.294-32.293S50.951 2.471 33.144 2.471zM137.663 2.471c-17.807 0-32.294 14.487-32.294 32.294s14.487 32.293 32.294 32.293c17.808 0 32.297-14.486 32.297-32.293S155.477 2.471 137.663 2.471zM243.873 67.059c17.804 0 32.294-14.486 32.294-32.293S261.689 2.471 243.873 2.471s-32.294 14.487-32.294 32.294 14.489 32.294 32.294 32.294zM32.3 170.539c17.807 0 32.297-14.483 32.297-32.293 0-17.811-14.49-32.297-32.297-32.297S0 120.436 0 138.246c0 17.81 14.493 32.293 32.3 32.293zM136.819 170.539c17.804 0 32.294-14.483 32.294-32.293 0-17.811-14.478-32.297-32.294-32.297-17.813 0-32.294 14.486-32.294 32.297 0 17.81 14.487 32.293 32.294 32.293zM243.038 170.539c17.811 0 32.294-14.483 32.294-32.293 0-17.811-14.483-32.297-32.294-32.297s-32.306 14.486-32.306 32.297c0 17.81 14.49 32.293 32.306 32.293zM33.039 209.108c-17.807 0-32.3 14.483-32.3 32.294 0 17.804 14.493 32.293 32.3 32.293s32.293-14.482 32.293-32.293-14.486-32.294-32.293-32.294zM137.564 209.108c-17.808 0-32.3 14.483-32.3 32.294 0 17.804 14.487 32.293 32.3 32.293 17.804 0 32.293-14.482 32.293-32.293s-14.489-32.294-32.293-32.294zM243.771 209.108c-17.804 0-32.294 14.483-32.294 32.294 0 17.804 14.49 32.293 32.294 32.293 17.811 0 32.294-14.482 32.294-32.293s-14.49-32.294-32.294-32.294z" />
    </svg>
  )