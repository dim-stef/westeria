import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller} from 'react-virtualized';
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
    UserContext
} from "../container/ContextContainer"
import {MobileModal} from "./MobileModal"
import {Modal, ToggleContent} from "./Temporary"
import {SmallBranch} from "./Branch"
import Skeleton, {SkeletonTheme} from 'react-loading-skeleton';
import {Post} from './SingularPost';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import StatusUpdate from "./StatusUpdate";
import {useMediaQuery} from 'react-responsive'

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();

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
}

function resetBranchPostsContext(postsContext,props){
    postsContext.hasMore = true;
    postsContext.next = null;
    postsContext.lastVisibleElement = null;
    postsContext.lastVisibleIndex = 0;
    postsContext.loadedPosts.length = 0;
    postsContext.cachedPosts.length = 0;
    postsContext.openPosts.length = 0;
    postsContext.uniqueCached.length = 0;
    postsContext.branchUri = props.branch;
}

//const cache = [];

function FrontPageList(){
    const userContext = useContext(UserContext);

    return(
        <div className="flex-fill" style={{justifyContent:'space-around',WebkitJustifyContent:'space-around',
        backgroundColor:'#08aeff'}}>
            {userContext.isAuth?
            <NavLink to="/" exact activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Feed
            </NavLink>:null}
            
            {userContext.isAuth?
            <NavLink to="/tree" activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Tree
            </NavLink>:null}

            <NavLink to="/all" activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                All
            </NavLink>
            
        </div>
    )
}

function BranchPageList({branch}){
    const userContext = useContext(UserContext);

    return(
        <div className="flex-fill" style={{justifyContent:'space-around',WebkitJustifyContent:'space-around',
        backgroundColor:'#08aeff'}}>
            <NavLink to={`/${branch.uri}`} exact activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                {branch.name}
            </NavLink>
            
            <NavLink to={`/${branch.uri}/tree`} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Tree
            </NavLink>

            <NavLink to={`/${branch.uri}/community`} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Community
            </NavLink>
        </div>
    )
}

const postList = theme => css({
    flexBasis:'56%',
    width:'100%',
    padding:0,
    listStyle:'none',
    border:`1px solid ${theme.borderColor}`
})

function DisplayPosts({isFeed,posts,setPosts,
    postsContext,resetPostsContext,
    updateFeed,postedId,fetchData,hasMore,
    showPostedTo,activeBranch,refresh}){
    
    const theme = useTheme();
    
    return(
    <ul key={postsContext.branchUri} className="post-list" css={theme=>postList(theme)}>
        {isFeed?<FrontPageList/>:<BranchPageList branch={activeBranch}/>}
        <Pullable
            onRefresh={refresh}
            centerSpinner={false}
            spinnerColor="#2196F3"
            >
        <FilterPosts postsContext={postsContext} refreshFunction={refresh} setPosts={setPosts} 
        resetPostsContext={resetPostsContext} fetchData={fetchData}/>
        <StatusUpdate activeBranch={activeBranch} postsContext={postsContext} updateFeed={updateFeed} 
        postedId={postedId} key={postedId} isFeed={isFeed}/>
        {posts.length>0?
            
        <InfiniteScroll
            
            dataLength={posts.length}
            next={fetchData}
            hasMore={hasMore}
            endMessage={
                <p style={{textAlign: 'center'}}>
                    <b style={{fontSize:'2rem'}}>Nothing more to see</b>
                </p>
            }

            loader={[...Array(3)].map((e, i) => 
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
            )}>
            <VirtualizedPosts isFeed={isFeed} postsContext={postsContext} activeBranch={activeBranch}
                showPostedTo={showPostedTo} posts={posts} setPosts={setPosts}
            />
        </InfiniteScroll>
        :
            hasMore?[...Array(8)].map((e, i) => 
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
            ):<p style={{textAlign:'center'}}>
                <b style={{fontSize:'2rem'}}>Nothing more to see</b>
            </p>}
            </Pullable>
    </ul>
    )
}

const genericCache = {
    fixedWidth: true,
    minHeight: 25,
    defaultHeight: 500 //currently, this is the height the cell sizes to after calling 'toggleHeight'
}

const cache = new CellMeasurerCache(genericCache)
const branchPostsCache = new CellMeasurerCache(genericCache)
const branchTreePostsCache = new CellMeasurerCache(genericCache)
const branchCommunityPostsCache = new CellMeasurerCache(genericCache)
const allPostsCache = new CellMeasurerCache(genericCache)
const treePostsCache = new CellMeasurerCache(genericCache)

