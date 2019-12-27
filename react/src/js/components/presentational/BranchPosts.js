import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import Pullable from 'react-pullable';
import {CSSTransition} from 'react-transition-group';
import {isMobile} from 'react-device-detect';
import {NavLink} from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import {
    AllPostsContext,
    BranchCommunityPostsContext,
    BranchPostsContext,
    BranchTreePostsContext,
    PostsContext,
    RefreshContext,
    TreePostsContext,
    UserContext,
    RouteTransitionContext,
    SwipeablePostGridContext
} from "../container/ContextContainer"
import {MobileModal} from "./MobileModal"
import {Tooltip, TooltipChain} from "./Tooltip";
import {Modal, ToggleContent} from "./Temporary"
import {SmallBranch} from "./Branch"
import Skeleton, {SkeletonTheme} from 'react-loading-skeleton';
import {Post} from './SingularPost';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import StatusUpdate from "./StatusUpdate";
import {Grid} from "./Grid"
import {SwipeablePostGrid} from "./SwipeablePostGrid";
import {SuperBar, SwipeableBar} from "./SuperBar"
import {SkeletonFixedGrid} from "./SkeletonGrid"
import {useMediaQuery} from 'react-responsive'

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();


const postsContainer = () =>css({
    willChange:'filter',
    transition:'filter 0.2s ease'
})

function cssPropertyValueSupported(prop, value) {
    var d = document.createElement('div');
    d.style[prop] = value;
    return d.style[prop] === value;
}

function resetPostListContext(postsContext,props){
    postsContext.hasMore = true;
    postsContext.next = null;
    postsContext.lastVisibleElement = null;
    postsContext.lastVisibleIndex = 0;
    postsContext.loadedPosts.length = 0;
    postsContext.cachedPosts.length = 0;
    postsContext.openPosts.length = 0;
    postsContext.uniqueCached.length = 0;
    postsContext.branchUri = props.branch;
    postsContext.paths.length = 0;
}

function DisplayPosts({isFeed,posts,setPosts,
    postsContext,resetPostsContext,
    updateFeed,postedId,fetchData,hasMore,
    showPostedTo,activeBranch,refresh,target,keyword}){
    
    const isMobileOrTablet = useMediaQuery({
        query: '(max-device-width: 1223px)'
    })

    const ref = useRef(null);

    const [height,setHeight] = useState(0);
    const [width,setWidth] = useState(0);
    const isSwiping = useRef(false);

    function handleWidth(){
        if(ref.current){
            let mobileNavBar = null;
            try{
                mobileNavBar = document.getElementById('mobile-nav-bar');
            }catch(e){

            }

            setWidth(ref.current.clientWidth);
            let refRect = ref.current.getBoundingClientRect();
            
            // 50 for top bar height
            setHeight(isMobileOrTablet?window.innerHeight - 50 -
                (mobileNavBar?mobileNavBar.clientHeight:0):window.innerHeight - refRect.top)
        }
    }

    useLayoutEffect(()=>{
        handleWidth();
    },[ref])

    useEffect(()=>{
        window.addEventListener('resize',handleWidth);

        return ()=>{
            window.removeEventListener('resize',handleWidth);
        }
    },[])

    return(
        <>

        <SwipeableBar postsContext={postsContext} refresh={refresh} branch={activeBranch}
            updateFeed={updateFeed} postedId={postedId} isFeed={isFeed} width={width}
        />
        <div style={{width:'100%',overflow:'hidden'}} ref={ref}>
        {width && height>0?
        <SwipeablePostGrid postsContext={postsContext} activeBranch={activeBranch} posts={posts} fetchData={fetchData}
            width={width} height={height} hasMore={hasMore} isSwiping={isSwiping} refresh={refresh}
        />
        :null}
        </div>
    </>
    )
}

