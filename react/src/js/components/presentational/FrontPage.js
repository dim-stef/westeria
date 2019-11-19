import React, {useContext, useEffect, useState, useRef, useLayoutEffect} from "react"
import ReactDOM from 'react-dom';
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import {useMediaQuery} from "react-responsive";
import {FollowingBranchesColumnContainer} from "../container/FollowingBranchesContainer";
import MyBranchesColumnContainer from "./MyBranchesColumn";
import {
    AllPostsContext,
    PostsContext,
    TreePostsContext,
    UserActionsContext,
    UserContext,
    TourContext
} from "../container/ContextContainer";
import {TrendingWithWrapper as Trending} from "../container/TrendingContainer";
import {TooltipChain,Tooltip} from "./Tooltip"
import FeedPosts, {AllPosts, TreePosts} from "./BranchPosts"
import {Helmet} from "react-helmet";
import {Link, NavLink, Redirect, Route, Switch,useLocation} from 'react-router-dom'
import {Desktop, Mobile, Tablet} from "./Responsive"

if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render/dist/no-classes-transpile/umd/whyDidYouRender.min.js');
    whyDidYouRender(React);
  }

  
function NonAuthenticationColumn(){
    return(
        <div className="box-border flex-fill" style={{padding:'10px 20px',
        alignItems:'center',WebkitAlignItems:'center',flexFlow:'column',WebkitFlexFlow:'column'}}>
            <Link to="/login" className="login-or-register">Login</Link>
            <span style={{fontSize:'1.4rem',color:'#a4a5b2'}}>or</span>
            <Link to="/register" className="login-or-register">Register</Link>
        </div>
    )
}

const box = theme => css({
    border:`1px solid ${theme.borderColor}`,
    padding:'10px 20px',
})

function FrontPageList(){
    const userContext = useContext(UserContext);
    const tourContext = useContext(TourContext);
    const ref = useRef(null);
    const [top,setTop] = useState(0);
    const [listWidth,setListWidth] = useState(0);
    const isDesktopOrLaptop = useMediaQuery({
        query: '(min-device-width: 1224px)'
    })
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    useLayoutEffect(()=>{
        if(ref.current){
            setTop(ref.current.clientHeight)
            setListWidth(ref.current.clientWidth);
        }
    },[ref.current])

    function onLeave(){
        tourContext.seenFrontPageTip = true;
    }
    // 20 pixels from excess padding
    let width = userContext.isAuth?listWidth/3 - 20:listWidth - 20;

    return(
        <div className="flex-fill" css={{justifyContent:'space-around',backgroundColor:'#08aeff',position:'sticky',
        top:0,zIndex:4}} ref={ref}>
            {userContext.isAuth?
            <NavLink to={{pathname:"/",state:'front'}} exact 
            activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Feed
            </NavLink>:null}
            
            {userContext.isAuth?
            <NavLink to={{pathname:"/tree",state:'front'}} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                Tree
            </NavLink>:null}

            <NavLink to={{pathname:"/all",state:'front'}} activeStyle={{backgroundColor:'#1b83d6'}} className="front-page-list-item flex-fill">
                All
            </NavLink>
            {localStorage.getItem('has_seen_tour')==='false' && !tourContext.seenFrontPageTip?
                userContext.isAuth?
                <TooltipChain delay={12000} onLeave={onLeave}>
                    <Tooltip position={{left:0,top:top}}>
                        <p css={{fontWeight:400,width:isMobile?listWidth-20:width}}>
                        <b>Feed.</b> Your <b>personalized feed</b> based on the branches you follow</p>
                    </Tooltip>
                    <Tooltip position={{left:isMobile?0:listWidth/3,top:top}}>
                        <p css={{fontWeight:400,width:isMobile?listWidth-20:width}}>
                        <b>Tree</b>. A feed made from branches <b>similar</b> to the branches you follow
                        </p>
                    </Tooltip>
                    <Tooltip position={{left:isMobile?0:listWidth/3 * 2,top:top}}>
                        <p css={{fontWeight:400,width:isMobile?listWidth-20:width}}>
                        <b>All</b>. You can see the content from all the branches of Subranch here</p>
                    </Tooltip>
                </TooltipChain>
                :<TooltipChain delay={12000} onLeave={onLeave}>
                <Tooltip position={{left:0,top:top}}>
                        <p css={{fontWeight:400,width:width}}>
                        You can see the content from <b>all</b> the branches of Subranch here</p>
                </Tooltip>
                <Tooltip position={{left:0,top:top}}>
                        <p css={{fontWeight:400,width:width}}>
                        <Link to="/login" style={{color:'white'}}>Login</Link>{' '}
                        or <Link to="/register" style={{color:'white'}}>register</Link>{' '}
                        to access your personal <b>Feed</b> and <b>Tree!</b></p>
                </Tooltip>
            </TooltipChain>:null}
        </div>
    )
}