function VirtualizedPosts({isFeed,posts,setPosts,postsContext,activeBranch,showPostedTo}){
    const ref = useRef(null);
    const cellRef = useRef(null);
    const [previousWidth,setPreviousWidth] = useState(0);
    let usingCache = cache //default;

    if(postsContext.content=="feed"){
        usingCache = cache;
    }else if(postsContext.content=="all"){
        usingCache = allPostsCache;
    }else if(postsContext.content=="tree"){
        usingCache = treePostsCache
    }else if(postsContext.content=="branch"){
        usingCache = branchPostsCache;
    }else if(postsContext.content=="branch_community"){
        usingCache = branchCommunityPostsCache
    }else if(postsContext.content=="branch_tree"){
        usingCache = branchTreePostsCache
    }

    useEffect(()=>{
        if(ref){
            ref.current.scrollToRow(postsContext.lastVisibleIndex);
            ref.current.scrollToPosition(postsContext.scroll);
        }
    },[ref])

    function onScroll(scroll){
        postsContext.scroll = scroll.scrollTop;
    }

    //let lastVisibleIndex = Math.ceil(postsContext.lastVisibleIndex);
    return(
        <WindowScroller
        onScroll={onScroll}>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <AutoSizer 
                disableHeight
                onResize={({ width }) => {
                    if(ref){
                        if(previousWidth!=0){
                            cache.clearAll();
                            allPostsCache.clearAll();
                            treePostsCache.clearAll();
                            branchPostsCache.clearAll();
                            branchCommunityPostsCache.clearAll();
                            branchTreePostsCache.clearAll();
                            
                            ref.current.recomputeRowHeights();
                        }
                        setPreviousWidth(width);
                    }
                }}>
                { ({ width }) =>
                <List
                autoHeight
                width={width}
                height={height}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                scrollTop={scrollTop}
                rowCount={posts.length}
                deferredMeasurementCache={usingCache}
                rowHeight={usingCache.rowHeight}
                ref={ref}
                rowRenderer={
                    ({ index, key, style, parent }) =>{
                    let post = posts[index];
                    let isOpen = postsContext.openPosts.some(id=> id == post.id)
                    let props = {
                        isOpen:isOpen,
                        post:post,
                        posts:posts,
                        setPosts:setPosts,
                        key:[post.id,post.spreaders,postsContext.content],
                        removeFromEmphasized:null,
                        showPostedTo:showPostedTo?true:false,
                        viewAs:"post",
                        activeBranch:activeBranch,
                        postsContext:postsContext
                        };
                    return(
                        <CellMeasurer
                        ref={cellRef}
                        key={[post.id,post.spreaders,postsContext.content]}
                        cache={usingCache}
                        parent={parent}
                        width={width}
                        columnIndex={0}
                        rowIndex={index}>
                        {({ measure }) => (
                            <div
                            key={key}
                            style={style}
                            >
                                <li><Post {...props} index={index} measure={measure} minimized/></li>
                            </div>
                        )}
                    </CellMeasurer>
                        
                    )
                }}
                />
            
            }</AutoSizer>
        )}
        </WindowScroller>
    )
}

if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}


export const FinalDisplayPosts = ({postsContext,branch,isFeed,keyword,resetPostsContext,activeBranch,postedId,externalId=null})=>{
    const [posts,setPosts] = useState(postsContext.loadedPosts);
    const refreshContext = useContext(RefreshContext);
    const userContext = useContext(UserContext);

    let usingCache = cache //default;

    if(postsContext.content=="feed"){
        usingCache = cache;
    }else if(postsContext.content=="all"){
        usingCache = allPostsCache;
    }else if(postsContext.content=="tree"){
        usingCache = treePostsCache
    }else if(postsContext.content=="branch"){
        usingCache = branchPostsCache;
    }else if(postsContext.content=="branch_community"){
        usingCache = branchCommunityPostsCache
    }else if(postsContext.content=="branch_tree"){
        usingCache = branchTreePostsCache
    }

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

        if(externalId){ // request will return non-array results but posts need to be array
            setPosts([response.data]);
        }

        else{
            postsContext.loadedPosts = [...posts,...response.data.results];
            setPosts([...posts,...response.data.results]);
            //setNext(response.data.next);
            postsContext.next = response.data.next;
        }
    };

    useEffect(()=>{
        if(postsContext.loadedPosts.length==0 || postsContext.branchUri != branch){
            resetPostsContext();
            setPosts([])
            fetchData();
        }
        if(isFeed){
            refreshContext.feedRefresh = () =>{
                source.cancel('Operation canceled by the user.');
                CancelToken = axios.CancelToken;
                source = CancelToken.source();
                resetPostsContext(branch);
                fetchData();
                setPosts([]);
            };
        }else{
            refreshContext.branchPostsRefresh = function(){
                source.cancel('Operation canceled by the user.');
                CancelToken = axios.CancelToken;
                source = CancelToken.source();
                resetPostsContext(branch);
                fetchData();
                setPosts([]);
                //branchPostsCache.clearAll()
            };
        }
    },[branch])


    useEffect(()=>{
        refreshContext.page = isFeed?'feed':'branch';
    },[])

    const refresh = useCallback(()=>{
        usingCache.clearAll();
        source.cancel('Operation canceled by the user.');
        CancelToken = axios.CancelToken;
        source = CancelToken.source();
        resetPostsContext(branch);
        setPosts([]);
        fetchData();
    },[postsContext]);

    const updateFeed = useCallback(
        (newPost) => {
            postsContext.loadedPosts = [newPost,...postsContext.loadedPosts];
            usingCache.clearAll();
            setPosts([newPost,...posts])
        },
        [posts],
    );

    return(
        <DisplayPosts isFeed={isFeed} refresh={refresh}
        updateFeed={updateFeed} postedId={postedId} postsContext={postsContext}
        posts={postsContext.loadedPosts} setPosts={setPosts} hasMore={postsContext.hasMore}
        activeBranch={activeBranch} fetchData={fetchData} resetPostsContext={resetPostsContext}
        />
    )
}


