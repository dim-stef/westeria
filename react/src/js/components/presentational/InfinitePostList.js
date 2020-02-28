import React, {useState,useRef,useEffect,useLayoutEffect,useContext,useCallback} from "react";
import ReactDOM from "react-dom"
import {css} from "@emotion/core";
import {useTransition,useSpring,to,animated} from "react-spring/web.cjs";
import {useDrag} from "react-use-gesture";
import { VariableSizeList as List , areEqual} from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import {PopUpPost,PopUp} from "./PreviewPost"
import {CircularBranch} from "./Branch"
import {Post} from "./SingularPost"
import {StatusUpdate} from "./StatusUpdate"
import { useWindowSize } from "./useWindowResize";
import {UserContext} from "../container/ContextContainer"
import {SkeletonPostList} from "./SkeletonPostList";
import {Star,Dislike,useReactActions} from "./PostActions";
import { CommentsSvg,PlusSvg,CloseSvg } from "./Svgs";
import axios from "axios";
import history from "../../history";

const skeletonWrapper = theme =>css({
    margin:'30px 10%',width:'-webkit-fill-available',position:'absolute',top:43,
    '@media (max-device-width:767px)':{
        margin:'30px 10px'
    }
})
/*
box-shadow:
  0 0.1px 0.2px -1px rgba(0, 0, 0, 0.286),
  0 0.3px 0.5px -1px rgba(0, 0, 0, 0.41),
  0 0.6px 1.2px -1px rgba(0, 0, 0, 0.534),
  0 2px 4px -1px rgba(0, 0, 0, 0.82)
;
 */
const buttonWrapper = (theme)=>({display:'flex',justifyContent:'center',alignItems:'center',borderRadius:100,padding:'10px 13px',
    backgroundColor:theme.postFloatingButtonColor,cursor:'pointer',height:45,boxSizing:'border-box',
    boxShadow:theme.postFloatingButtonShadow,position:'relative',overflow:'hidden',
    '@media (max-device-width:767px)':{
        padding:10,
        height:40
    }
})

const TreeContext = React.createContext({ branch_tree:null,tree:null });
const ListContext = React.createContext({data:{}});