function ResponsiveSkeleton({height}){
    let supportsGrid = cssPropertyValueSupported('display', 'grid');
    const theme = useTheme();

    return(
        supportsGrid?<div style={{height:height}}><SkeletonFixedGrid/></div>:
        [...Array(8)].map((e, i) => 
            <div key={i} style={{width:'100%',marginTop:10}}>
                <div style={{padding:'10px'}}>
                    <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
                        <Skeleton circle={true} width={48} height={48}/>
                    </SkeletonTheme>
                    <div style={{marginTop:10,lineHeight:'2em'}}>
                        <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
                            <Skeleton count={2} width="100%" height={10}/>
                        </SkeletonTheme>
                        

                        <SkeletonTheme color={theme.skeletonColor} highlightColor={theme.skeletonHighlightColor}>
                            <Skeleton count={1} width="30%" height={10}/>
                        </SkeletonTheme>
                    </div>
                </div>
            </div>
        )
    )
}

if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}


export const FinalDisplayPosts = ({postsContext,branch,isFeed,keyword,resetPostsContext,activeBranch,postedId,externalId=null})=>{
    const swipeablePostGridContext = useContext(SwipeablePostGridContext)
    const [posts,setPosts] = useState(postsContext.loadedPosts);
    const refreshContext = useContext(RefreshContext);
    const userContext = useContext(UserContext);
    const scrollableTarget = useRef(null);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    function buildQuery(baseUri,params){
        if(params){
            var esc = encodeURIComponent;
            var query = Object.keys(params)
                .map(k => esc(k) + '=' + esc(params[k].value))
                .join('&');
            let newUri = `${baseUri}?${query}`;
            return newUri;
        }
        return baseUri;
    }

    const fetchData = async () =>{
        if(!postsContext.hasMore){
            return;
        }

        let endpoint = 'posts';
        let uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${branch}/${endpoint}`,postsContext.params);

        if(keyword){
            uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${branch}/${endpoint}/${keyword}/`,postsContext.params);
        }else{
            uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${branch}/${endpoint}/`,postsContext.params);
        }

        if(keyword=="all"){
            if(userContext.isAuth){
                uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${branch}/posts/all/`,postsContext.params);
            }else{
                uri = postsContext.next?postsContext.next:buildQuery(`/api/posts/all/`,postsContext.params);
            }
        }

        const response = await axios(uri,{
            cancelToken: source.token
          });

        if(!response.data.next){
            postsContext.hasMore = false;
        }


        if(postsContext.loadedPosts == 0){
            postsContext.loadedPosts = [...response.data.results];
            setPosts([...response.data.results]); 
        }else{
            postsContext.loadedPosts = [...posts,...response.data.results];
            setPosts([...posts,...response.data.results]);
        }
        
        //setNext(response.data.next);
        postsContext.next = response.data.next;
    };

    useEffect(()=>{
        if(postsContext.loadedPosts.length==0 || postsContext.branchUri != branch){
            source.cancel('Operation canceled by the user.');
            CancelToken = axios.CancelToken;
            source = CancelToken.source();
            resetPostsContext();
            setPosts([])
            fetchData();
        }
    },[postsContext,branch,keyword])

    useEffect(()=>{
        refreshContext.page = isFeed?'feed':'branch';
    },[])

    const refresh = useCallback(()=>{
        if(swipeablePostGridContext.setIndex){
            swipeablePostGridContext.setIndex(0);
        }

        source.cancel('Operation canceled by the user.');
        CancelToken = axios.CancelToken;
        source = CancelToken.source();
        resetPostsContext(branch);
        setPosts([]);
        fetchData();
    },[postsContext,branch,keyword]);

    const updateFeed = useCallback(
        (newPost) => {
            postsContext.loadedPosts = [newPost,...postsContext.loadedPosts];
            setPosts([newPost,...posts])
        },
        [posts],
    );

    refreshContext.refresh = refresh;

    return(
        <div ref={scrollableTarget} css={postsContainer} id="posts-container">
            <DisplayPosts isFeed={isFeed} refresh={refresh} keyword={keyword}
            updateFeed={updateFeed} postedId={postedId} postsContext={postsContext}
            posts={postsContext.loadedPosts} setPosts={setPosts} hasMore={postsContext.hasMore}
            activeBranch={activeBranch} fetchData={fetchData} resetPostsContext={resetPostsContext}
            target={isMobile?scrollableTarget.current:null}
            />
            
        </div>
    )
}