export default function FeedPosts(props){
    const postsContext = useContext(PostsContext);
    const branchPostsContext = useContext(BranchPostsContext);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        resetBranchPostsContext(branchPostsContext,props);
        resetBranchPostsContext(branchCommunityPostsContext,props);
        resetBranchPostsContext(branchTreePostsContext,props);
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
        resetBranchPostsContext(branchPostsContext,props);
        resetBranchPostsContext(branchCommunityPostsContext,props);
        resetBranchPostsContext(branchTreePostsContext,props);
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
        resetBranchPostsContext(branchPostsContext,props);
        resetBranchPostsContext(branchCommunityPostsContext,props);
        resetBranchPostsContext(branchTreePostsContext,props);
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
            resetBranchPostsContext(postsContext,props);
            resetBranchPostsContext(branchCommunityPostsContext,props);
            resetBranchPostsContext(branchTreePostsContext,props);
        }
    },[postsContext.branchUri])

    return(
        <FinalDisplayPosts {...props} postsContext={postsContext} resetPostsContext={()=>resetBranchPostsContext(postsContext,props)}/>
    )
}

export function GenericBranchPosts(props){
    let context = null;

    if(!props.keyword){
        context = BranchPostsContext
    }else if(props.keyword=='community'){
        context = BranchCommunityPostsContext
    }else{
        context = BranchTreePostsContext
    }

    const postsContext = useContext(context);
    const branchCommunityPostsContext = useContext(BranchCommunityPostsContext);
    const branchTreePostsContext = useContext(BranchTreePostsContext);

    useEffect(()=>{
        // If navigate to different branch,reset all posts tabs
        if(postsContext.branchUri != props.branch){
            resetPostListContext(branchPostsContext,props);
            resetPostListContext(branchCommunityPostsContext,props);
            resetPostListContext(branchTreePostsContext,props);
        }
    },[postsContext.branchUri])

    return(
        <FinalDisplayPosts {...props} keyword={props.keyword} postsContext={postsContext}
         resetPostsContext={()=>resetBranchPostsContext(postsContext,props)}/>
    )
}

