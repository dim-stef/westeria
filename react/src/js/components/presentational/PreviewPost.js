import React, {useState,useEffect,useLayoutEffect,useCallback,useRef,useContext} from "react";
import { createPortal } from 'react-dom';
import history from "../../history"
import { useSpring,useSprings,useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useGesture } from 'react-use-gesture'
import {to as aniTo} from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import { createRipples } from 'react-ripples'
import {css,keyframes } from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import {useTheme} from "../container/ThemeContainer"
import {Images, PreviewPostMedia} from './PostImageGallery'
import {Post,SingularPost} from "./SingularPost"
import {ReplyTree} from './Comments'
import {SingularPostContext,UserContext} from "../container/ContextContainer"
import InfiniteScroll from 'react-infinite-scroll-component';
import {ArrowSvg,TextSvg} from "./Svgs"
import axios from 'axios';

const Ripple = createRipples({
    color: 'rgba(0, 0, 0, .3)',
    during: 600,
})

const postCss = (theme,size,isFlat) =>css({
    //border:`1px solid ${theme.borderColor}`,
    display:'flex',
    flexFlow:size=='small' && isFlat?'row':'column',
    height:'100%',
    position:'relative',
    overflow:'hidden',
    cursor:'pointer',
    backgroundColor:theme.backgroundLightColor
})

const text = (theme,textPosition,size,hasMedia) =>css({
    top:textPosition,
    fontSize:size=='xsmall' || size=='small' ? '1.1rem' : '2rem',
    color:theme.textColor,
    wordBreak:'break-word',
    height:'100%',
    overflow:'hidden',
    padding:'0 5px'
})

const postedToImage = (size,isLaptopOrDesktop) =>css({
    border:0,
    padding:0,
    margin:'0 5px',
    zIndex:330,
    width:isLaptopOrDesktop?30:20,
    minWidth:isLaptopOrDesktop?30:20,
    height:isLaptopOrDesktop?30:20,
    '&:hover':{
        cursor:'pointer'
    }
})

const zoom = () =>css({
    transition:'transform ease 0.5s',
    width:'100%',
    height:'100%'
})

const textOverflowButton = () =>css({
    position:'absolute',
    bottom:10,
    height:25,
    width:'60%',
    backgroundColor:'#484e50d6',
    marginLeft:'auto',
    marginRight:'auto',
    left:0,
    right:0,
    zIndex:200000,
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    fontSize:'1.5rem',
    padding:5,
    borderRadius:50,
    color:'white',
    textAlign:'center'
})

const openPreviewPost = theme =>css({
    zIndex:23123,
    position:'fixed',
    top:0,
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    borderRadius:30,
    backgroundColor:theme.backgroundColor,
    boxShadow:`0px 2px 6px -1px ${theme.textHarshColor}`,
    width:'95%',
    willChange:'transform, opacity, scale',
    animation: `${scaleUp} 0.33s cubic-bezier(0.390, 0.575, 0.565, 1.000)`,
    maxHeight:window.innerHeight - 100,
    overflow:'auto',
    '&::-webkit-scrollbar':{
        width:10
    },
    '&::-webkit-scrollbar-thumb':{
        backgroundColor:theme.scrollBarColor,
        borderRadius:30,
    },
    '@media (min-width: 1224px)': {
        width:'40%',
        marginLeft:'37%',
    }
})

const bubbleBox = (theme,height=100) =>css({
    marginTop:10,
    zIndex:23122,
    position:'fixed',
    top:0,
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    overflow:'auto',
    borderRadius:30,
    backgroundColor:theme.backgroundColor,
    boxShadow:`0px 2px 6px -1px ${theme.textHarshColor}`,
    width:'95%',
    height:height,
    '@media (min-width: 1224px)': {
        width:'40%',
        marginLeft:'37%',
    }
})

const name = (isLaptopOrDesktop,size,isFlat) =>css({
    fontWeight:'bold',
    /*width:isLaptopOrDesktop?isFlat && size!='xsmall'?50:100:isFlat && size!='xsmall'?40:70,*/
    width:'100%',
    display:'-webkit-box',
    WebkitLineClamp:3,
    WebkitBoxOrient:'vertical',
    overflow:'hidden',
    textOverflow:'ellipsis',
    wordBreak:'break-word',
    padding:2,
    boxSizing:'border-box',
})

