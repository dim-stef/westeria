import React, {useState,useEffect,useLayoutEffect,useCallback,useRef,useContext} from "react";
import { createPortal } from 'react-dom';
import { useSpring, useTransition, animated, interpolate } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import {css} from "@emotion/core";
import {useTheme} from "emotion-theming";
import LinesEllipsis from 'react-lines-ellipsis'
import {Images, PreviewPostMedia} from './PostImageGallery'
import {Post} from "./SingularPost"
import {SingularPostContext,UserContext} from "../container/ContextContainer"

const postCss = theme =>css({
    border:`1px solid ${theme.borderColor}`,
    display:'grid',
    height:'100%',
    position:'relative',
    borderRadius:15,
    overflow:'hidden'
})

const text = (theme,textPosition,size) =>css({
    position:'absolute',
    top:textPosition,
    fontSize:size=='xsmall' || size=='small' ? '1.1rem' : '2rem',
    margin:5,
    color:theme.textColor,
    wordBreak:'break-word'
})

const postedToImage = (size) =>css({
    position:'absolute',
    margin:'5px',
    zIndex:33,
    width:size=='xsmall' || size=='small'?20:40,
    height:size=='xsmall' || size=='small'?20:40,
})

const zoom = () =>css({
    transition:'transform ease 0.5s'
})

const openPreviewPost = theme =>css({
    zIndex:23123,
    position:'fixed',
    top:0,
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    overflow:'hidden',
    borderRadius:30,
    backgroundColor:theme.backgroundColor,
    boxShadow:`0px 2px 6px -1px ${theme.textHarshColor}`,
    width:'90%',
    '@media (min-width: 1224px)': {
        width:'40%'
    }
})

export function PreviewPost({post,viewAs,size}){
    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const ref = useRef(null);
    const imageRef = useRef(null);
    const zoomRef = useRef(null);
    const [imageWidth,setImageWidth] = useState(0);
    const [textPosition,setTextPosition] = useState(0);
    const [postShown,setPostShown] = useState(false);
    const isSwiping = useRef(null);
    const showInterval = useRef(null);
    const showInterval2 = useRef(null);
    const images = post.images;
    const videos = post.videos;


    useEffect(()=>{
        if(ref.current){
            setImageWidth(ref.current.clientWidth)
        }
    },[ref])

    useEffect(()=>{
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

    function handleShow(){
        zoomRef.current.style.transform = 'scale(1.5)'
        clearTimeout(showInterval2.current)

        showInterval.current = setTimeout(()=>{
            setPostShown(true);
        },500)
    }

    function handleHide(){
        zoomRef.current.style.transform = 'scale(1)'
        clearTimeout(showInterval.current)

        showInterval2.current = setTimeout(()=>{
            setPostShown(false);
        },500)
    }

    function handleTouchStart(e){
        zoomRef.current.style.transform = 'scale(1.5)'
        //clearTimeout(showInterval2.current)

        showInterval.current = setTimeout(()=>{
            setPostShown(true);
        },500)
    }

    function handleTouchEnd(){
        zoomRef.current.style.transform = 'scale(1)'
        clearTimeout(showInterval.current)
        //clearTimeout(showInterval2.current)
        setPostShown(true);
    }

    function handleTouchMove(){
        zoomRef.current.style.transform = 'scale(1)'
        clearTimeout(showInterval.current)
        //clearTimeout(showInterval2.current)
        //setPostShown(false);
    }

    //const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }))
    const gone = useRef(null);

    const to = () => ({ opacity:1, x: 0, y: 0, scale: 1, rot: -10 + Math.random() * 20 })
    const from = () => ({ opacity:0, x: 0, rot: 0, scale: 1, y: 0 })
    const trans = (r, s, y) => `translate(${r}px,${y}px) scale(${s})`
    const [props, set, stop] = useSpring(()=>({from:from(),to:to(),
        onRest:()=>{
            if(gone.current){
                setPostShown(false)
                gone.current = false;
                set(() => to());
            }
        },
        onFrame:(f)=>{
            if(Math.abs(f.y) > window.innerHeight && gone.current){
                setPostShown(false);
                stop();
            }
        }
    }))

    const initTo = to().y
    // 1. Define the gesture
    const bind = useDrag(({ down, movement: [mx,my], direction: [xDir,yDir], velocity }) => {
        const trigger = velocity > 0.2 && Math.abs(xDir) < 0.5 // If you flick hard enough it should trigger the card to fly out
        const dir = yDir < 0 ? -1 : 1 // Direction should either point left or right
        if (!down && trigger) gone.current = true// If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
        set(() => {
          const isGone = gone.current
          const y = isGone ? (200 + window.innerHeight) * dir : down ? my : 0 // When a card is gone it flys out left or right, otherwise goes back to zero
          const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0) // How much the card tilts, flicking it harder makes it rotate faster
          const scale = down ? 1 : 1 // Active cards lift up a bit
          return { rot, scale, y, delay: undefined, config: { friction: 25, tension: down ? 800 : isGone ? 200 : 500 } }
        })
    })

    return (
        <>
        <div css={theme=>postCss(theme)} ref={ref}
        onClick={e=>{setPostShown(true);}}
        >
            
            <img className="post-profile-picture round-picture double-border" 
            src={post.posted_to[0].branch_image} css={()=>postedToImage(size)} ref={imageRef}/>
            <div css={zoom} ref={zoomRef}>
                {images.length>0 || videos.length>0?<PreviewPostMedia images={images} measure={null} 
                videos={videos} imageWidth={imageWidth} viewAs={viewAs}/>:null}
                
                {post.text?<LinesEllipsis
                    text={post.text}
                    className="noselect" css={theme=>text(theme,textPosition,size)}
                    maxLine='3'
                    ellipsis='...'
                    trimRight
                    basedOn='letters'
                />:null}
            </div>
            
        </div>
        {createPortal(    
                postShown?<animated.div>
                    <animated.div css={theme=>openPreviewPost(theme)}
                    {...bind()} style={{ transform: interpolate([props.rot, props.scale, props.y], trans)}}>
                        <Post post={post} postsContext={postsContext} down={initTo}
                        activeBranch={userContext?userContext.currentBranch:post.poster} viewAs="post"/>
                    </animated.div>
                </animated.div>:null
            ,document.getElementById("leaf-preview-root"))
        }
        </>
    )
}

//leaf-preview-root