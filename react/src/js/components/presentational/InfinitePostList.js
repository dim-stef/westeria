import React, {useState,useRef,useEffect,useLayoutEffect,useContext,useCallback} from "react";
import ReactDOM from "react-dom"
import {css} from "@emotion/core";
import { VariableSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import {PopUpPost} from "./PreviewPost"
import {Post} from "./SingularPost"
import { useWindowSize } from "./useWindowResize";
import { CommentsSvg } from "./Svgs";

export const InfinitePostList = React.memo(function InfinitePostList({postsContext,activeBranch,posts,fetchData,hasMore
    ,width,height,loading}){

    const margin = 30; // needed for height difference between posts

    const shouldOpen = useRef(true);

    const setOpenRef = useRef(null)
    const setShowCreateRef = useRef(null)

    const listRef = useRef(null);
    const infiniteLoaderRef = useRef(null);

    const sizeMap = useRef({});
    const setSize = useCallback((index, size) => {
        sizeMap.current = { ...sizeMap.current, [index]: size };
    }, []);
    const getSize = useCallback(index => sizeMap.current[index] + margin || 20, []);
    const [windowWidth] = useWindowSize();

    function onScroll({
        scrollOffset,
      }) {
        if(scrollOffset!=0){
            postsContext.lastScrollPosition = scrollOffset;
        }
    }

    useEffect(()=>{
        if(infiniteLoaderRef.current){
            infiniteLoaderRef.current._listRef.scrollTo(postsContext.lastScrollPosition);
        }

    },[infiniteLoaderRef,postsContext.content])

    let pageProps = {
        activeBranch:activeBranch,
        postsContext:postsContext,
        height:height,
        shouldOpen:shouldOpen,
        setOpenRef:setOpenRef,
        setShowCreateRef:setShowCreateRef
    }

    const loadMore = loading ? () => {} : fetchData;

    return(
        <InfiniteLoader
        ref={infiniteLoaderRef}
        isItemLoaded={index => index < posts.length}
        itemCount={posts.length + 1}
        loadMoreItems={loadMore}
        threshold={10}
        >
            {({ onItemsRendered, ref }) => (
            <List
            ref={ref}
            height={height}
            itemCount={posts.length}
            itemSize={getSize}
            onItemsRendered={onItemsRendered}
            width={width}
            onScroll={onScroll}
            >{({ style,index }) => (
                    <div style={style} css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                        <ListItem style={style} index={index} setSize={setSize} windowWidth={windowWidth}
                            {...pageProps} post={posts[index]} listRef={infiniteLoaderRef}
                        />
                    </div>
                )}
            </List>
            )}
        </InfiniteLoader>
    )
},(prevProps,nextProps)=>{
    return prevProps.posts.length == nextProps.posts.length && prevProps.postsContext.content == 
    nextProps.postsContext.content && prevProps.loading == nextProps.loading && prevProps.width==nextProps.width &&
    ((!prevProps.activeBranch || !nextProps.activeBranch) || prevProps.activeBranch.uri == 
    nextProps.activeBranch.uri)
})

const ListItem = React.memo(function ListItem({page,pages,data,style,index,setSize,listRef, 
    windowWidth,...rest}){
    const ref = useRef();
    const [postShown,setPostShown] = useState(false);

    useEffect(() => {
        try{
            setSize(index, ref.current.getBoundingClientRect().height);
            listRef.current._listRef.resetAfterIndex(index);
    
        }catch(e){

        }
    }, [windowWidth]);

    function getPostProps(post){
        let props = {
            post:rest.post,
            viewAs:"post",
            activeBranch:rest.activeBranch,
            postsContext:rest.postsContext,
            index:0
        };
        return props;
    }

    return(
        <>
        <div ref={ref} css={{margin:'30px 10px',width:'100%',overflow:'visible',position:'relative'}}>
            <div css={theme=>({backgroundColor:theme.backgroundLightColor,boxShadow:`0 0.5px 0.8px rgba(0, 0, 0, 0.04), 
            0 1.6px 2.7px rgba(0, 0, 0, 0.06), 0 7px 12px rgba(0, 0, 0, 0.1)`,borderRadius:25,overflow:'hidden',
            overflow:'hidden'})}>
                <Post minimal isSingular
                {...getPostProps()}
                />
            </div>
            <div css={{position:'absolute',bottom:-25,left:10}}>
                <div onClick={()=>setPostShown(true)} 
                css={theme=>({display:'flex',justifyContent:'center',alignItems:'center',borderRadius:100,padding:'10px 15px',
                backgroundColor:theme.postFloatingButtonColor,cursor:'pointer',
                boxShadow:`
                    0 0.5px 0.8px rgba(0, 0, 0, 0.016),
                    0 1.6px 2.7px rgba(0, 0, 0, 0.024),
                    0 7px 12px rgba(0, 0, 0, 0.04)`})}>
                    <CommentsSvg css={theme=>({height:27,width:27,fill:theme.textColor})}/>
                    <span css={{fontSize:'1.2rem',marginLeft:10}}>{rest.post.replies_count}</span>
                </div>
            </div>
        </div>
        {ReactDOM.createPortal(
            postShown?
            <PopUpPost postShown={postShown} setPostShown={setPostShown} post={rest.post}
            />:null
        ,document.getElementById("leaf-preview-root"))
        }
        </>
    )
},(prevProps,nextProps)=>{
    return prevProps.index==nextProps.index && prevProps.style.height == nextProps.style.height
})