const commentHeader = theme =>css({
    display:'flex',
    alignItems:'center',
    boxShadow:'0px 6px 4px -6px #0000006e',
    zIndex:10,
    backgroundColor:theme.backgroundLightColor,
    '@media (min-device-width:1223px)':{
        display:'sticky',
        top:0
    }
})

const scaleUp = keyframes`
  0%{
    transform: scale(0.7) translate(0px, 20px);
    opacity:0;
  }

  80%{
    transform: scale(1.01) translate(0px, 20px);
    opacity:1;
  }

  100%{
    transform: scale(1) translate(0px, 20px);
    opacity:1;
  }
`

const to = (y) => ({ opacity:1, x: 0, y: y||20, scale: 1 })
const from = (initAnimation) => ({ opacity:0, x: 0, y: 20, scale: initAnimation?initAnimation.current?0:1:0 })
const off = (offset=200) => ({
        opacity:1, x: 0, y: -(window.innerHeight + offset + 50), scale: 1
    })
const trans = (r, s, y) => `translate(0px,${y}px) scale(${s})`

const postTo = (y=0) => ({ y:y })

export const PreviewPost = React.memo(function PreviewPost({post,viewAs,isFlat,size,shouldOpen=null,position}){
    const ref = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [imageWidth,setImageWidth] = useState(0);
    const [height,setHeight] = useState(0);
    const [textPosition,setTextPosition] = useState(0);
    const [postShown,setPostShown] = useState(false);
    const [commentsShown,setCommentsShown] = useState(false);
    const [useTimer,setTimer] = useState(true);
    const images = post.images;
    const videos = post.videos;
    const postSlideIndex = useRef(0);
    let postSlideInterval = null;
    const theme = useTheme();
    let hasMedia = post.videos.length>0 || post.images.length > 0

    const isLaptopOrDesktop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })

    const isTall = useMediaQuery({
        query: '(min-device-height: 600px)'
    })

    const nameOffset = isLaptopOrDesktop?40:30;

    useLayoutEffect(()=>{
        if(ref.current){
            setImageWidth(ref.current.clientWidth);
        }
    },[ref])

    useLayoutEffect(()=>{
        if(containerRef.current){
            setHeight(containerRef.current.clientHeight);
        }
    },[containerRef,post.id])

    useEffect(() => {
        if(hasMedia && post.text && useTimer){
            postSlideInterval = setInterval(() => {            
                postSlideIndex.current = postSlideIndex.current == 0?1:0;
                set((i)=>postTo((postSlideIndex.current * height)*-1 + (i==1?nameOffset:0)))
            }, 3000);
            return () => clearInterval(postSlideInterval);
        }
    }, [height,useTimer]);

    useLayoutEffect(()=>{
        if(postShown){
            try{
                document.getElementById('posts-container').style.filter = 'grayscale(1)';
            }catch(e){

            }
        }else{

            try{
                document.getElementById('posts-container').style.filter = null;
            }catch(e){

            }
        }
    },[postShown])

    useLayoutEffect(()=>{
        if(imageRef.current){
            setTextPosition(imageRef.current.offsetTop + imageRef.current.offsetHeight)
        }
    },[imageRef])

    const [props, set] = useSprings(2, i => ({ y: hasMedia?0:nameOffset }))
    
    useLayoutEffect(()=>{
        set((i)=>{
            return { y: hasMedia?0:nameOffset }
        })
    },[post])

    const bind = useDrag(({ down, movement:[mx,my],direction:[xDir,yDir],velocity,cancel }) => {
        setTimer(false);
        if(hasMedia && post.text){
            
        }else{
            cancel();
            return;
        }
        const trigger = velocity > 0.4 && Math.abs(my) > 10 || Math.abs(my) > 50;
        const isGone = trigger;
        if(isGone){
            cancel();
        }
        postSlideIndex.current = isGone? yDir < 0 ? postSlideIndex.current+1 :postSlideIndex.current - 1 : postSlideIndex.current
        if(postSlideIndex.current > 1) postSlideIndex.current = 1;
        if(postSlideIndex.current < 0) postSlideIndex.current = 0;

        set(i=>{
            let y;
            if(isGone){
                y = (postSlideIndex.current * height)*-1 + (i==1?nameOffset:0);
            }else{
                let fixMy;
                if(postSlideIndex.current==0){
                    fixMy = my;
                }else{
                    fixMy = my - height + nameOffset
                }

                y = (down ? fixMy : hasMedia?0:nameOffset)
                if(y > 0){
                    y = 0;
                }else if(y < height*(-1)){
                    y = height*(-1)
                }
            }
            return {y:y}
        })
    },{axis:'y'})

    function handleClick(){
        if(shouldOpen===null){
            setPostShown(true)
        }else{
            if(shouldOpen.current){
                setPostShown(true)
            }
        }
    }

    useLayoutEffect(()=>{
        if(postShown){
            ref.current.style.filter = 'blur(5px)';
        }else{
            ref.current.style.filter = null;
        }
    },[postShown])
    

    const [textCount,setTextCount] = useState(0);
    const [textOverflowing,setTextOverflowing] = useState(false);

    useEffect(()=>{
        if(textRef.current){
            setTextCount(textRef.current.innerText.split(' ').length);

            if(textRef.current.offsetHeight > containerRef.current.clientHeight){
                setTextOverflowing(true);
            }
        }
    },[textRef])

    function handleSwitchClick(e){
        e.stopPropagation();
        setTimer(false);

        postSlideIndex.current = postSlideIndex.current == 0?1:0;
        set((i)=>postTo((postSlideIndex.current * height)*-1 + (i==1?nameOffset:0)))
    }

    return (
        <>
        <div css={theme=>postCss(theme,size,isFlat)} ref={ref}>
            <div css={theme=>({display:'flex',/*flexFlow:size=='small' && isFlat?'column':'row',alignItems:'center'*/
            zIndex:10,position:'absolute',height:nameOffset})}>
                <div css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <img className="post-profile-picture round-picture double-border noselect" 
                    src={post.posted_to[0].branch_image} css={()=>postedToImage(size,isLaptopOrDesktop)} ref={imageRef}
                        onClick={(e)=>{
                            e.stopPropagation();
                            history.push(`/${post.posted_to[0].uri}`);
                        }}
                    />
                    <span css={theme=>name(isLaptopOrDesktop,size,isFlat)}>{post.posted_to[0].name}</span>
                </div>
            </div>
            {post.text && hasMedia?
            <div css={{position:'absolute',bottom:0,right:0,zIndex:20}} onClick={handleSwitchClick}>
                <div css={{margin:10}}>
                    <TextSvg css={{fill:'white',backgroundColor:'#00000038',padding:10,borderRadius:'50%',
                    height:12,width:12,overflow:'visible'}}/>
                </div>
            </div>:null}
            <div css={zoom} ref={containerRef} onClick={handleClick} {...bind()}>
             {props.map(({y},i)=>{
                return <animated.div key={i} {...bind(i)}
                style={{height:'100%',width:'100%',willChange:hasMedia && post.text?'transform':null,
                transform:y.interpolate(y=>`translateY(${y}px)`)}}>
                    {i==0 && hasMedia?<PreviewPostMedia images={images} measure={null} 
                    videos={videos} imageWidth={imageWidth} viewAs={viewAs} position={position}/>
                    :null}
                    {/*textOverflowing?<div css={textOverflowButton}>{textCount} words</div>:null*/}

                    {post.text && ((i==1 && hasMedia) || (i==0 && !hasMedia))?
                    <>
                    {size=='xsmall' || size=='small'?
                    <div className="noselect" css={theme=>text(theme,0,size,hasMedia)}>
                        <div ref={textRef}>{post.text}</div>
                    </div>:
                    <div className="noselect" css={theme=>text(theme,textPosition,size,hasMedia)}>
                        <div ref={textRef}>{post.text}</div>
                    </div>}
                    
                    </>:null}
                </animated.div>
             })}
            </div>
        </div>

        {createPortal(
                postShown?
                <PopUpPost postShown={postShown} setPostShown={setPostShown} post={post}
                />:null
            ,document.getElementById("leaf-preview-root"))
        }
        </>
    )
},areEqual)