export const DisplayPosts3 = (props)=>{
    // Using context instead of state in order for the data to be
    // maintained on route change
    const postsContext = useContext(PostsContext);
    const [posts,setPosts] = useState(postsContext.loadedPosts);
    const [showPostedTo,setShowPostedTo] = useState(props.showPostedTo);
    const context = useContext(RefreshContext);
    
    //let CancelToken = axios.CancelToken;
    //let source = CancelToken.source();


    useEffect(()=>{
        context.page = 'feed'
    },[])

    function resetPostsContext(newBranch){
        postsContext.hasMore = true;
        postsContext.next = null;
        postsContext.lastVisibleElement = null;
        postsContext.loadedPosts = [];
        postsContext.branchUri = newBranch;
    }

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

        let uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${props.branch}/feed`,postsContext.params);

        const response = await axios(uri,{
            cancelToken: source.token
          });
        if(!response.data.next){
            postsContext.hasMore = false;
        }
        if(props.externalId){ // request will return non-array results but posts need to be array
            setPosts([response.data]);
        }
        else{
            postsContext.loadedPosts = [...posts,...response.data.results];
            setPosts([...posts,...response.data.results]);
            //setNext(response.data.next);
            postsContext.next = response.data.next;
        }
    };


    useEffect(()=>{
        if(postsContext.loadedPosts.length==0 || postsContext.branchUri != props.branch){
            resetPostsContext(props.branch);
            fetchData();
            postsContext.branchUri = props.branch;
        }

        context.setFeedRefresh(() => ()=>{
            source.cancel('Operation canceled by the user.');
            CancelToken = axios.CancelToken;
            source = CancelToken.source();
            resetPostsContext(props.branch);
            fetchData();
            setPosts([]);
        });
        
    },[props.branch])

    const updateFeed = useCallback(
        (newPosts) => {
            postsContext.loadedPosts = [...newPosts,...postsContext.loadedPosts];
            setPosts(newPosts.concat(posts))
        },
        [posts], // list of params on which the callback should be recreated, this array might also stay blank
    );

    let activeBranch = props.activeBranch
    return(
        <ul className="post-list">
            <FilterPosts setPosts={setPosts} resetPostsContext={resetPostsContext}/>
            <StatusUpdate updateFeed={updateFeed} postedId={props.postedId} key={props.postedId}/>
            {postsContext.loadedPosts.length>0?
            <InfiniteScroll
                pullDownToRefresh
                refreshFunction={context.feedRefresh}
                pullDownToRefreshContent={
                    <h3 style={{textAlign: 'center'}}>&#8595; Pull down to refresh</h3>
                }
                releaseToRefreshContent={
                    <h3 style={{textAlign: 'center'}}>&#8593; Release to refresh</h3>
                }
                dataLength={postsContext.loadedPosts.length}
                next={fetchData}
                hasMore={postsContext.hasMore}
                endMessage={
                    <p style={{textAlign: 'center'}}>
                    <b>Yay! You have seen it all</b>
                    </p>
                }

                loader={[...Array(3)].map((e, i) => 
                <div key={i} style={{width:'100%',marginTop:10}}>
                    <div style={{backgroundColor:'white',padding:'10px'}}>
                        <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                            <Skeleton circle={true} width={48} height={48}/>
                        </SkeletonTheme>
                        <div style={{marginTop:10,lineHeight:'2em'}}>
                            <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                                <Skeleton count={2} width="100%" height={10}/>
                            </SkeletonTheme>

                            <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                                <Skeleton count={1} width="30%" height={10}/>
                            </SkeletonTheme>
                        </div>
                    </div>
                </div>
                )}>
                {postsContext.loadedPosts.map((post,i) => {
                            
                            let props = {
                            post:post,
                            key:[post.id,post.spreaders],
                            removeFromEmphasized:null,
                            showPostedTo:showPostedTo?true:false,
                            viewAs:"post",
                            activeBranch:activeBranch};

                            return <li key={[post.id,post.spreaders]}><Post {...props} minimized/></li>
                        }   
                    )
                }
            </InfiniteScroll>:
                [...Array(8)].map((e, i) => 
                <div key={i} style={{width:'100%',marginTop:10}}>
                    <div style={{backgroundColor:'white',padding:'10px'}}>
                        <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                            <Skeleton circle={true} width={48} height={48}/>
                        </SkeletonTheme>
                        <div style={{marginTop:10,lineHeight:'2em'}}>
                            <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                                <Skeleton count={2} width="100%" height={10}/>
                            </SkeletonTheme>

                            <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                                <Skeleton count={1} width="30%" height={10}/>
                            </SkeletonTheme>
                        </div>
                    </div>
                </div>
                )}
        </ul>
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
        justifyContent:'space-evenly',alignItems:'center'}}>
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
setParams,params,label,changeCurrentBranch,setBranch,preview=true,previewClassName='',children}){
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
      })
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
            /*let childNodes = [...ref.current.childNodes]
            if(childNodes.every(c=>{
                return e.target!=c 
            }) && e.target !=ref.current){
                 
                setOpen(false);
            }*/
            if(!ref.current.contains(e.target)){
                setOpen(false);
            }
        }
    }

    useEffect(()=>{
        if(type=="text"){
            setParams({...params,[label]:selected})
        }else{
            if(changeCurrentBranch){
                userContext.changeCurrentBranch(selected);
            }else{
                setBranch(selected)
            }
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
                <div ref={ref} onClick={e=>handleClick(e,show)} className={previewClassName!=''?previewClassName:'filter-selector-wrapper'}
                css={theme=>previewCss(theme)}>
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
                    style={{backgroundColor:theme.backgroundColor}}>
                        {options.map(op=>{
                            let props = {handleSelect:handleSelect,setSelected:setSelected, selected:selected, option:op}
                            return type=="text"?<DropdownItem {...props}/>:<Component {...props}/>
                        })}
                    </div>:null}
                </div>
            )}
            content={hide => (
            <Modal onClick={handleHide}>
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