export default function FeedPosts(props){
    const postsContext = useContext(PostsContext);
    const branchPostsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        resetPostListContext(branchPostsContext,props);
        resetPostListContext(branchCommunityPostsContext,props);
        resetPostListContext(branchTreePostsContext,props);
    },[])

    return(
        <FinalDisplayPosts {...props} keyword="feed" isFeed postsContext={postsContext} 
        resetPostsContext={()=>resetPostListContext(postsContext,props)}/>
    )
}

export function AllPosts(props){
    const allPostsContext = useContext(AllPostsContext);
    const branchPostsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        resetPostListContext(branchPostsContext,props);
        resetPostListContext(branchCommunityPostsContext,props);
        resetPostListContext(branchTreePostsContext,props);
    },[])

    return(
        <FinalDisplayPosts {...props} isAll isFeed keyword="all" postsContext={allPostsContext} 
        resetPostsContext={()=>resetPostListContext(allPostsContext,props)}/>
    )
}


export function TreePosts(props){
    const treePostsContext = useContext(TreePostsContext);
    const branchPostsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        resetPostListContext(branchPostsContext,props);
        resetPostListContext(branchCommunityPostsContext,props);
        resetPostListContext(branchTreePostsContext,props);
    },[])

    return(
        <FinalDisplayPosts {...props} isTree isFeed keyword="following_tree" postsContext={treePostsContext} 
        resetPostsContext={()=>resetPostListContext(treePostsContext,props)}/>
    )
}

export function BranchPosts(props){
    const postsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        if(postsContext.branchUri != props.branch){
            resetPostListContext(postsContext,props);
            resetPostListContext(branchCommunityPostsContext,props);
            resetPostListContext(branchTreePostsContext,props);
        }
    },[postsContext.branchUri])

    return(
        <FinalDisplayPosts {...props} postsContext={postsContext} resetPostsContext={()=>resetPostListContext(postsContext,props)}/>
    )
}

export function GenericBranchPosts(props){
    let context = props.postsContext;

    const branchPostsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        // If navigate to different branch,reset all posts tabs
        if(context.branchUri != props.branch){
            resetPostListContext(branchPostsContext,props);
            resetPostListContext(branchCommunityPostsContext,props);
            resetPostListContext(branchTreePostsContext,props);
        }
    },[context.branchUri])

    return(
        <FinalDisplayPosts {...props} keyword={props.keyword} postsContext={context}
        resetPostsContext={()=>resetPostListContext(context,props)}/>
    )
}

function FilterPosts({setPosts,postsContext,resetPostsContext,isFeed,refreshFunction,fetchData}){
    const [params,setParams] = useState(postsContext.params || null);

    function shallowCompare(obj1, obj2){
        var same = true;
        if(Object.keys(obj1).length!=Object.keys(obj2).length){
            same = false;
        }else{
            for (var key in obj1) {
                if (obj1.hasOwnProperty(key)) {
                    if(obj1[key].hasOwnProperty('value')){
                        if(obj1[key].value != obj2[key].value){
                            same = false;
                        }
                    }else{
                        shallowCompare(obj1[key],obj2[key])
                    }
                }
            }
        }
        return same;
    }

    useEffect(()=>{
        if(!shallowCompare(params , postsContext.params)){
            postsContext.params = params;
            refreshFunction();
        }
        postsContext.params = params;
    },[params])

    return(
        <div className="flex-fill" 
        style={{height:50,
        justifyContent:'space-evenly',alignItems:'center',
        WebkitJustifyContent:'space-evenly',WebkitAlignItems:'center'}}>
            <ContentTypeFilter setParams={setParams} params={params} 
            defaultOption={postsContext.params?postsContext.params.content:null}/>
            <AlgorithmFilter setParams={setParams} params={params}
            defaultOption={postsContext.params?postsContext.params.ordering:null}/>
            <TimeFilter setParams={setParams} params={params} 
            defaultOption={postsContext.params?postsContext.params.past:null}/>
            {isMobile?null:<ActionArrow refresh={refreshFunction}/>}
        </div>
    )
}