function areEqual(prevProps, nextProps) {
    if(prevProps.post.id == nextProps.post.id){
        return true
    }

    return false
}

const fullScreenFrom = ()=> ({y:window.innerHeight + 10,x:0});
const fullScreenTo = ()=> ({y:0,x:0});
const fullScreenOffRight = ()=> ({y:0,x:window.innerWidth + 10});

const arrowButton = theme =>css({
    border:0,
    backgroundColor:'transparent',
    padding:10,
    marginTop:5
})

export function PopUp({shown,setShown,onEnter=()=>{},header,children}){

    const containerRef = useRef(null);
    const shouldClose = useRef(false);

    const bind = useDrag(
        ({ down, movement: [mx, my],velocity }) =>{
                const trigger = ((velocity > 0.2 && mx > 50) || (mx >200)) && !down;
                if(trigger){
                    shouldClose.current = true;
                    set(()=>fullScreenOffRight())
                }else{
                    set({ x: down?mx:0 })
                }
                
            },
        { bounds: { left: 0 },axis:'x' }
    )

    const [props,set,stop] = useSpring(()=>({
        from:fullScreenFrom(),
        to:fullScreenTo(),
        onFrame:(f)=>{
            if((f.y >= window.innerHeight || f.x >=window.innerWidth ) && shouldClose.current){
                stop();
                setShown(false)
            }

            if(f.y <= 10 && !shouldClose.current){
                onEnter();
            }
        }
    }));

    useEffect(()=>{
        if(shown){
            set(()=>fullScreenTo())
        }else{
            set(()=>fullScreenFrom())
        }
    },[shown])


    function handleReturnClick(){
        shouldClose.current = true;
        set(()=>fullScreenFrom());
    }
    
    return(
        <animated.div {...bind()} onMouseMove={()=>{}} onMouseDown={()=>{}}
        style={{willChange:'transform',transform: aniTo([props.y,props.x],(y,x) => {return `translateY(${y}px) translateX(${x}px)`})}}
        css={theme=>({position:'fixed',top:0,left:0,zIndex:1002,backgroundColor:theme.backgroundLightColor,
        width:'100%',height:'100%',overflow:'hidden'})} ref={containerRef}>
            <div css={{height:'100%',width:'100%',overflow:'auto'}}>
                <div css={{maxWidth:800,margin:'0 auto'}}>
                    <div css={commentHeader} onClick={handleReturnClick}>
                        <button css={arrowButton}><ArrowSvg 
                        css={theme=>({height:16,width:16,fill:theme.textHarshColor})}/></button>
                        <h1>{header}</h1>
                    </div>
                    {children}
                </div>
            </div>
        </animated.div>
    )
}