export function FrontPageLeftBar(){
    const [show,setShow] = useState(true);
    const userContext = useContext(UserContext);

    return(
        <div style={{ flexBasis:'22%',WebkitFlexBasis:'22%', height:'max-content'}}>
            <div>
            {userContext.isAuth?
                <>
                <div css={theme=>box(theme)}>
                    <div className="flex-fill" style={{alignItems:'baseline',WebkitAlignItems:'baseline'}}>

                        {/*<h1>My branches</h1>*/}
                        <img src="https://sb-static.s3.eu-west-2.amazonaws.com/static/logo_full.png"/>
                        <button role="button" onClick={()=>setShow(!show)} style={{
                            border:0,
                            color:'#1DA1F2',
                            fontSize:'1.3rem',
                            marginLeft:10,
                            marginTop:3,
                            backgroundColor:'transparent'
                        }}>{show?"hide":"show"}</button>
                    </div>
                    <MyBranchesColumnContainer show={show}/>
                </div>
                <div style={{marginTop:10}}>
                    <FollowingBranches/>
                </div>
                </>:
                <NonAuthenticationColumn/>}
                
            </div>
        </div>
    )
}

export function FollowingBranches(){
    return(
        <div style={{height:'max-content'}}>
            <div css={theme=>box(theme)}>
            <p style={{
                    fontSize: "1.6em",
                    fontWeight: 600,
                    paddingBottom: 5,
                    margin: "-10px -20px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "10px 20px",
                    marginBottom:10
                }}>Following</p>
                <FollowingBranchesColumnContainer/>
            </div>
        </div>
    )
}

const postList = (theme,isMobile) => css({
    flexBasis:isMobile?'100%':'56%',
    width:'100%',
    padding:0,
    listStyle:'none',
    border:`1px solid ${theme.borderColor}`
})


export const FrontPage = React.memo(function FrontPage(props){
    const actionContext = useContext(UserActionsContext);
    const userContext = useContext(UserContext);
     

    useEffect(()=>{
        actionContext.lastPostListType = 'front'
    },[])

    return(
        <>
            <Desktop>
                <FrontPageLeftBar/>
                <FrontPagePostList/> 
                <Trending/>
            </Desktop>

            <Tablet>
                <FrontPagePostList/> 
            </Tablet>

            <Mobile>
                <FrontPagePostList/>       
            </Mobile>
        </>
    )
})

const FrontPagePostList = React.memo(function FrontPagePostList({page}){
    const userContext = useContext(UserContext);
    const isMobile = useMediaQuery({
        query:'(max-device-width: 767px)'
    })

    return(
        <div className="post-list" css={theme=>postList(theme,isMobile)}>
            {/*<FrontPageList/>*/}
            <Switch>
                <Route exact path="/" render={
                    () => userContext.isAuth?<FrontPageFeed />:
                    <FrontPageAllPosts/>
                }/>
                <Route exact path="/all" render={()=> <FrontPageAllPosts/>}/>
                <Route exact path="/tree" render={()=> userContext.isAuth?
                <FrontPageTreePosts/>:<Redirect to="/login"/>}/>
            </Switch>
        </div>
    )
})

