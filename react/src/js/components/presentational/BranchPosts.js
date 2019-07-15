import React, { useState,useEffect,useContext,useRef,useCallback } from 'react';
import ReactDOM from 'react-dom';
import { List,WindowScroller,AutoSizer,CellMeasurer,CellMeasurerCache } from 'react-virtualized';
import Measure from 'react-measure'
import {Link} from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroll-component';
import {RefreshContext,PostsContext,BranchPostsContext, UserContext} from "../container/ContextContainer"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import StatusUpdate from "./StatusUpdate"
import {Post} from './SingularPost'
import axios from 'axios'
import axiosRetry from 'axios-retry';

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();


//const cache = [];


function DisplayPosts2({isFeed,posts,setPosts,
    postsContext,resetPostsContext,
    updateFeed,postedId,fetchData,hasMore,
    showPostedTo,activeBranch,refresh}){

    return(
    <ul className="post-list">
        <FilterPosts postsContext={postsContext} refreshFunction={refresh} setPosts={setPosts} 
        resetPostsContext={resetPostsContext}/>
        <StatusUpdate postsContext={postsContext} updateFeed={updateFeed} postedId={postedId} key={postedId}/>
        {posts.length>0?
        <InfiniteScroll
            pullDownToRefresh
            pullDownToRefreshThreshold={300}
            refreshFunction={refresh}
            pullDownToRefreshContent={
                <h3 style={{textAlign: 'center'}}>&#8595; Pull down to refresh</h3>
            }
            releaseToRefreshContent={
                <h3 style={{textAlign: 'center'}}>&#8593; Release to refresh</h3>
            }
            dataLength={posts.length}
            next={fetchData}
            hasMore={hasMore}
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
            <VirtualizedPosts isFeed={isFeed} postsContext={postsContext} activeBranch={activeBranch}
                showPostedTo={showPostedTo} posts={posts}
            />

            {/*posts.map((post,i) => {
                        
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
            */}
        </InfiniteScroll>:
            hasMore?[...Array(8)].map((e, i) => 
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
            ):<p>Nothing seems to be here :/</p>}
    </ul>
    )
}

const cache = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 25,
    defaultHeight: 500 //currently, this is the height the cell sizes to after calling 'toggleHeight'
})

const cache2 = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 25,
    defaultHeight: 500 //currently, this is the height the cell sizes to after calling 'toggleHeight'
})

/*
containerStyle={{
        width: "100%",
        maxWidth: "100%"
    }}
        style={{
        width: "100%"
    }} */