export const InfinitePostList = React.memo(function InfinitePostList({postsContext,activeBranch,posts,fetchData,hasMore
    ,width,height,refresh,loading}){

    const treeContext = useContext(TreeContext);
    const listContext = useContext(ListContext);

    const shouldPull = useRef(true);
    const margin = 30; // needed for height difference between posts
    let isFeed = false;
    if(postsContext.content=='all'){
        isFeed = true;
    }else if(postsContext.content =='tree'){
        isFeed = true;
    }else if(!postsContext.content){
        isFeed = true;
    }

    const [props,set] = useSpring(()=>({y:0}))

    const bind = useDrag(({down,movement:[mx,my],cancel})=>{

        // popups like post or tree view
        let popUps = document.getElementsByName('popUp');

        // should only pull if user is on top of the list
        // and not initial data fetching is happening
        if(shouldPull.current && popUps.length==0 && !loading && posts.length !=0){

            // adding !loading prevents duplicate requests
            if(my > 150 && !loading){
                cancel();
                set({y:0})
                refresh();
                return;
            }

            if(!down){
                set({y:0})
            }else{
                set({y:my})
            }
        }else{
            return;
        }
    },{bounds:{top:0}})

    const mounted = useRef(false);
    const shouldOpen = useRef(true);

    const setOpenRef = useRef(null)
    const setShowCreateRef = useRef(null)

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

    useEffect(()=>{
        treeContext.tree = null;
        treeContext.branch_tree = null;
    },[activeBranch])

    useEffect(()=>{
        if(posts.length <= 10){
            try{
                setShowActionButtons.current(true);
            }catch(e){

            }
        }
    },[posts])

    function onScroll({
        scrollOffset,
        scrollDirection,
      }) {
        if(scrollOffset == 0){
            shouldPull.current = true;
        }else{
            shouldPull.current = false;
        }

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
    const isItemLoaded = index => !hasMore || index < posts.length;

    //index => index < posts.length
    let listItemProps={
        setSize:setSize,
        windowWidth:windowWidth,
        listRef:infiniteLoaderRef,
        keyword:postsContext.content,
        activeBranch:activeBranch,
        loading:loading,
        posts:posts,
        isItemLoaded:isItemLoaded,
        pageProps:pageProps
    }

    listContext.data = listItemProps;
    return(
        <>
        <animated.div
        {...bind()}
        onMouseDown={()=>{}}
        onMouseMove={()=>{}}
        key={1}
        style={{
            transform: to([props.y],(y) => `translateY(${y}px)`)
        }} css={theme=>({width:width,
        willChange:'transform',
        '> div > div':{
            pointerEvents:'all !important'
        },
        '> div':{
            overflowY:'overlay !important',
            overflowX:'hidden !important',
            '&::-webkit-scrollbar':{
                    width:10
                },
            '&::-webkit-scrollbar-thumb':{
                backgroundColor:theme.scrollBarColor,
            },
            '@media (max-device-width:767px)':{
                '&::-webkit-scrollbar':{
                    width:0
                }, 
            }
        }})}>
            <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={posts.length + 2}
            loadMoreItems={loadMore}
            threshold={10}
            >
                {({ onItemsRendered, ref }) => (
                <List
                ref={ref}
                height={height}
                itemData={posts}
                itemCount={posts.length + 2}
                itemSize={getSize}
                estimatedItemSize={300}
                onItemsRendered={onItemsRendered}
                width={width}
                onScroll={onScroll}
                >{Item}
                </List>
                )}
            </InfiniteLoader>
        </animated.div>
        {posts.length == 0 && !loading?
        <div css={{display:'flex',flexFlow:'column',position:'absolute',top:200,width:'100%'}}>
            <h1 css={{textAlign:'center',marginTop:20}}>
                Nothing is here :(
            </h1>
            <h2 css={{marginTop:5,textAlign:'center'}}>
                Do something about it!
            </h2>
        </div>:null}
        {mounted.current?<Actions setShowActionButtons={setShowActionButtons} {...actionProps}/>:null}
        </>
    )
},(prevProps,nextProps)=>{
    return prevProps.posts.length == nextProps.posts.length && prevProps.postsContext.content == 
    nextProps.postsContext.content && prevProps.hasMore ==nextProps.hasMore && prevProps.loading == nextProps.loading &&
    prevProps.width==nextProps.width && nextProps.height == prevProps.height &&
    ((!prevProps.activeBranch || !nextProps.activeBranch) || prevProps.activeBranch.uri == 
    nextProps.activeBranch.uri)
})

const Item = ({index,style})=>{
    const listContextData = useContext(ListContext);
    const listContext = listContextData.data;

    return(
        <div style={style} css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            {index==0?
            <div css={{display:'flex',flexFlow:'column',width:'100%'}}>
                <Header index={index} setSize={listContext.setSize} windowWidth={listContext.windowWidth}
                    listRef={listContext.listRef} keyword={listContext.keyword}
                    activeBranch={listContext.activeBranch}
                />
                {listContext.loading && listContext.posts.length == 0?
                <div css={skeletonWrapper}>
                    <SkeletonPostList count={4} branchSize={30} boxSize={200}/>
                </div>:null}
            </div>:
            <ListItem style={style} index={index - 1} setSize={listContext.setSize} windowWidth={listContext.windowWidth}
                {...listContext.pageProps} posts={listContext.posts} listRef={listContext.listRef} 
                isItemLoaded={listContext.isItemLoaded} loading={listContext.loading}
            />
            }
            
        </div>
    )
}

const ListItem = React.memo(function ListItem({data,style,index,setSize,listRef, 
    windowWidth,isItemLoaded,posts,...rest}){
    const ref = useRef(null);

    useEffect(() => {
        if(ref && listRef && listRef.current && ref.current){
            setSize(index + 1, ref.current.getBoundingClientRect().height);
            listRef.current._listRef.resetAfterIndex(index + 1);
        }
    },[windowWidth,ref.current,listRef]);

    return(
        
        !isItemLoaded(index)?posts.length==0?null:<div ref={ref} css={skeletonWrapper} 
        style={{width:'100%',position:'relative',top:0}}>
            <IndicatorItem/>
        </div>:
        <div ref={ref} css={{margin:'30px 10%',width:'100%',overflow:'visible',position:'relative',
        '@media (max-device-width:767px)':{
            margin:0
        }}}>
            <PostItem post={posts[index]} activeBranch={rest.activeBranch} postsContext={rest.postsContext}/>
        </div>
    )
    
},areEqual)

const IndicatorItem = props =>{
    return(
        <SkeletonPostList count={1} branchSize={30} boxSize={200}/>
    )
}

const PostItem = props =>{
    if(!props.post){
        return null;
    }
    
    const starFuncRef = useRef(null)
    const dislikeFuncRef = useRef(null)
    const [postShown,setPostShown] = useState(false);

    const [springProps,set] = useSpring(()=>({
        x:0,
        config:{
            tension:500,
            friction:40
        }
    }))
    const bind = useDrag(({movement:[mx,my],down,cancel})=>{
        if(mx>100){
            starFuncRef.current()
            cancel();
        }else if(mx < -100){
            dislikeFuncRef.current()
            cancel();
        }

        if(!down){
            set({x:0})
        }else{
            set({x:mx})
        }
    },{axis:'x'})

    function getPostProps(post){
        return {
            post:props.post,
            viewAs:"post",
            activeBranch:props.activeBranch,
            postsContext:props.postsContext,
            index:0
        };
    }

    return(
        <>
        <animated.div {...bind()} onMouseDown={()=>{}} onMouseMove={()=>{}}
        style={{transform:to([springProps.x],(x)=>`translateX(${x}px)`)}}
        css={theme=>({backgroundColor:theme.backgroundLightColor,boxShadow:`0 0.5px 0.8px rgba(0, 0, 0, 0.04), 
        0 1.6px 2.7px rgba(0, 0, 0, 0.06), 0 7px 12px rgba(0, 0, 0, 0.1)`,borderRadius:25,overflow:'hidden',
        willChange:'transform','@media (max-device-width:767px)':{
            borderRadius:0
        }})}>
            <Post minimal isSingular
            {...getPostProps()}
            />
        </animated.div>
        <div css={{position:'absolute',bottom:-25,left:10}}>
            <div onClick={()=>setPostShown(true)} 
            css={buttonWrapper}>
                <CommentsSvg css={theme=>({height:27,width:27,fill:theme.textColor})}/>
                <span css={{fontSize:'1.2rem',marginLeft:10}}>{props.post.replies_count}</span>
            </div>
        </div>
        
        <Reacts post={props.post} starFuncRef={starFuncRef} dislikeFuncRef={dislikeFuncRef}/>
        {ReactDOM.createPortal(
            postShown?
            <PopUpPost postShown={postShown} setPostShown={setPostShown} post={props.post}
            />:null
        ,document.getElementById("leaf-preview-root"))
        }
        </>
)}

const Reacts = ({post,starFuncRef,dislikeFuncRef}) =>{
    const [react,starCount,dislikeCount,isDisabled,changeReact,createOrDeleteReact] = useReactActions(post)
    const starHeight = dislikeCount + starCount==0? 0 : (starCount / (dislikeCount+starCount))*100
    const dislikeHeight = dislikeCount + starCount==0? 0 : (dislikeCount / (dislikeCount+starCount))*100

    const handleStarClick = ()=>{
        starFuncRef.current()
    }

    const handleDislikeClick = ()=>{
        dislikeFuncRef.current()
    }

    return(
        <>
        <div css={{position:'absolute',bottom:-25,left:100}}>
            <div css={buttonWrapper} onClick={handleStarClick}>
                <div css={{height:`${starHeight}%`,transition:'height 0.2s',
                position:'absolute',bottom:0,left:0,backgroundColor:'#ff3333',width:'100%'}}></div>
                <Star post={post} react={react} changeReact={changeReact}
                createOrDeleteReact={createOrDeleteReact} isDisabled={isDisabled} starClickRef={starFuncRef}/>
            </div>
        </div>
        <div css={{position:'absolute',bottom:-25,left:150}}>
            <div css={buttonWrapper} onClick={handleDislikeClick}>
                <div css={{height:`${dislikeHeight}%`,transition:'height 0.2s',
                position:'absolute',bottom:0,left:0,backgroundColor:'#3333ff',width:'100%'}}></div>
                <Dislike post={post} react={react} changeReact={changeReact}
                createOrDeleteReact={createOrDeleteReact} isDisabled={isDisabled} dislikeClickRef={dislikeFuncRef}/>
            </div>
        </div>
        <div css={{position:'absolute',width:'100%',height:'100%',borderRadius:30,display:'flex',
        top:0,left:0,zIndex:-1,overflow:'hidden',
        '@media (max-device-width:767px)':{
            borderRadius:0
        }}}>
            <div css={{width:'50%',height:'100%',backgroundColor:'#ff3333'}}>

            </div>
            <div css={{width:'50%',height:'100%',backgroundColor:'#3333ff'}}>

            </div>
        </div>
        </>
    )
}

function getUniqueNodes(tree){
    // gather all nodes from the tree in a single array of arrays
    let allNodes = tree.map(t=>[...t.nodes])
    // flatten the array
    allNodes = allNodes.reduce((flatten, arr) => [...flatten, ...arr])
    // remove duplicates
    let unique = allNodes.filter((v, i, a) => a.findIndex(innerV=>innerV.uri==v.uri) === i); 
    return unique
}

const Header = React.memo(({windowWidth,setSize,listRef,index,keyword,activeBranch}) =>{
    const ref = useRef(null);
    const treeContext = useContext(TreeContext);
    const [header,setHeader] = useState("");

    let initTree;
    if(keyword=='tree'){
        initTree = treeContext.tree
    }else if(keyword=='branch_tree'){
        initTree = treeContext.branch_tree
    }else{
        initTree = []
    }

    const [tree,setTree] = useState(initTree);
    const [showTree,setShowTree] = useState(false);

    function getGenericFollowTreeHeader(nodeCount,blur){
        return(
            <span>A collection of leaves from <b css={{filter:`blur(${blur}px)`,transition:'filter 0.2s'}}>
            {nodeCount}</b> communities similar to your follows</span>
        )
    }

    function getGenericBranchTreeHeader(nodeCount,blur){
        return(
            <span>Leaves posted by <b css={{filter:`blur(${blur}px)`,transition:'filter 0.2s'}}>
            {nodeCount}</b> communities similar to {activeBranch.name}</span>
        )
    }

    useEffect(() => {
        try{
            setSize(index, ref.current.getBoundingClientRect().height);
            listRef.current._listRef.resetAfterIndex(index);
    
        }catch(e){

        }
    }, [windowWidth,header]);

    async function getFollowingTreeRelations(){
        let response = await axios.get(`/api/v1/branches/${activeBranch.uri}/tree_with_relations/`);
        return response.data
    }

    async function getTreeRelations(){
        let response = await axios.get(`/api/v1/branches/${activeBranch.uri}/nodes_beneath/`);
        return response.data
    }

    async function getTreeHeader(){
        let treeData;
        if(keyword=='branch_tree'){
            let _header;

            // get data from context if it exists
            if(treeContext.branch_tree){
                _header = getGenericBranchTreeHeader(getUniqueNodes(treeContext.branch_tree).length,0)
                setHeader(_header)

            // else fetch it from api 
            }else{

                // loading indicator
                _header = getGenericBranchTreeHeader(Math.round(Math.random()*10),3)
                setHeader(_header)

                // get and set the actual data
                treeData = await getTreeRelations();
                setTree(treeData);
                treeContext.branch_tree = treeData;

                _header = getGenericBranchTreeHeader(getUniqueNodes(treeContext.branch_tree).length,0)
                setHeader(_header)
            }
        }else if(keyword=='tree'){
            let _header;
            if(treeContext.tree){
                _header = getGenericFollowTreeHeader(getUniqueNodes(treeContext.tree).length,0)
                setHeader(_header)
            }else{
                _header = getGenericFollowTreeHeader(Math.round(Math.random()*10),3)
                setHeader(_header)
    
                treeData = await getFollowingTreeRelations();
                setTree(treeData)
                treeContext.tree = treeData;

                _header = getGenericFollowTreeHeader(getUniqueNodes(treeContext.tree).length,0)
                setHeader(_header)
            }
        }
    }

    useLayoutEffect(()=>{
        if(keyword=='all'){
            let _header = <span>All leaves available to westeria</span>
            setHeader(_header)
        }else if(keyword =='tree'){
            getTreeHeader();
        }else if(keyword == 'branch'){
            let _header = <span>{activeBranch.name}'s leaves</span>
            setHeader(_header)
        }else if(keyword == 'branch_community'){
            let _header = <span>Leaves posted to {activeBranch.name}</span>
            setHeader(_header)
        }else if(keyword == 'branch_tree'){
            getTreeHeader();
        }else{
            let _header = <span>Your feed</span>
            setHeader(_header)
        }
    },[keyword])

    function handleOpenTree(){
        if(keyword=='branch_tree' || keyword=='tree' && tree.length > 0){
            setShowTree(true)
        }
    }

    let popUpHeader = keyword=='tree'?'Your tree':activeBranch?`${activeBranch.name}'s tree`:null;

    return(
        <>
        <div ref={ref} css={{margin:'0 10%','@media (max-device-width:767px)':{
            margin:'0 10px'
        }}} onClick={handleOpenTree}>
            <h1 css={theme=>({cursor:keyword=='tree' || keyword=='branch_tree'?'pointer':null,
            fontSize:'3rem',marginTop:10,marginBottom:0,
            fontWeight:500,color:theme.textLightColor,
            '@media (max-device-width:767px)':{
                fontSize:'2rem'
            }})}>{header}</h1>
        </div>
        {ReactDOM.createPortal(
            showTree && tree.length>0?
            <PopUp shown={showTree} setShown={setShowTree} header={popUpHeader}>
                <Tree keyword={keyword} tree={tree} activeBranch={activeBranch}/>
            </PopUp>
        :null
        ,document.getElementById("leaf-preview-root"))
        }
        </>
    )
},(prevProps,nextProps)=>{
    return prevProps.keyword == nextProps.keyword && 
    ((!prevProps.activeBranch && !nextProps.activeBranch) || prevProps.activeBranch.uri==nextProps.activeBranch.uri)
})

function Tree({keyword,tree}){
    return(
        keyword=='branch_tree'?
        <BranchTree tree={tree}/>:<FollowTree tree={tree}/>
    )
}

function BranchTree({tree}){
    return(
        <div>
            <h1 css={{margin:10,fontWeight:400}}>Communities similar to <b>{tree[0].name}</b></h1>
            <div css={{display:'flex',flexFlow:'row wrap',justifyContent:'space-between'}}>
                {tree[0].nodes.map(b=>{
                    return(
                        <CircularBranch branch={b}/>
                    )
                })}
            </div>
        </div>
    )
}

function FollowTree({tree}){
    return(
        <div css={{display:'flex',flexFlow:'column'}}>
            {tree.map(t=>{
                if(t.nodes.length == 0) return null;

                return (
                    <>
                    <h1 css={{margin:10,fontWeight:400}}>Because you follow <b>{t.name}</b></h1>
                    <div css={{display:'flex',flexFlow:'row wrap',justifyContent:'space-between'}}>
                        {t.nodes.map(b=>{
                            return(
                                <CircularBranch branch={b}/>
                            )
                        })}
                    </div>
                    </>
                )
            })}
        </div>
    )
}

const Actions = ({setShowActionButtons,...actionProps}) =>{
    const [shown,setButtonsShown] = useState(true);
    setShowActionButtons.current = setButtonsShown;

    return ReactDOM.createPortal(
        <div css={{transform:shown?'translateY(-60px)':'translateY(60px)',
        position:'fixed',bottom:0,transition:'transform 0.3s ease-in',
        display:'flex',alignItems:'center',justifyContent:'center',willChange:'transform',
        width:document.getElementById('posts-container').clientWidth}}>
            <Create {...actionProps}/>
        </div>
        
    ,document.getElementById('posts-container'))
}


const createTo = (y) => ({ y: y })

const Create = React.memo(function Create({activeBranch,postsContext,width,isFeed,updateFeed}){
    const userContext = useContext(UserContext);
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
                {userContext.isAuth?
                <>
                <div onClick={handleClose} 
                css={{height:50,width:'100%',display:'flex',justifyContent:'center',
                alignItems:'center',paddingBottom:10,cursor:'pointer'}}>
                    <CloseSvg css={theme=>({height:40,width:40,boxSizing:'border-box',padding:10,borderRadius:'50%'
                    ,backgroundColor:theme.backgroundDarkColor,fill:theme.textHarshColor,boxShadow:'0px 0px 11px -4px black'})}/>
                </div>
                <StatusUpdate activeBranch={activeBranch} postsContext={postsContext} updateFeed={updateFeed} 
                isFeed={isFeed} redirect 
                style={{borderTopRightRadius:25,borderTopLeftRadius:25,boxShadow:'0px 0px 11px -4px black'}}/>
                </>
                :null}
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