var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);
    return {
        top: top,
        left: left
    };
};

const filterActionArrow = theme => css({
    '&:hover':{
        backgroundColor:theme.hoverColor
    }
})

function ActionArrow({refresh}){
    const context = useContext(RefreshContext);
    const ref = useRef(null);
    const [navigationTopPosition,setNavigationTopPosition] = useState(0);
    const [windowScroll,setWindowScroll] = useState(0);

    // future support for scroll to top
    useEffect(()=>{
        if(ref){
            setNavigationTopPosition(cumulativeOffset(ref.current).top - 50);
            var scrollListener = function (event) {
                
                setWindowScroll(window.scrollY);
            }
            window.addEventListener("scroll", scrollListener );
        }
        
        return () =>{
            window.removeEventListener("scroll", scrollListener);
        }
        
    },[ref])

    function onClick(){
        refresh();
    }

    return(
        <div ref={ref} className="filter-action-arrow flex-fill" css={theme=>filterActionArrow(theme)}>
            <button className="filter-action-arrow-button" style={{border:0,backgroundColor:'transparent'}} onClick={onClick}>
                <RefreshArrowSvg/>
            </button>
        
        </div>
    )
}

function ContentTypeFilter({setParams,params,defaultOption}){

    const options = [
        { value: 'leaves', label: 'Leaves' },
        { value: 'leavesAndReplies', label: 'Leaves and Replies' },
        { value: 'media', label: 'Media' },
    ];


    return (
        <DropdownList setParams={setParams} label="content" params={params} name="content" options={options} 
        defaultOption={defaultOption?defaultOption:options[0]}/>   
    )
}


function AlgorithmFilter({setParams,params,defaultOption}){

    const options = [
        { value: '-hot_score', label: 'Hot'},
        { value: '-created', label: 'New'}
    ]

    return (
        <DropdownList setParams={setParams} label="ordering" params={params} name="ordering" options={options} 
        defaultOption={defaultOption?defaultOption:options[0]}/>
    )
}

function TimeFilter({setParams,params,defaultOption}){

    const options = [
        { value: 'all', label: 'All time'},
        { value: 1, label: 'Past hour'},
        { value: 24, label: 'Past day'},
        { value: 24*7, label: 'Past week'},
        { value: 24*7*30, label: 'Past month'},
        { value: 24*7*30*365, label: 'Past year'},
    ]

    return (
        <DropdownList setParams={setParams} label="past" params={params} name="past" options={options} 
        defaultOption={defaultOption?defaultOption:options[0]}/>
    )
}

const previewCss = theme => css({
    '&:hover':{
        backgroundColor:theme.hoverColor
    }
})