function VirtualizedPosts({isFeed,posts,postsContext,activeBranch,showPostedTo}){
    const ref = useRef(null);
    const cellRef = useRef(null);

    useEffect(()=>{
        console.log("ref",ref)
        if(ref){
            console.log("ref",ref.current)
            ref.current.scrollToRow(isFeed?postsContext.lastVisibleIndex:0);
            //listRef.current.recomputeRowHeights();
        }
    },[ref])

    useEffect(()=>{
        if(ref){
            console.log("recompute",ref.current)
            //ref.current.recomputeRowHeights();
            //listRef.current.recomputeRowHeights();
        }

        if(cellRef){
            console.log("cellRef",cellRef)
        }
    })

    return(
        <WindowScroller>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <AutoSizer 
                disableHeight
                onResize={({ width }) => {
                    if(ref){
                        console.log("resize")
                        cache.clearAll();
                        cache2.clearAll()
                        ref.current.recomputeRowHeights();
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
                deferredMeasurementCache={postsContext.content=='feed'?cache:cache2}
                rowHeight={postsContext.content=='feed'?cache.rowHeight:cache2.rowHeight}
                ref={ref}
                rowRenderer={
                    ({ index, key, style, parent }) =>{
                    console.log("postsContext",postsContext,width)
                    let post = posts[index];
                    let isOpen = postsContext.openPosts.some(id=> id == post.id)
                    let props = {
                        isOpen:isOpen,
                        post:post,
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
                        cache={postsContext.content=='feed'?cache:cache2}
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


export const FinalDisplayPosts = ({postsContext,branch,isFeed,resetPostsContext,activeBranch,postedId,externalId=null})=>{
    const [posts,setPosts] = useState(postsContext.loadedPosts);
    const refreshContext = useContext(RefreshContext);

    console.log("refresh",refreshContext);
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

        let endpoint = isFeed?'feed':'posts'
        let uri = postsContext.next?postsContext.next:buildQuery(`/api/branches/${branch}/${endpoint}`,postsContext.params);

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
            console.log("next",response.data.next)
        }
    };

    useEffect(()=>{
        console.log("postscontext",isFeed,postsContext,resetPostsContext)
        if(isFeed){
            if(postsContext.loadedPosts.length==0 || postsContext.branchUri != branch){
                resetPostsContext(branch);
                setPosts([])
                fetchData();
                postsContext.branchUri = branch;
                cache.clearAll()
            }
            refreshContext.setFeedRefresh(() => ()=>{
                source.cancel('Operation canceled by the user.');
                CancelToken = axios.CancelToken;
                source = CancelToken.source();
                resetPostsContext(branch);
                fetchData();
                setPosts([]);
                cache.clearAll()
            });
        }else{
            setPosts([])
            resetPostsContext();
            fetchData();
            cache2.clearAll()

            refreshContext.setBranchPostsRefresh(() => ()=>{
                source.cancel('Operation canceled by the user.');
                CancelToken = axios.CancelToken;
                source = CancelToken.source();
                resetPostsContext(branch);
                fetchData();
                setPosts([]);
                cache2.clearAll()
            });
        }
    },[branch])

    useEffect(()=>{
        return()=>{
            if(!isFeed){
                resetPostsContext();
            }
        }
    })

    useEffect(()=>{
        refreshContext.page = isFeed?'feed':'branch';
    },[])

    const updateFeed = useCallback(
        (newPosts) => {
            postsContext.loadedPosts = [...newPosts,...postsContext.loadedPosts];
            setPosts(newPosts.concat(posts))
        },
        [posts], // list of params on which the callback should be recreated, this array might also stay blank
    );


    return(
        <DisplayPosts2 isFeed={isFeed} refresh={isFeed?refreshContext.feedRefresh:refreshContext.branchPostsRefresh}
        updateFeed={updateFeed} postedId={postedId} postsContext={postsContext}
        posts={postsContext.loadedPosts} setPosts={setPosts} hasMore={postsContext.hasMore}
        activeBranch={activeBranch} fetchData={fetchData} resetPostsContext={resetPostsContext}
        />
    )
}

export function FeedPosts(props){
    const postsContext = useContext(PostsContext);

    function resetPostsContext(newBranch){
        console.log("reset")
        postsContext.hasMore = true;
        postsContext.next = null;
        postsContext.lastVisibleElement = null;
        postsContext.lastVisibleIndex = 0;
        //postsContext.loadedPosts = [];
        //postsContext.loadedPosts.splice(0,postsContext.loadedPosts.length)
        postsContext.loadedPosts.length = 0;
        postsContext.cachedPosts.length = 0;
        postsContext.openPosts.length = 0;
        postsContext.uniqueCached.length = 0;
        postsContext.branchUri = props.branch;
    }

    return(
        <FinalDisplayPosts {...props} postsContext={postsContext} resetPostsContext={resetPostsContext}/>
    )
}

export function BranchPosts(props){
    const postsContext = useContext(BranchPostsContext);

    function resetPostsContext(){
        postsContext.hasMore = true;
        postsContext.next = null;
        postsContext.loadedPosts = [];
        postsContext.cachedPosts.length = 0;
        postsContext.openPosts.length = 0;
        postsContext.uniqueCached.length = 0;
    }

    return(
        <FinalDisplayPosts {...props} postsContext={postsContext} resetPostsContext={resetPostsContext}/>
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

    console.log("postscontext",postsContext)

    useEffect(()=>{
        context.page = 'feed'
    },[])

    function resetPostsContext(newBranch){
        console.log("reset")
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
            console.log("next",response.data.next)
        }
    };


    useEffect(()=>{
        if(postsContext.loadedPosts.length==0 || postsContext.branchUri != props.branch){
            console.log("innn",postsContext.branchUri , props.branch)
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



function FilterPosts({setPosts,postsContext,resetPostsContext,isFeed,refreshFunction}){
    const userContext = useContext(UserContext);
    //const postsContext = useContext(PostsContext)
    const refreshContext = useContext(RefreshContext);
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
        console.log("params", params , postsContext.params)
        if(!shallowCompare(params , postsContext.params)){
            console.log("same2",shallowCompare(params , postsContext.params))
            resetPostsContext(userContext.currentBranch.uri);
            postsContext.params = params;
            setPosts([]);
            refreshFunction();
        }

        postsContext.params = params;
    },[params])

    return(
        <div className="flex-fill" 
        style={{backgroundColor:'rgb(33, 158, 243)',marginBottom:10,height:50,
        justifyContent:'space-evenly',alignItems:'center'}}>
            <ContentTypeFilter setParams={setParams} params={params} 
            defaultOption={postsContext.params?postsContext.params.content:null}/>
            <AlgorithmFilter setParams={setParams} params={params}
            defaultOption={postsContext.params?postsContext.params.ordering:null}/>
            <TimeFilter setParams={setParams} params={params} 
            defaultOption={postsContext.params?postsContext.params.past:null}/>
            <ActionArrow/>
        </div>
    )
}

function ContextlessFilterPosts({setNewParams}){
    const [params,setParams] = useState(null);

    useEffect(()=>{
        if(params){
            console.log("inparams",params)
            setNewParams(params);
        }
    },[params])

    return(
        <div className="flex-fill" 
        style={{backgroundColor:'rgb(33, 158, 243)',marginBottom:10,height:50,
        justifyContent:'space-evenly',alignItems:'center'}}>
            <ContentTypeFilter setParams={setParams} params={params}/>
            <AlgorithmFilter setParams={setParams} params={params}/>
            <TimeFilter setParams={setParams} params={params}/>
            <ActionArrow/>
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
    console.log(top)
    return {
        top: top,
        left: left
    };
};

function ActionArrow(){
    const context = useContext(RefreshContext);
    const ref = useRef(null);
    const [navigationTopPosition,setNavigationTopPosition] = useState(0);
    const [windowScroll,setWindowScroll] = useState(0);

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
        if(windowScroll<navigationTopPosition + 1){
            console.log(context.refresh)
            context.refresh();
        }else{
            window.scrollTo({ top: navigationTopPosition, behavior: 'smooth' });
        }
    }

    return(
        <div ref={ref} className="filter-action-arrow flex-fill">
            <button className="filter-action-arrow-button" style={{border:0,backgroundColor:'transparent'}} onClick={onClick}>
                {windowScroll<navigationTopPosition + 1 ?<RefreshArrowSvg/>:<TopArrowSvg/>}
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

function DropdownList({options,defaultOption,name,setParams,params,label}){
    const [selected,setSelected] = useState(defaultOption)
    const [isOpen,setOpen] = useState(false);
    const ref = useRef(null);

    function handleClick(e){
        setOpen(!isOpen);
    }

    function handleOutsideClick(e){
        let childNodes = [...ref.current.childNodes]
        if(childNodes.every(c=>{
            return e.target!=c 
        }) && e.target !=ref.current){
            setOpen(false);
        }
    }

    useEffect(()=>{
        setParams({...params,[label]:selected})
    },[selected])

    useEffect(()=>{
        document.addEventListener('click',handleOutsideClick);

        return ()=>{
            document.removeEventListener('click',handleOutsideClick);
        }
    },[])

    return (
        <div className="filter-selector-wrapper">
            <div ref={ref} id={`${name}-filter`} className="flex-fill filter-selector" onClick={handleClick}>
                <span style={{color:'white'}}>{selected.label}</span>
                <DownArrowSvg/>
            </div>
            
            {isOpen?<div className="flex-fill filter-dropdown">
                {options.map(op=>{
                    /*let style = op.value==selected.value?{backgroundColor:'#e2eaf1'}:null
                    return(
                        <span style={{...style}} 
                        onClick={()=>handleSelect(op.value)} 
                        className="filter-dropdown-item">{op.label}</span>
                    )*/
                    return <DropdownItem setSelected={setSelected} selected={selected} option={op}/>
                })}
            </div>:null}
        </div>
    )
}

function DropdownItem({setSelected,selected,option}){
    let style = option.value==selected.value?{backgroundColor:'#e2eaf1'}:null

    return(
        <span style={{...style}} 
        onClick={()=>setSelected(option)} 
        className="filter-dropdown-item">{option.label}</span>
    )
}

function DownArrowSvg(){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 41.999 41.999"
        style={{ enableBackground: "new 0 0 41.999 41.999",
        height:12,width:12,transform: 'rotate(90deg)',fill:'white',paddingLeft:6}}
        xmlSpace="preserve"
        >
        <path
            d="M36.068 20.176l-29-20A1 1 0 1 0 5.5.999v40a1 1 0 0 0 1.568.823l29-20a.999.999 0 0 0 0-1.646z"
        />
        </svg>

    )
}

function TopArrowSvg(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="493.348px"
            height="493.349px"
            viewBox="0 0 493.348 493.349"
            style={{
                enableBackground: "new 0 0 493.348 493.349",
                width: 21,
                height: 21,
                fill:'white'
            }}
            xmlSpace="preserve"
            >
            <path
                d="M354.034 112.488L252.676 2.853C250.771.95 248.487 0 245.82 0c-2.478 0-4.665.95-6.567 2.853l-99.927 109.636c-2.475 3.049-2.952 6.377-1.431 9.994 1.524 3.616 4.283 5.424 8.28 5.424h63.954v356.315c0 2.663.855 4.853 2.57 6.564 1.713 1.707 3.899 2.562 6.567 2.562h54.816c2.669 0 4.859-.855 6.563-2.562 1.711-1.712 2.573-3.901 2.573-6.564V127.907h63.954c3.806 0 6.563-1.809 8.274-5.424 1.53-3.621 1.052-6.949-1.412-9.995z"
            />
        </svg>
    )
}

function RefreshArrowSvg(){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            width="305.836px"
            height="305.836px"
            viewBox="0 0 305.836 305.836"
            style={{ width: 21, height: 21, fill: "white" }}
            xmlSpace="preserve"
            >
            <path d="M152.924 300.748c84.319 0 152.912-68.6 152.912-152.918 0-39.476-15.312-77.231-42.346-105.564 0 0 3.938-8.857 8.814-19.783 4.864-10.926-2.138-18.636-15.648-17.228l-79.125 8.289c-13.511 1.411-17.999 11.467-10.021 22.461l46.741 64.393c7.986 10.992 17.834 12.31 22.008 2.937l7.56-16.964c12.172 18.012 18.976 39.329 18.976 61.459 0 60.594-49.288 109.875-109.87 109.875-60.591 0-109.882-49.287-109.882-109.875 0-19.086 4.96-37.878 14.357-54.337 5.891-10.325 2.3-23.467-8.025-29.357-10.328-5.896-23.464-2.3-29.36 8.031C6.923 95.107 0 121.27 0 147.829c0 84.319 68.602 152.919 152.924 152.919z" />
        </svg>
    )
}
DisplayPosts3.whyDidYouRender = true;