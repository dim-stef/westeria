import React, {useState,useRef,useEffect,useLayoutEffect,useContext,useCallback} from "react";
import ReactDOM from "react-dom"
import {css} from "@emotion/core";
import {useTransition,useSpring,interpolate,animated} from "react-spring/web.cjs";
import {useTheme as emotionTheme} from "emotion-theming"; 
import { VariableSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import {PopUpPost} from "./PreviewPost"
import {Post} from "./SingularPost"
import {StatusUpdate} from "./StatusUpdate"
import { useWindowSize } from "./useWindowResize";
import { CommentsSvg,PlusSvg,CloseSvg } from "./Svgs";
import history from "../../history";

export const InfinitePostList = React.memo(function InfinitePostList({postsContext,activeBranch,posts,fetchData,hasMore
    ,width,height,loading}){

    const margin = 30; // needed for height difference between posts
    let header = '';
    let isFeed = false;
    if(postsContext.content=='all'){
        isFeed = true;
        header = 'All leaves available to westeria'
    }else if(postsContext.content =='tree'){
        isFeed = true;
        header = `A collection of leaves from ${Math.floor(Math.random() * 10)} communities similar 
        to your follows`
    }else if(postsContext.content == 'branch'){
        isFeed = false;
        header = `${activeBranch.name}'s leaves `
    }else if(postsContext.content == 'branch_community'){
        isFeed = false;
        header = `Leaves posted to ${activeBranch.name}`
    }else if(postsContext.content == 'branch_tree'){
        isFeed = false;
        header = `Leaves posted by ${Math.floor(Math.random() * 10)} communities similar to
        ${activeBranch.name}`
    }else{
        isFeed = true;
        header = 'Your feed'
    }
    const [buttonsShown,setButtonsShown] = useState(false);
    const mounted = useRef(false);
    const theme = emotionTheme();
    const shouldOpen = useRef(true);

    const setOpenRef = useRef(null)
    const setShowCreateRef = useRef(null)

    const listRef = useRef(null);
    const infiniteLoaderRef = useRef(null);

    const setShowActionButtons = useRef(null);

    const sizeMap = useRef({});
    const setSize = useCallback((index, size) => {
        sizeMap.current = { ...sizeMap.current, [index]: size };
    }, []);
    const getSize = useCallback(index => sizeMap.current[index] + margin || 20, []);
    const [windowWidth] = useWindowSize();

    useEffect(()=>{
        mounted.current = true;
    },[])

    function onScroll({
        scrollOffset,
        scrollDirection,
      }) {
        try{
            if(scrollDirection=='forward'){
                setShowActionButtons.current(false);
            }else if(scrollDirection=='backward'){
                setShowActionButtons.current(true);
            }

        }catch(e){

        }
        

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

    let actionProps = {
        postsContext:postsContext,
        activeBranch:activeBranch,
        width:width,
        isFeed:isFeed,
        updateFeed:(post)=>{
            history.push(`/${activeBranch.uri}/leaves/${post.id}`)
        }
    }

    const loadMore = loading ? () => {} : fetchData;

    return(
        <>
        <InfiniteLoader
        ref={infiniteLoaderRef}
        isItemLoaded={index => index < posts.length}
        itemCount={posts.length + 2}
        loadMoreItems={loadMore}
        threshold={10}
        >
            {({ onItemsRendered, ref }) => (
            <List
            ref={ref}
            height={height}
            itemCount={posts.length + 1}
            itemSize={getSize}
            onItemsRendered={onItemsRendered}
            width={width}
            onScroll={onScroll}
            >{({ style,index }) => {
                    return <div style={style} css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                        {index==0?
                        <Header index={index} setSize={setSize} windowWidth={windowWidth}
                            listRef={infiniteLoaderRef} header={header}
                        />:
                        <ListItem style={style} index={index - 1} setSize={setSize} windowWidth={windowWidth}
                        {...pageProps} post={posts[index - 1]} listRef={infiniteLoaderRef}
                        />}
                        
                    </div>
                }}
            </List>
            )}
        </InfiniteLoader>
        {mounted.current?<Actions setShowActionButtons={setShowActionButtons} {...actionProps}/>:null}
        </>
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
            setSize(index + 1, ref.current.getBoundingClientRect().height);
            listRef.current._listRef.resetAfterIndex(index + 1);
    
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
        <div ref={ref} css={{margin:'30px 10%',width:'100%',overflow:'visible',position:'relative',
            '@media (max-device-width:767px)':{
                margin:'30px 10px'
            }}}>
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

const Header = ({windowWidth,setSize,listRef,index,header=""}) =>{
    const ref = useRef(null);

    useEffect(() => {
        try{
            setSize(index, ref.current.getBoundingClientRect().height);
            listRef.current._listRef.resetAfterIndex(index);
    
        }catch(e){

        }
    }, [windowWidth]);

    return(
        <div ref={ref} css={{width:'100%',margin:'0 10%','@media (max-device-width:767px)':{
            margin:'0 10px'
        }}}>
            <h1 css={theme=>({fontSize:'3rem',marginTop:10,marginBottom:0,fontWeight:500,color:theme.textLightColor,
            '@media (max-device-width:767px)':{
                fontSize:'2rem'
            }})}>{header}</h1>
        </div>
    )
}

const Actions = ({setShowActionButtons,...actionProps}) =>{
    const [shown,setButtonsShown] = useState(false);
    setShowActionButtons.current = setButtonsShown;

    const transitions = useTransition(shown, null, {
        from: { transform: 'translateY(60px)' },
        enter: { transform: 'translateY(-60px)' },
        leave: { transform: 'translateY(60px)' },
    })
    return ReactDOM.createPortal(
         transitions.map(({ item, props, key }) =>
            item && <animated.div key={key} style={props} css={{position:'fixed',bottom:0,
            display:'flex',alignItems:'center',justifyContent:'center',willChange:'transform',
            width:document.getElementById('posts-container').clientWidth}}>
                <Create {...actionProps}/>
            </animated.div>
        )
    ,document.getElementById('posts-container'))
}


const createTo = (y) => ({ y: y })

const Create = React.memo(function Create({activeBranch,postsContext,width,isFeed,updateFeed}){
    const [show,setShow] = useState(false);
    const ref = useRef(null);

    const [props,set] = useSpring(()=>({
        from:{y:200}
    }))
    
    /*const bind = useDrag(({ down, movement: [mx, my], velocity,direction:[xDir,yDir] }) => {
        const trigger = velocity > 0.2 && xDir < 0;
        const isGone = trigger && !down
        const y = my;
        set({ y:y })
    },{domTarget:container, bounds: { top: 0} })

    React.useEffect(bind, [bind])*/

    useEffect(()=>{
        if(show){
            set(()=>createTo(0))
        }else{
            set(()=>createTo(ref.current.clientHeight + 50))
        }
    },[show])

    function handleClose(e){
        e.stopPropagation();
        setShow(false)
    }

    return(
        <>
        <div onClick={()=>setShow(true)}>
            <div css={theme=>({display:'flex',padding:15,margin:'0 5px',
            borderRadius:'50%',backgroundColor:theme.primaryColor,boxShadow:'0px 1px 4px 0px #000000a3'})}>
                <PlusSvg css={theme=>({height:20,width:20,fill:'white'})}/>
            </div>
        </div>
        
        {ReactDOM.createPortal(
            <animated.div ref={ref} style={{transform:props.y.interpolate(y=>`translateY(${y}px)`)}}
            css={{width:width,position:'fixed',zIndex:1002,bottom:0
            }}>
                <div onClick={handleClose} 
                css={{height:50,width:'100%',display:'flex',justifyContent:'center',
                alignItems:'center',paddingBottom:10,cursor:'pointer'}}>
                    <CloseSvg css={theme=>({height:40,width:40,boxSizing:'border-box',padding:10,borderRadius:'50%'
                    ,backgroundColor:theme.backgroundDarkColor,fill:theme.textHarshColor,boxShadow:'0px 0px 11px -4px black'})}/>
                </div>
                <StatusUpdate activeBranch={activeBranch} postsContext={postsContext} updateFeed={updateFeed} 
                isFeed={isFeed} redirect 
                style={{borderTopRightRadius:25,borderTopLeftRadius:25,boxShadow:'0px 0px 11px -4px black'}}/>
            </animated.div>
        ,document.getElementById('posts-container'))}
        </>
    )
},(prevProps,nextProps)=>{
    if(!prevProps.activeBranch || !nextProps.activeBranch || prevProps.activeBranch.uri == nextProps.activeBranch.uri){
        return true
    }
    return false
})