export function DropdownList({type="text",component=null,options,defaultOption,name,
setParams,params,label,changeCurrentBranch,setBranch,preview=true,previewClassName='',showOnTop,children}){
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
      })
    const didMountRef = useRef(false);
    const [selected,setSelected] = useState(defaultOption)
    const [isOpen,setOpen] = useState(false);
    const ref = useRef(null);
    const Component = component;
    const userContext = useContext(UserContext);
    const theme = useTheme();

    function handleClick(e,show){
        
        if(!isDesktopOrLaptop){
            setOpen(true);
            show();
        }else{
            setOpen(!isOpen);
        }
    }

    function handleHide(hide){
        setOpen(false);
    }

    function handleOutsideClick(e){
        if(ref.current){
            if(!ref.current.contains(e.target)){
                setOpen(false);
            }
        }
    }

    useEffect(()=>{
        if(didMountRef.current){
            if(type=="text"){
                setParams({...params,[label]:selected})
            }else{
                if(changeCurrentBranch){
                    userContext.changeCurrentBranch(selected);
                }else{
                    setBranch(selected)
                }
            }
        }else{
            didMountRef.current = true;
        }
        
    },[selected])

    useEffect(()=>{
        document.addEventListener('click',handleOutsideClick);

        return ()=>{
            document.removeEventListener('click',handleOutsideClick);
        }
    },[])

    function handleSelect(option){
        setSelected(option);
        setOpen(false);
    }

    return (
        <ToggleContent 
            toggle={show=>(
                <div ref={ref} onClick={e=>handleClick(e,show)}>
                    {preview?
                    <div 
                    id={`${name}-filter`} className="flex-fill filter-selector" 
                    >
                        {type=="text"?<span style={{color:theme.textLightColor}}>{selected.label}</span>:
                        <SmallBranch branch={selected} isLink={false}/>}
                        <DownArrowSvg/>
                    </div>:
                    <div>{children}</div>}
                    
                    {isOpen && isDesktopOrLaptop?<div className="flex-fill filter-dropdown" 
                    style={{backgroundColor:theme.backgroundColor,top:showOnTop?0:null}}>
                        {options.map(op=>{
                            let props = {handleSelect:handleSelect,setSelected:setSelected, selected:selected, option:op}
                            return type=="text"?<DropdownItem {...props}/>:<Component {...props}/>
                        })}
                    </div>:null}
                </div>
            )}
            content={hide => (
            <Modal onClick={handleHide} isOpen={isOpen}>
                <CSSTransition in={isOpen} timeout={200} classNames="side-drawer" onExited={()=>hide()} appear>
                    <MobileModal>
                        {options.map(op=>{
                            let props = {handleSelect:handleSelect,setSelected:setSelected, selected:selected, option:op}
                            return type=="text"?<DropdownItem {...props}/>:<Component  {...props}/>
                        })}
                    </MobileModal>
                </CSSTransition>
            </Modal>    
            )}/>
    )
}

function DropdownItem({setSelected,handleSelect,selected,option}){
    const theme = useTheme();
    let style = option.value==selected.value?{backgroundColor:theme.borderColor}:null

    return(
        <span style={{...style}} 
        onClick={()=>handleSelect(option)} 
        className="filter-dropdown-item">{option.label}</span>
    )
}

function DownArrowSvg(){
    const theme = useTheme();

    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 41.999 41.999"
        style={{ enableBackground: "new 0 0 41.999 41.999",
        height:7,width:7,transform: 'rotate(90deg)',fill:theme.textColor,paddingLeft:6}}
        xmlSpace="preserve"
        >
        <path
            d="M36.068 20.176l-29-20A1 1 0 1 0 5.5.999v40a1 1 0 0 0 1.568.823l29-20a.999.999 0 0 0 0-1.646z"
        />
        </svg>

    )
}

function RefreshArrowSvg(){
    const theme = useTheme();

    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="305.836px"
            height="305.836px"
            viewBox="0 0 305.836 305.836"
            style={{ width: 21, height: 21, fill: theme.textColor }}
            xmlSpace="preserve"
            >
            <path d="M152.924 300.748c84.319 0 152.912-68.6 152.912-152.918 0-39.476-15.312-77.231-42.346-105.564 0 0 3.938-8.857 8.814-19.783 4.864-10.926-2.138-18.636-15.648-17.228l-79.125 8.289c-13.511 1.411-17.999 11.467-10.021 22.461l46.741 64.393c7.986 10.992 17.834 12.31 22.008 2.937l7.56-16.964c12.172 18.012 18.976 39.329 18.976 61.459 0 60.594-49.288 109.875-109.87 109.875-60.591 0-109.882-49.287-109.882-109.875 0-19.086 4.96-37.878 14.357-54.337 5.891-10.325 2.3-23.467-8.025-29.357-10.328-5.896-23.464-2.3-29.36 8.031C6.923 95.107 0 121.27 0 147.829c0 84.319 68.602 152.919 152.924 152.919z" />
        </svg>
    )
}