import React, {useState,useEffect,useLayoutEffect,useCallback,useRef,useContext} from "react";
import { createPortal } from 'react-dom';
import {Link} from "react-router-dom"
import history from "../../history"
import { useSpring, useTransition, animated, interpolate } from 'react-spring/web.cjs'
import { useDrag } from 'react-use-gesture'
import { createRipples } from 'react-ripples'
import {css} from "@emotion/core";
import {useMediaQuery} from 'react-responsive'
import {useTheme} from "../container/ThemeContainer"
import {Images, PreviewPostMedia} from './PostImageGallery'
import {Post} from "./SingularPost"
import {ReplyTree} from './Comments'
import {SmallCard} from './Card'
import {SingularPostContext,UserContext} from "../container/ContextContainer"
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';

const Ripple = createRipples({
    color: 'rgba(0, 0, 0, .3)',
    during: 600,
})

const postCss = (theme,backgroundColor) =>css({
    //border:`1px solid ${theme.borderColor}`,
    boxShadow:'0px 2px 6px -4px black',
    display:'flex',
    height:'100%',
    position:'relative',
    borderRadius:5,
    overflow:'hidden',
    cursor:'pointer',
    backgroundColor:backgroundColor
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
    zIndex:330,
    width:size=='xsmall' || size=='small'?20:40,
    height:size=='xsmall' || size=='small'?20:40,
    '&:hover':{
        cursor:'pointer'
    }
})

const zoom = () =>css({
    transition:'transform ease 0.5s',
    width:'100%'
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
        width:'40%',
        marginLeft:'37%',
    }
})

const bubbleBox = (theme,height=100) =>css({
    zIndex:23122,
    position:'fixed',
    top:20,
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    overflow:'auto',
    borderRadius:30,
    backgroundColor:theme.backgroundColor,
    boxShadow:`0px 2px 6px -1px ${theme.textHarshColor}`,
    width:'90%',
    height:height,
    '@media (min-width: 1224px)': {
        width:'40%',
        marginLeft:'37%',
    }
})


document.addEventListener('gesturestart', e => e.preventDefault())
document.addEventListener('gesturechange', e => e.preventDefault())

