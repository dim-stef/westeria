import React, {useState,useEffect,useLayoutEffect,useRef,useContext} from "react";
import {css} from "@emotion/core";
import {useTheme} from "emotion-theming";
import {Images, PreviewPostMedia} from './PostImageGallery'
import {Post} from "./SingularPost"
import {SingularPostContext,UserContext} from "../container/ContextContainer"

const postCss = theme =>css({
    border:`1px solid ${theme.borderColor}`,
    display:'grid',
    height:'100%',
    position:'relative',
    borderRadius:20,
    overflow:'hidden'
})

const text = (theme,textPosition) =>css({
    position:'absolute',
    top:textPosition,
    fontSize:'2rem',
    margin:10,
    color:theme.textColor
})

const postedToImage = () =>css({
    position:'absolute',
    margin:'5px',
    zIndex:33
})

const zoom = () =>css({
    transition:'transform ease 0.5s'
})

const openPreviewPost = theme =>css({
    zIndex:23123,
    position:'absolute',
    left:0,
    right:0,
    marginLeft:'auto',
    marginRight:'auto',
    overflow:'hidden',
    borderRadius:30,
    backgroundColor:theme.backgroundColor,
    boxShadow:`0px 2px 6px -1px ${theme.textHarshColor}`,
    width:'90%'
})

export function PreviewPost({post,viewAs}){
    const postsContext = useContext(SingularPostContext);
    const userContext = useContext(UserContext);
    const ref = useRef(null);
    const imageRef = useRef(null);
    const zoomRef = useRef(null);
    const [imageWidth,setImageWidth] = useState(0);
    const [textPosition,setTextPosition] = useState(0);
    const [postShown,setPostShown] = useState(false);
    const showInterval = useRef(null);
    const showInterval2 = useRef(null);
    const images = post.images;
    const videos = post.videos;


    useEffect(()=>{
        if(ref.current){
            setImageWidth(ref.current.clientWidth)
        }
    },[ref])

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
            setPostShown(true);
        },500)
    }

    function handleTouchEnd(){
        zoomRef.current.style.transform = 'scale(1)'
        clearTimeout(showInterval.current)
        setPostShown(false);
    }

    return (
        <>
        <div css={theme=>postCss(theme)} ref={ref}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onTouchStart={handleShow}
        onTouchEnd={handleTouchEnd}
        >
            
            <img className="post-profile-picture round-picture double-border" 
            src={post.posted_to[0].branch_image} css={postedToImage} ref={imageRef}/>
            <div css={zoom} ref={zoomRef}>
                {images.length>0 || videos.length>0?<PreviewPostMedia images={images} measure={null} 
                videos={videos} imageWidth={imageWidth} viewAs={viewAs}/>:null}
                {post.text?<p css={theme=>text(theme,textPosition)}>{post.text}</p>:null}
            </div>
            
        </div>
        
        {postShown?
        <div css={theme=>openPreviewPost(theme)}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}>
            <Post post={post} postsContext={postsContext} 
            activeBranch={userContext?userContext.currentBranch:post.poster} viewAs="post"/>
        </div>:null}
        </>
    )
}