FrontPagePostList.whyDidYouRender = true


export const FrontPageFeed = React.memo(function FrontPageFeed(props){
    const context = useContext(UserContext);
    const postsContext = useContext(PostsContext);
    const [uri,setUri] = useState('initialUri')
    const branch = context.currentBranch.uri;
    const [params,setParams] = useState(null);

    useEffect(()=>{
        return ()=>{
            let lastVisibleElements = document.querySelectorAll('[data-visible="true"]');
            postsContext.lastVisibleElement = lastVisibleElements[0];
            let indexes = [];
            for(let el of lastVisibleElements){
                indexes.push(el.dataset.index)
            }
            let middle = indexes[Math.floor(indexes.length / 2)];
            postsContext.lastVisibleIndex = indexes.length>0?middle:0;
        }
    },[])

    if(context.isAuth){
        return(
            <>
            <Helmet>
                <title>Home - Subranch</title>
                <meta name="description" content="Your personal feed created from the communities you follow." />
                <link rel="canonical" href="https://subranch.com"/>
            </Helmet>
            <FeedPosts uri={uri} setUri={setUri} activeBranch={context.currentBranch}
            postedId={context.currentBranch.id} usePostsContext showPostedTo 
            branch={branch} params={params} setParams={setParams} isFeed
            />
            </>
        )
    }else{
        return null
    }
})

export const FrontPageAllPosts = React.memo(function FrontPageAllPosts(props){
    const context = useContext(UserContext);
    const postsContext = useContext(AllPostsContext);
    const [uri,setUri] = useState('initialUri')
    const branch = context.isAuth?context.currentBranch.uri:null;
    const [params,setParams] = useState(null);

    useEffect(()=>{
        return ()=>{
            let lastVisibleElements = document.querySelectorAll('[data-visible="true"]');
            postsContext.lastVisibleElement = lastVisibleElements[0];
            postsContext.lastVisibleIndex = lastVisibleElements[0]?lastVisibleElements[0].dataset.index:0;
        }
    },[])


    return(
        <>
        <Helmet>
            <title>Subranch</title>
            <meta name="description" content="Browse all the leaves created 
            by the subranch community."/>
            <link rel="canonical" href="https://subranch.com"/>
        </Helmet>
        <AllPosts uri={uri} setUri={setUri} activeBranch={context.currentBranch}
        postedId={context.isAuth?context.currentBranch.id:null} usePostsContext showPostedTo 
        branch={branch} params={params} setParams={setParams} isFeed
        />
        </>
    )
})

export const FrontPageTreePosts = React.memo(function FrontPageTreePosts(props){
    const context = useContext(UserContext);
    const postsContext = useContext(TreePostsContext);
    const [uri,setUri] = useState('initialUri')
    const branch = context.isAuth?context.currentBranch.uri:null;
    const [params,setParams] = useState(null);

    useEffect(()=>{
        return ()=>{
            let lastVisibleElements = document.querySelectorAll('[data-visible="true"]');
            postsContext.lastVisibleElement = lastVisibleElements[0];
            postsContext.lastVisibleIndex = lastVisibleElements[0]?lastVisibleElements[0].dataset.index:0;
        }
    },[])


    return(
        <>
        <Helmet>
            <title>Tree - Subranch</title>
            <meta name="description" content="Browse all the leaves created 
            by the subranch community." />
            <link rel="canonical" href="https://subranch.com/tree"/>

        </Helmet>
        <TreePosts uri={uri} setUri={setUri} activeBranch={context.currentBranch}
        postedId={context.isAuth?context.currentBranch.id:null} usePostsContext showPostedTo 
        branch={branch} params={params} setParams={setParams} isFeed
        />
        </>
    )
})