export function PopUpPost({postShown,setPostShown,post}){
    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    // only start loading comments once spring is done
    // to prevent any fps lag
    const [loadComments,setLoadComments] = useState(false);

    return (
        <PopUp header="Comments" shown={postShown} setShown={setPostShown} onEnter={()=>setLoadComments(true)}>
            <SingularPost wholePost={post} postsContext={postsContext} noStyle noRoutedHeadline
                activeBranch={userContext?userContext.currentBranch:post.poster} viewAs="post" preview
                loadComments={loadComments}
            />
        </PopUp>
    )
}

function PopUpPost2({postShown,setPostShown,post,commentsShown,setCommentsShown,
    isLaptopOrDesktop,isTall}){
    
    let offset = isTall?150:80;

    const positions = {
        off:{
            y:(offset + 50 + window.innerHeight)*-1
        },
        top:{
            y:20
        },
        bottom:{
            y:window.innerHeight - offset
        }
    }
    
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    const dockedTo = useRef(positions.top);

    const shotUp = useRef(null);
    const shotDown = useRef(null);
    const commentsActive = useRef(null);
    const lastDockedPosition = useRef(null);
    const prevTime = useRef(new Date().getTime());
    const isResting = useRef(true);
    const previewPostRef = useRef(null);
    const preventScrollRef = useRef(null)
    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const initAnimation = useRef(false);
    const [menuOpen,setMenuOpen] = useState(true);

    const openTransitions = useTransition(menuOpen, null, {
        from: {transform: 'translateY(100%)'},
        enter: { transform: 'translateY(0)'},
        leave: {transform: 'translateY(100%)'},
        config:{
            duration:250,
            easing:t => t*(2-t)
        }
    });

    const [props, set, stop] = useSpring(()=>({from:from(initAnimation),to:to(),

        onRest:(f)=>{
            isResting.current = true;
        },
        onStart:()=>{
            if(initAnimation.current){
                initAnimation.current = true;
            }
        },
        onFrame:(f)=>{

            isResting.current = false;
            if(shotDown.current){
                shotDown.current = false;
                setCommentsShown(true);
            }
            if(shotUp.current){
                shotUp.current = false
            }
            if(Math.abs(f.y) > window.innerHeight + offset){
                lastDockedPosition.current = 20;
                shotDown.current = false;
                shotUp.current = false;
                commentsActive.current = false;
                setPostShown(false);
                setCommentsShown(false);
                stop()
            }
        }
    }))

    function preventDefault(e){
        e.preventDefault();
        return false;
    }

    function wheelEvent(e){
        var curTime = new Date().getTime();
        if(typeof prevTime.current !== 'undefined'){
            var timeDiff = curTime-prevTime.current;
            if(timeDiff>200 || isResting.current){
                e.stopPropagation();

                let scrolledToTop = previewPostRef.current.scrollTop == 0
                let scrolledToBottom = previewPostRef.current.scrollTop ==
                (previewPostRef.current.scrollHeight - previewPostRef.current.offsetHeight)
                || previewPostRef.current.scrollTop ==
                (previewPostRef.current.scrollHeight - previewPostRef.current.offsetHeight) + 1;

                let isOnInitTopPosition = previewPostRef.current.getBoundingClientRect().y <= positions.top.y + 120
                && previewPostRef.current.getBoundingClientRect().y >= positions.top.y

                if(!scrolledToTop || !scrolledToBottom){
                    if((e.wheelDelta > 0 && scrolledToTop) || (e.wheelDelta < 0 && scrolledToBottom)){
                        e.preventDefault();
                    }else{
                        if(isOnInitTopPosition){
                            set(()=>to())
                            return;
                        }
                    }
                }

                if(e.wheelDelta > 0){
                    // update flags
                    shotUp.current = true;
                    if(dockedTo.current == positions.bottom){
                        // set docking position
                        dockedTo.current = positions.top;
                        set(()=>to(positions.top.y))
                    
                    // regular mouse sends it off
                    // trackpads shouldnt send the post off because the wheel event continues on the swipeable grid
                    // if wheelDeltaY is 120 then its probably a regular mouse
                    }else if(Math.abs(e.wheelDeltaY==120)){
                        // set docking position
                        dockedTo.current = positions.off;
                        // update flags
                        commentsActive.current = false;
                        set(()=>to(positions.off.y))
                    }
                }else if(e.wheelDelta <0){
                    // set docking position
                    dockedTo.current = positions.bottom;

                    // update flags
                    shotDown.current = true;
                    commentsActive.current = true;
                    set(()=>to(positions.bottom.y))
                }
            }
        }
        prevTime.current = curTime;
        
    }

    useEffect(()=>{
        if(postShown){
            document.getElementById('preview-post-container').addEventListener('wheel',wheelEvent);
            previewPostRef.current.addEventListener('wheel',wheelEvent);
        }
        
        return ()=>{
            try{
                document.getElementById('preview-post-container').removeEventListener('wheel',wheelEvent);
                previewPostRef.current.removeEventListener('wheel',wheelEvent);
            }catch(e){

            }
        }
    },[postShown])

    const modalRoot = document.getElementById('modal-root');
    const initTo = to().y
    // 1. Define the gesture
    const bind = useDrag(({ down, movement: [mx,my], direction: [xDir,yDir], velocity, event, tap,cancel}) => {
        let scrolledToTop = previewPostRef.current.scrollTop < 10

        let scrolledToBottom = previewPostRef.current.scrollTop >
        (previewPostRef.current.scrollHeight - previewPostRef.current.offsetHeight) - 10;

        let isOnInitTopPosition = previewPostRef.current.getBoundingClientRect().y <= positions.top.y + 120
        && previewPostRef.current.getBoundingClientRect().y >= positions.top.y

        if(previewPostRef.current.contains(event.target) && (!scrolledToTop || !scrolledToBottom)){
            if((yDir > 0 && scrolledToTop) || (yDir < 0 && scrolledToBottom)){

            }else{
                if(isOnInitTopPosition){
                    cancel();
                    set(()=>to())
                    return;
                }
            }
        }

        if(modalRoot.childElementCount > 0){
            cancel();
            return;
        }

        try{
            if(tap && !previewPostRef.current.contains(event.target) 
            && !modalRoot.contains(event.target)){
                dockedTo.current = positions.top
                setMenuOpen(false);
                set(()=>off(offset))
                return
            }
        }catch(e){

        }

        // If you flick hard enough it should trigger the card to fly out
        const trigger = velocity > 0.2 && (Math.abs(my) > 60 || Math.abs(xDir) < 0.5) 
        const dir = yDir < 0 ? -1 : 1 // Direction should either point left or right
        try{
            if (down && my!=0){
                if(isLaptopOrDesktop){
                    document.body.classList.add('noselect')
                }
                
                previewPostRef.current.style.pointerEvents = 'none';
            }else{
                if(isLaptopOrDesktop){
                    document.body.classList.remove('noselect')
                }
                previewPostRef.current.style.pointerEvents = null;
            }
        }catch(e){

        }

        // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
        if (!down && trigger && dir==-1) shotUp.current = true
        if (!down && trigger && dir==1) {
            shotDown.current = true;
            commentsActive.current = true;
        }

        try{
            let commentBox = document.getElementById("comment-box");
            if(down){
                commentBox.style.overflow = 'hidden';
            }else{
                commentBox.style.overflow = 'auto';
            }
        }catch(e){

        }
        
        set(() => {
          const isGone = shotUp.current || shotDown.current
          let y = down ? my + (lastDockedPosition.current || 20) : lastDockedPosition.current || 20;

          if(shotUp.current){
            if(dir==-1){
                if(commentsActive.current && trigger){
                    // reset post to original position
                    dockedTo.current = positions.top;
                    y = 20;
                }else{
                    // shoot post to top outside of screen
                    setMenuOpen(false);
                    dockedTo.current = positions.off;
                    y = (offset + 50 + window.innerHeight) * dir
                }
                commentsActive.current = false;
            }else{
                // shoot to bottom so the comments are shown
                dockedTo.current = positions.bottom;
                y = (window.innerHeight - offset) * dir
            }

            lastDockedPosition.current = y;
          }

          if(shotDown.current){
            dockedTo.current = positions.bottom;
            y = (window.innerHeight - offset) * dir;
            lastDockedPosition.current = y;
          }

          const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0) // How much the card tilts, flicking it harder makes it rotate faster
          const scale = down ? 1 : 1 // Active cards lift up a bit
                    
          return { scale, y, delay: undefined, config: { friction: 25, tension: down ? 800 : isGone ? offset : 500 }}
        })
    },{filterTaps:true})

    function handleMenuClick(e){
        e.stopPropagation();
        setMenuOpen(false);
        set(()=>off(offset))
    }
    return(
        <>
        <div id="preview-post-container" {...bind()} css={{width:'100%',height:'100vh',position:'fixed',top:0,
        zIndex:1000}}>
                
        </div>
        <div css={{zIndex:1001}}>
        {commentsShown?<AnimatedCommentBox post={post} offset={offset}/>:null}
        <animated.div {...bind()} css={theme=>openPreviewPost(theme)} ref={previewPostRef}
        id="preview-post"
        style={{ transform: aniTo([props.y,props.scale],(y,s) => {return `translateY(${y}px) scale(${s})`})}}>
            <div ref={preventScrollRef}>
                <Post post={post} postsContext={postsContext} down={initTo}
                activeBranch={userContext?userContext.currentBranch:post.poster} viewAs="post" preview/>
            </div>
        </animated.div>
        {isMobile?
            openTransitions.map(({item, props, key}) => (
                item && <animated.div key={key} style={props} css={theme=>({position:'fixed',bottom:0,width:'100%',
                height:60,backgroundColor:theme.backgroundLightColor,boxShadow:'0 2px 5px 0px #000000b0',
                zIndex:20000,display:'flex',justifyContent:'center',alignItems:'center',willChange:'transform'})} 
                onClick={handleMenuClick}>
                    <ArrowSvg css={theme=>({fill:theme.textColor,height:'50%',transform:'rotate(90deg)'})}/>
                </animated.div>
            ))
            :null}
        </div>
        </>
    )
}