export function PreviewPost({post,viewAs,size,shouldOpen=null}){
    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const ref = useRef(null);
    const imageRef = useRef(null);
    const zoomRef = useRef(null);
    const previewPostRef = useRef(null);
    const preventScrollRef = useRef(null)
    const [imageWidth,setImageWidth] = useState(0);
    const [textPosition,setTextPosition] = useState(0);
    const [postShown,setPostShown] = useState(false);
    const [commentsShown,setCommentsShown] = useState(false);
    const isSwiping = useRef(null);
    const showInterval = useRef(null);
    const showInterval2 = useRef(null);
    const images = post.images;
    const videos = post.videos;

    const theme = useTheme();

    let backgroundColor = theme.dark?'#151827':null
  
    const isLaptopOrDesktop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })

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

    function handleClick(){
        if(shouldOpen===null){
            setPostShown(true)
        }else{
            if(shouldOpen.current){
                setPostShown(true)
            }
        }
    }

    useEffect(()=>{
        if(postShown){
            ref.current.style.filter = 'blur(5px)';
        }else{
            ref.current.style.filter = null;
        }
    },[postShown])

    //const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }))
    const shotUp = useRef(null);
    const shotDown = useRef(null);
    const commentsActive = useRef(null);
    const lastDockedPosition = useRef(null);

    const to = () => ({ opacity:1, x: 0, y: 20, scale: 1, rot: -10 + Math.random() * 20 })
    const from = () => ({ opacity:0, x: 0, rot: 0, scale: 1, y: -(window.innerHeight) })
    const off = () => ({ opacity:1, x: 0, y: -(window.innerHeight + 250), scale: 1, rot: -10 + Math.random() * 20 })

    const trans = (r, s, y) => `translate(0px,${y}px) scale(${s})`
    const [props, set, stop] = useSpring(()=>({from:from(),to:to(),
        onFrame:(f)=>{
            if(shotDown.current){
                shotDown.current = false;
                setCommentsShown(true);
            }
            if(shotUp.current){
                shotUp.current = false
            }
            if(Math.abs(f.y) > window.innerHeight + 200){
                lastDockedPosition.current = 20;
                shotDown.current = false;
                shotUp.current = false;
                commentsActive.current = false;
                setCommentsShown(false);
                setPostShown(false);
                stop();
            }
        }
    }))


    function preventDefault(e){
        e.preventDefault();
        return false;
    }

    useEffect(()=>{
        set(()=>to())

        if(preventScrollRef.current){
            preventScrollRef.current.addEventListener('touchmove',preventDefault, { passive: false })
        }
        
        return()=>{
            try{
                let scrollableContainer = document.getElementById('mobile-content-container');
                scrollableContainer.style.overflow = 'auto';
            }catch(e){

            }

            if(preventScrollRef.current){
                preventScrollRef.current.removeEventListener('touchmove',preventDefault)
            }
        }
    },[postShown])

    
    function detectOutSideClick(e){
        const containerBounds = previewPostRef.current.getBoundingClientRect();
        const inContainer = e.pageX > containerBounds.left && e.pageX < containerBounds.right &&
        e.pageY > containerBounds.bottom && e.pageX < containerBounds.bottom
        if(!document.getElementById('leaf-preview-root').contains(e.target) && !inContainer &&
        e.target != document.getElementById('body')){
            set(()=>off())
        }
    }

    useEffect(()=>{
        if(postShown){
            document.getElementById('page').addEventListener('click',detectOutSideClick);
        }
        
        return ()=>{
            document.getElementById('page').removeEventListener('click',detectOutSideClick);
        }
    },[postShown])

    const initTo = to().y
    // 1. Define the gesture
    const bind = useDrag(({ down,initial, movement: [mx,my], direction: [xDir,yDir], velocity}) => {
        const trigger = velocity > 0.2 && (Math.abs(my) > 60 || Math.abs(xDir) < 0.5) // If you flick hard enough it should trigger the card to fly out
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

        if (!down && trigger && dir==-1) shotUp.current = true// If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
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
                    y = 20;
                }else{
                    // shoot post to top outside of screen
                    y = (250 + window.innerHeight) * dir
                }
                commentsActive.current = false;
            }else{
                // shoot to bottom so the comments are shown
                y = (window.innerHeight - 200) * dir
            }

            lastDockedPosition.current = y;
          }

          if(shotDown.current){
            y = (window.innerHeight - 200) * dir;
            lastDockedPosition.current = y;
          }

          const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0) // How much the card tilts, flicking it harder makes it rotate faster
          const scale = down ? 1 : 1 // Active cards lift up a bit
          return { rot, scale, y, delay: undefined, config: { friction: 25, tension: down ? 800 : isGone ? 200 : 500 }}
        })
    })
    
    return (
        <>
        <div css={theme=>postCss(theme,backgroundColor)} ref={ref}>
            <img className="post-profile-picture round-picture double-border noselect" 
            src={post.posted_to[0].branch_image} css={()=>postedToImage(size)} ref={imageRef}
                onClick={(e)=>{
                    e.stopPropagation();
                    history.push(`/${post.posted_to[0].uri}`);
                }}
            />
            <div css={zoom} ref={zoomRef} onClick={handleClick}>
                {images.length>0 || videos.length>0?<PreviewPostMedia images={images} measure={null} 
                videos={videos} imageWidth={imageWidth} viewAs={viewAs}/>:null}
                
                {post.text?<p className="noselect" css={theme=>text(theme,textPosition,size)}>{post.text}</p>:null}
            </div>
        </div>
        

        {createPortal(
                postShown?<div>
                    {commentsShown?
                    <AnimatedCommentBox post={post} offset={200}/>:null}
                        <animated.div css={theme=>openPreviewPost(theme)} ref={previewPostRef}
                        id="preview-post"
                        {...bind()} style={{ transform: interpolate([props.rot, props.scale, props.y], trans)}}>
                            <div ref={preventScrollRef} style={{touchAction:'none'}} touchAction="none">
                                <Post post={post} postsContext={postsContext} down={initTo}
                                activeBranch={userContext?userContext.currentBranch:post.poster} viewAs="post"/>
                            </div>
                        </animated.div>
                    </div>:null
            ,document.getElementById("leaf-preview-root"))
        }
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

    return(
        <InfiniteScroll
        scrollableTarget='comment-box'
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
    )
}


function AnimatedCommentBox({post,offset}){

    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const commentRef = useRef(null);
    const hasPressed = useRef(null);
    const shotUp = useRef(null);
    const [height,setHeight] = useState(window.innerHeight - offset - 40);
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

    const bindComments = useDrag(({ down, movement: [mx,my], direction: [xDir,yDir], velocity }) => {
        if(down){
            hasPressed.current = true; // capture first pressed motion, this prevents glitchy behavior on mount
        }
        
        const trigger = velocity > 0.2 && Math.abs(xDir) < 0.5
        const dir = yDir < 0 ? -1 : 1
        if (!down && trigger && dir==-1) shotUp.current = true

        set(() => {
          const isGone = shotUp.current;
          const y = isGone ? (commentRef.current.getBoundingClientRect().height) * dir : 20
          const rot = mx / 100 + (dir * 10 * velocity)
          const scale = down ? 1 : 1
          return { rot, scale, y, delay: undefined, config: { friction: 25, tension: down ? 800 : 1 ? 200 : 500 } }
        })
    })

    return(
        <div
        ref={commentRef}
        id="comment-box"
        css={theme=>bubbleBox(theme,height)}
        style={{transform: interpolate([commentProps.rot, commentProps.scale, commentProps.y], trans)}}>
            <CommentBox post={post} postsContext={postsContext}
            activeBranch={userContext?userContext.currentBranch:post.poster}
            parentRef={commentRef}
            />
        </div>
    )
}