function useReplies(post){
    const [replyTrees,setReplyTrees] = useState([]);
    const [hasMore,setHasMore] = useState(true);
    const [next,setNext] = useState(null);

    async function fetchData(data){
        if(!hasMore){
            return;
        }

        let uri = next?next:`/api/post/${data.id}/replies/`;
        let response = await axios.get(uri);

        setNext(response.data.next)
        if(!response.data.next){
            setHasMore(false);
        }
  
        setReplyTrees([...replyTrees,...response.data.results]);
    }

    useEffect(()=>{
        fetchData(post)
    },[])

    return [hasMore,replyTrees,fetchData]
}

function CommentBox({post,postsContext,activeBranch,parentRef}){
    const [hasMore,replyTrees,fetchData] = useReplies(post);
    const [userReplies,setUserReplies] = useState([]);

    useEffect(()=>{
        try{
            let scrollableTarget = document.getElementById('comment-scroller');

            // in order for infinite scrolling to occur there has to be scrolling
            // if initial data are not enough to trigger overflow-y get more data
            if(replyTrees.length > 0 && scrollableTarget.scrollHeight == scrollableTarget.clientHeight && hasMore){
                fetchData();
            }
        }catch(e){

        }
    },[hasMore,replyTrees])

    return(
        <>
        {userReplies.map(rt=>{
            return <ReplyTree topPost={post} parentPost={post} currentPost={rt} 
            postsContext={postsContext} activeBranch={activeBranch}
            isStatusUpdateActive={false} isSingular
            />
        })}
        <InfiniteScroll
        scrollableTarget='comment-scroller'
        dataLength={replyTrees.length}
        next={()=>fetchData(post)}
        hasMore={hasMore}
        endMessage={
            <p style={{textAlign: 'center'}}>
                <b style={{fontSize:'2rem'}}>Nothing more to see</b>
            </p>
        }
        loader={
            <p style={{textAlign: 'center'}}>
            <b>Loading comments..</b>
            </p>
        }
        >
            {replyTrees.map(rt=>{
                return <ReplyTree topPost={post} parentPost={post} currentPost={rt} 
                postsContext={postsContext} activeBranch={activeBranch}
                isStatusUpdateActive={false} isSingular
                />
            })}
        </InfiniteScroll>
        </>
    )
}


function AnimatedCommentBox({post,offset}){

    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const commentRef = useRef(null);
    const hasPressed = useRef(null);
    const shotUp = useRef(null);
    const [height,setHeight] = useState(window.innerHeight - offset - 20);
    const to = () => ({ opacity:1, x: 0, y: 20, scale: 1, rot: -10 + Math.random() * 20 })
    const from = () => ({ opacity:1, x: 0, rot: 0, scale: 1, y: 20 })
    const trans = (r, s, y) => `translate(0px,${y}px) scale(${s})`

    const [commentProps,set,commentStop] = useSpring(()=>({from:from(),to:to(),
        onFrame:(f)=>{
            if(hasPressed.current){
                let previewPost = document.getElementById('preview-post')
                previewPost.style.transform = `translate(0px,${commentRef.current.getBoundingClientRect().bottom + 20}px)`
            }
        }
    }))

    return(
        <div
        ref={commentRef}
        id="comment-box"
        css={theme=>bubbleBox(theme,height)}
        style={{transform: interpolate([commentProps.rot, commentProps.scale, commentProps.y], trans)}}>
            <div id="comment-scroller" css={{height:height,overflow:'auto'}}>
                <CommentBox post={post} postsContext={postsContext}
                activeBranch={userContext?userContext.currentBranch:post.poster}
                parentRef={commentRef}
                />
            </div>
        </div>
    )
}