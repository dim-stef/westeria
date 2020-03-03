import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Link, withRouter} from 'react-router-dom'
import { useTheme as useEmotionTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import {useTransition,animated} from "react-spring/web.cjs"
import history from "../../history"
import {Helmet} from 'react-helmet'
import MoonLoader from 'react-spinners/MoonLoader';
import Linkify from 'linkifyjs/react';
import {
    AllPostsContext,
    BranchPostsContext,
    PostsContext,
    TreePostsContext,
    UserContext
} from '../container/ContextContainer'
//const StatusUpdate = lazy(() => import('./StatusUpdate'));
import StatusUpdate from "./StatusUpdate";
import {FollowButton, SmallCard} from "./Card"
import {ToggleContent} from './Temporary'
import {ReplyTree} from './Comments'
import RoutedHeadline from './RoutedHeadline'
import {SmallBranch,BubbleBranch} from "./Branch"
import {useInView} from 'react-intersection-observer'
import {Images} from './PostImageGallery'
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import {DropdownActionList} from "./DropdownActionList"
import {InfoMessage} from "./InfoMessage"
import {Path} from "./LeafPath"
import {Modal} from "./Temporary"
import {Star,Dislike,useReactActions} from "./PostActions";
import { CommentsSvg,ReplySvg,PlusSvg,CloseSvg } from "./Svgs";


const copy = require('clipboard-copy')

const buttonWrapper = (theme,height)=>({display:'flex',justifyContent:'center',
    alignItems:'center',borderRadius:100,padding:'10px 15px',
    backgroundColor:theme.postFloatingButtonColor,cursor:'pointer',height:height,boxSizing:'border-box',
    boxShadow:theme.postFloatingButtonShadow,position:'relative',overflow:'hidden',
    '@media (max-device-width:767px)':{
        padding:'10px 13px',
    }
})

const pathFill = (fillColor, strokeColor,fillHover,strokeHover,clickedColor)=> css({
    fill:clickedColor||fillColor,
    stroke:strokeColor,
    '&:hover': {
        fill:fillHover,
        stroke:strokeHover
    }
})

const number = (themeColor,hightlighted)=> css({
   color:hightlighted||themeColor
})

function getPostedTo(post,activeBranch,context){
    if(!context.isAuth){
        return post.posted_to.find(b=>{
            return post.poster!==b.uri;
        })
    }
    else{
        return authorizedGetPostedTo(post,activeBranch,context);
    }
}

function authorizedGetPostedTo(post,activeBranch,context){
    var intersection = post.posted_to.find(b=>{
        // if user follows branch and is not current active branch
        return context.currentFollowing.some(branch=>branch.uri==b.uri) && b.uri!==context.currentBranch.uri
        && b.uri!==activeBranch.uri && b.uri!==post.poster;
    })

    if(intersection){
        return intersection;
    }else{
        return post.posted_to.find(b=>{
            return b.uri!==post.poster && b.uri!==activeBranch.uri
        })
    }
}

export function PostContainer(props){
    const [post,setPost] = useState(null);
    const [loaded,setLoaded] = useState(false);

    async function getPost(){
        let uri = `/api/post/${props.postId}/`;
        let response = await axios.get(uri);
        let data = await response.data
        setState(true);
        setPost(data);
    }

    useEffect(()=>{
        getPost();
    },[])

    return(
        post?<Post {...props} post={post}/>:loaded?<p>This leaf was deleted.</p>:null
    )
}

export function SingularPost({postId,wholePost=null,parentPost=null,postsContext,activeBranch,lastComment,noStyle=false,
    noRoutedHeadline=false,loadComments=true}){

    const [post,setPost] = useState(wholePost);
    const [loaded,setLoaded] = useState(false);
    const [replyTrees,setReplyTrees] = useState([]);
    const [userReplies,setUserReplies] = useState([]);
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


        postsContext.cachedPosts = [...postsContext.cachedPosts,...response.data.results];
        postsContext.loadedPosts = [...postsContext.loadedPosts,...response.data.results];
        setReplyTrees([...replyTrees,...response.data.results]);
    }

    async function getPost(){
        let uri = `/api/post/${postId}/`;
        try{
            let response = await axios.get(uri);
            let data = await response.data
            if(loadComments){
                fetchData(data)
            }
            setPost(data);
            setLoaded(true);
        }catch(e){
            setLoaded(true);
        }
    }

    // fetch post if its not given
    // in case comment load is delayed listen to "loadComments"
    // then fetch comments
    useEffect(()=>{
        if(!post){
            getPost();
        }else{
            if(loadComments){
                fetchData(post)
            }
        }
    },[loadComments])

    const updateTree = useCallback(newPost=>{
        setUserReplies([newPost,...userReplies])
    },[replyTrees])

    const measure = () =>{
        return;
    }

    let title = 'Westeria';
    let description = '';
    let maxLength=100;
    let trancuation = ''

    if(post){
        let endOfText = post.text.length > maxLength ? maxLength : post.text.length
        trancuation =  post.text.length > maxLength ? '...':'';
        if(post.text){
            title = post.poster_name + ' ' + post.text.substring(0,endOfText)+ trancuation + ' - Westeria';
            description = `${post.poster_name} @(${post.poster_uri}) on Westeria: ${post.description}`;
        }
    }
    
    return (
        post?
        <div css={theme=>(noStyle?null:{boxShadow:'0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',borderRadius:15,
        backgroundColor:theme.backgroundLightColor,
        '@media (max-device-width: 1226px)':{boxShadow:'none',borderRadius:0}})}>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description}></meta>
                <link rel="canonical" href={`${window.location.origin}/${post.poster || post.poster.uri}/leaves/${post.id}`}></link>
            </Helmet>
            {noRoutedHeadline?null:<RoutedHeadline/>}
            <Post post={post} parentPost={parentPost} postsContext={postsContext}
                index={0} activeBranch={activeBranch} lastComment={lastComment} measure={measure}
                viewAs="post" isStatusUpdateActive updateTree={updateTree} isSingular
            />
            <div>
                {userReplies.map((rt,i)=>{
                    return <React.Fragment key={i}><ReplyTree topPost={post} parentPost={post} currentPost={rt} 
                    postsContext={postsContext} activeBranch={activeBranch}
                    isStatusUpdateActive={false} isSingular
                    /></React.Fragment>
                })}
                <InfiniteScroll
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
                    {replyTrees.map((rt,i)=>{
                         
                        return <React.Fragment key={i}><ReplyTree topPost={post} parentPost={post} currentPost={rt} 
                        postsContext={postsContext} activeBranch={activeBranch}
                        isStatusUpdateActive={false}
                        /></React.Fragment>
                    })}
                </InfiniteScroll>
            </div>
        </div>:loaded?<p style={{textAlign: 'center'}}>
            <b style={{fontSize:'2rem'}}>This leaf was deleted</b>
        </p>:<div className="flex-fill load-spinner-wrapper">
            <MoonLoader
                sizeUnit={"px"}
                size={20}
                color={'#123abc'}
                loading={true}
            />
        </div>
        
    )
}

export const Post = React.memo(function Post({post,parentPost=null,down=0,
    measure=()=>{},postsContext,posts,setPosts,index,activeBranch,lastComment,
    viewAs="post",isSingular,movement,minimal=false,updateTree=()=>{}}){

    minimal = viewAs=="embeddedPost"?true:minimal
    const [ref, inView] = useInView({
        threshold: 0,
    })

    useEffect(()=>{
        if(viewAs=="embeddedPost"){
            let inCache = postsContext.uniqueCached.some(ar=>{
                // If post is from notifications parentPost doesnt exist
                // needs fix
                if(ar.post && parentPost){
                    return ar.post.id == parentPost.id && ar.embeddedPost!=undefined && ar.embeddedPost.id == post.id
                }
            });
            if(!inCache && parentPost){
                // If post is from notifications it gets pushed in context indefinetely
                // needs fix
                 
                measure();
                postsContext.uniqueCached.push({
                    post:parentPost,
                    embeddedPost:post
                });
            }
        }else{
            let inCache = postsContext.uniqueCached.some(bundle=>{
                if(bundle.post){
                    return bundle.post.id == post.id && bundle.embeddedPost == undefined
                }
            })

            if(!inCache){
                measure();
                postsContext.uniqueCached.push({
                    post:post,
                });
            }
        }
    },[])

    if(!post.posted_to.find(b=>post.poster==b.uri)){
        // if component lands here then a critical error occured on server
        // return null to prevent page crash
        return null
    }

    return(
        <StyledPostWrapper viewAs={viewAs} post={post} isSingular={isSingular} down={down} movement={movement}>
            <div ref={ref} data-visible={inView} key={post.id} data-index={index?index:0}>
                <StyledPost post={post} viewAs={viewAs} lastComment={lastComment} 
                cls="main-post" posts={posts} setPosts={setPosts}
                showPostedTo activeBranch={activeBranch} down={down}
                open={open} measure={measure} postsContext={postsContext}
                isSingular={isSingular} updateTree={updateTree} minimal={minimal}
                />
            </div>
        </StyledPostWrapper>
    )
},(prevProps,nextProps)=>{

    return prevProps.post.id == nextProps.post.id && 
    ((!prevProps.activeBranch || !nextProps.activeBranch) || prevProps.activeBranch.uri == nextProps.activeBranch.uri)
})

function StyledPostWrapper({post,down,viewAs,index,isSingular,movement,children}){
    if(viewAs=="reply" || isSingular){
        return(
            <div id={post.id}>
                {children}
            </div>
        )
    }else{
        return(
            <LinkedPostWithRouter to={`/${post.poster}/leaves/${post.id}/`} dataIndex={index} id={post.id} down={down}
            movement={movement}>
                {children}
            </LinkedPostWithRouter>
        )
    }
}

function LinkedPost({history,dataIndex,down=null,id,to,movement,children}){

    const ref = useRef(null);

    function handleClick(e){
        if((down == null || down == 0 || down==ref.current.getBoundingClientRect().y) && 
        (movement?Math.abs(movement.current) < 5:true)){
            history.push(to);
        }
    }

    return(
        <div className="preview-post" onClick={handleClick} data-index={dataIndex} id={id} ref={ref}>
            {children}
        </div>
    )
}

const LinkedPostWithRouter = withRouter(LinkedPost)

if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

function ShownBranch({branch,date,minimal,dimensions=48}){
    const theme = useEmotionTheme();
    let dateElement=null;

    if(date){
        dateElement = timeDifference(date,new Date());
    }

    function handleAnchorClick(e){
        e.stopPropagation()
    }

    return(
        
        <div css={{display:'flex',alignItems:'center',position:'relative'}} >
            <SmallCard branch={branch}>
                <div css={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <PostPicture picture={branch.branch_image} 
                    style={{width:dimensions,height:dimensions}}
                    uri={branch.uri}/>
                    <div css={{display:'flex',flexFlow:'column'}}>
                        <Link to={`/${branch.uri}`} onClick={handleAnchorClick} 
                        style={{textDecoration:'none', color:theme.textHarshColor,marginRight:3}}>
                            <strong css={{fontSize:minimal?'1.2rem':'1.4rem',
                            maxWidth:150,textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap',
                            '@media (max-device-width:767px)':{
                                maxWidth:55
                            }}}>{branch.name}</strong>
                        </Link>
                        {date?<div css={theme=>({padding:'3px 0px',color:theme.textLightColor,fontWeight:600})}>
                            {dateElement}
                        </div> :null}
                    </div>
                </div>
            </SmallCard>
        </div>
    )
}

const postCss = (theme,isEmbedded,extraStyles) => css({
    padding:10,
    transition:'opacity 0.1s ease-in-out',
    position:'relative',
    overflow:'hidden',
    ...extraStyles
})

function is_touch_device() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function(query) {
      return window.matchMedia(query).matches;
    }
  
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
      return true;
    }
  
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}

function StyledPost({post,posts,setPosts,postsContext,showPostedTo,
    activeBranch,updateTree,measure,viewAs,isSingular,className,minimal,children}){

    const context = useContext(UserContext);
    const theme = useEmotionTheme();

    let initSelfSpread = post.spreaders.find(s=>{
        if(context.isAuth && s.branch){
            return s.branch.uri===context.currentBranch.uri
        }
    })

    const [selfSpread,setSelfSpread] = useState(initSelfSpread)

    let isOpen = postsContext.openPosts.some(p=>{
        return p==post.id
    })
    const autoFocus = post.level==0?false:true;
    let mainPostedBranch = getPostedTo(post,activeBranch,context);

    const [isStatusUpdateActive,setStatusUpdateActive] = useState((isOpen && viewAs=="post" || isSingular) && !minimal);
    const ref = useRef(null);

    let isEmbedded = viewAs=="embeddedPost" ? true : false;
    let borderBottom = viewAs=="post" || isEmbedded ? `1px solid ${theme.borderColor}` : borderBottom;
    borderBottom = viewAs=="reply" || minimal && !isEmbedded ? 'none' : borderBottom
    let border = isEmbedded ? `1px solid ${theme.borderColor}` : 'none';
    let borderRadius = isEmbedded ? '10px' : '0';
    let marginTop = isEmbedded ? '10px' : '0';

    function handleReplyClick(){

        //if its top level post always display status bar
        if(post.level===0){
            setStatusUpdateActive(true);
        }
        else{
            setStatusUpdateActive(!isStatusUpdateActive);
        }
    }

    function onSpread(id,times){
        let newSpreader = {branch:context.currentBranch,id:id,times:times}
        post.spreads_count++;
        if(!post.spreaders.some(sp=>{
            return sp.branch.uri == context.currentBranch.uri
        })){
            post.spreaders.push(newSpreader);
        }

        setSelfSpread(newSpreader);
    }

    const mounted = useRef();
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
        } else {
            // componentDidUpdate logic here
            measure();
        }
    },[selfSpread]);

    let desktopStyles = {
        '&:hover': {
            backgroundColor:isEmbedded?theme.embeddedHoverColor:null
        }
    }

    let extraStyles = is_touch_device()?{}:desktopStyles
    const editorRef = useRef(null);
    const animatedRef = useRef(null);
    const editorHeight = 101;

    let timeout = null;

    // hacky way of resetting height back to auto after animation incoming
    // sorry :)
    function setAutoHeight(){
        if(animatedRef.current){
            animatedRef.current.style.height = 'auto'
            animatedRef.current.style.overflow = 'auto'
        }
    }

    function startInterval(){
        timeout = setInterval(setAutoHeight, 1000)
    }

    useEffect(()=>{
        return()=>{
            clearInterval(timeout);
        }
    },[])

    const transitions = useTransition(isStatusUpdateActive, null, {
        from: { height: 0 },
        enter: { height: editorHeight },
        leave: { height: 0 },
        onFrame:()=>{
            clearInterval(timeout)
        },
        onRest:()=>{
            if(animatedRef.current){
                startInterval();
                setTimeout(()=>animatedRef.current.style.height = 'auto',1000)    
            }
        },
        config:{
            duration:150,
            easing: t => t*(2-t)
        },
    })

    let date = new Date(post.created.replace(' ', 'T'));

    return(
        <>
        <div className={className}>
            <div ref={ref} css={theme=>postCss(theme,isEmbedded,extraStyles)} className={`post`}
            style={{display:'block',border:border,borderBottom:borderBottom,borderRadius:borderRadius,marginTop:marginTop}} >
            
                {post.spreaders.length>0 && !isEmbedded && context.isAuth?
                <TopSpreadList spreaders={post.spreaders} selfSpread={selfSpread}/>
                :null}
                {/*viewAs=='post' && !minimal?
                <Path from={post.matches.from} to={post.matches.to || post.posted_to[0].uri} id={post.id} postsContext={postsContext}/>:
                null*/} 
                <div className="flex-fill">
                    <div className="flex-fill associated-branches" css={{flexFlow:'row !important',overflow:'auto'}} 
                    style={{fontSize:viewAs=='reply'?'0.7rem':null}}>
                        <PostedTo post={post} mainPostedBranch={mainPostedBranch} minimal={minimal}
                        activeBranch={activeBranch} showPostedTo={showPostedTo} dimensions={viewAs=='reply' || minimal?24:36}
                        measure={measure} minimal={minimal}
                        />
                        <ShownBranch date={!mainPostedBranch || post.type=='reply'?date:null} 
                        branch={post.posted_to.find(b=>post.poster==b.uri)} minimal={minimal}
                        post={post} dimensions={viewAs=='reply' || minimal?24:36}/>
                    </div>
                    <More post={post} posts={posts} setPosts={setPosts}/>
                    </div>
                    <div style={{marginTop:10}}>
                        <PostBody post={post} embeddedPostData={post.replied_to} activeBranch={activeBranch} isEmbedded={isEmbedded}
                        text={post.text} postsContext={postsContext} images={post.images} videos={post.videos} 
                        measure={measure} postRef={ref} viewAs={viewAs}/>
                        {!minimal?
                            <PostActions post={post} handleReplyClick={handleReplyClick} isSingular={isSingular}
                            handleSpread={onSpread} selfSpread={selfSpread} postsContext={postsContext}/>
                        :null}
                    </div>
            </div>
        </div>
        {
            transitions.map(({ item, key, props }) =>
            item && <animated.div key={key} ref={animatedRef} style={props} css={{overflow:'hidden',height:'auto'}}>
            <div ref={editorRef} style={{height:'auto'}}>
                <StatusUpdate replyTo={post.id} postsContext={postsContext} currentPost={post} updateFeed={updateTree}
                    activeBranch={activeBranch} autoFocus={autoFocus}
                />
            </div>
            </animated.div>
            )
        }
        </>
    )
}

const postedToExtensionContainer = theme =>css({
    backgroundColor:theme.backgroundLightColor,
    boxSizing:'border-box',
    borderRadius:25,
    padding:'15px 20px',
    '@media (max-width: 767px)':{
        width:'90%'
    }
})

function PostedToExtension({post,activeBranch,mainPostedBranch,minimal}){
    
    const userContext = useContext(UserContext);
    const [branches,setBranches] = useState([]);
    const [open,setOpen] = useState(false);

    function branchesToDisplay(){
        return post.posted_to.filter(b =>{
            return b.uri !== mainPostedBranch.uri && b.uri!==post.poster && b.uri!==activeBranch.uri;
        });
    }

    function nonAuthBranchesToDisplay(){
        return post.posted_to.filter(b=>{
            return b.uri !== mainPostedBranch.uri && b.uri!==post.poster
        })
    }

    useEffect(()=>{        
        if(userContext.isAuth){
            setBranches(branchesToDisplay())
        }else{
            setBranches(nonAuthBranchesToDisplay())
        }
    },[post])

    return(
        <ToggleContent 
        toggle={show=>(
            branches.length>0?
            <div 
            css={theme=>({backgroundColor:theme.backgroundDarkColor,borderRadius:50,
            marginLeft:5,display:'flex',justifyContent:'center',cursor:'pointer',height:'fit-content'})}
            onClick={e=>{e.stopPropagation();show();setOpen(true);}}>
                <span css={theme=>({fontSize:'1.5em',display:'flex',alignItems:'center',
                padding:'4px 5px',color:theme.textLightColor})}>+{branches.length}</span>
            </div>
            :null
        )}
        content={hide => (
        <Modal isOpen={open} hide={hide} onClick={e=>{e.stopPropagation();setOpen(false);}}>
        <div css={{position:'fixed',height:'100vh',width:'100vw',display:'flex',
                justifyContent:'center',alignItems:'center'}}>
                <div css={postedToExtensionContainer} onClick={e=>e.stopPropagation()}>
                    <h1 css={theme=>({color:theme.textColor})}>This leaf was also posted on these Branches</h1>
                    <div css={{height:'100%',overflow:'auto',display:'flex',flexFlow:'row wrap',
                    justifyContent:'center'}}>
                        {branches.map(b=>{
                            return <div key={b.id} onClick={()=>history.push(`/${b.uri}`)}>
                                <BubbleBranch branch={b}>
                                    <FollowButton branch={b}/>
                                </BubbleBranch>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </Modal>    
        )}/>
    )
}


function PostedTo({post,activeBranch=null,mainPostedBranch=null,dimensions=48,measure,minimal}){
    let date = new Date(post.created.replace(' ', 'T'));

    return(
        mainPostedBranch && post.type!=="reply"?
            <div className="flex-fill" css={{alignItems:'center'}}>
                <div>
                    <div className="flex-fill" css={{alignItems:'center'}}>
                        <ShownBranch date={date} branch={mainPostedBranch} dimensions={dimensions} minimal={minimal}/>
                        <PostedToExtension post={post} activeBranch={activeBranch} 
                        mainPostedBranch={mainPostedBranch} measure={measure} minimal={minimal}/>
                    </div>
                </div>
                <div className="arrow-right" css={{margin:'0 5px',transform:'rotate(180deg)'}}></div>
            </div>
        :null
    )
}


function PostBody({post,text, images,postsContext , videos, postRef,measure, activeBranch, 
    embeddedPostData=null, isEmbedded=false,viewAs}){
    const [imageWidth,setImageWidth] = useState(0);
    const [embeddedPost,setEmbeddedPost] = useState(null);

    useEffect(()=>{
        if(!postRef){
            return;
        }

        // !isEmbedded to prevent embedded recursion
        if(embeddedPostData && !isEmbedded && viewAs=="post"){
            getEmbeddedPost(embeddedPostData.uri,embeddedPostData.id)
        }

        setImageWidth(postRef.current.clientWidth);
        window.addEventListener("resize", resizeListener);

        return(()=>{
            window.removeEventListener("resize", resizeListener);
        })
    },[])

    async function getEmbeddedPost(branch,postId){
        let response = await axios.get(`/api/branches/${branch}/posts/${postId}`);
        let data = await response.data;
        setEmbeddedPost(data);
    }

    function resizeListener(){
        setImageWidth(postRef.current.clientWidth);
    }

    return(
        <div>
            {text?<Linkify><p className="post-text">{text}</p></Linkify>:null}
            {images.length>0 || videos.length>0?<Images images={images} measure={measure} 
            videos={videos} imageWidth={imageWidth} viewAs={viewAs}/>:null}
            {embeddedPost? <Post post={embeddedPost} parentPost={post} postsContext={postsContext} 
            measure={measure} activeBranch={activeBranch} 
            lastComment={false} viewAs="embeddedPost"></Post>:null}
        </div>
    )
}

Number.prototype.roundTo = function(num) {
    var resto = this%num;
    if (resto <= (num/4)) { 
        return this+resto;
    } else {
        return this+num-resto;
    }
}


function PostPicture(props){
    function handleAnchorClick(e){
         
        e.stopPropagation()
    }

    return(
        <Link to={`/${props.uri}`} onClick={handleAnchorClick} 
        className="noselect" style={{marginRight:5}}>
            <img src={props.picture} className="post-profile-picture round-picture" 
            style={props.style?{...props.style}:null}/>
        </Link>
    )
}

function PostActions({post,handleReplyClick,isSingular}){

    const postsContext = useContext(PostsContext);
    const allPostsContext = useContext(AllPostsContext);
    const treePostsContext = useContext(TreePostsContext);
    const branchPostsContext = useContext(BranchPostsContext);
    const buttonRef = useRef(null);
    const [buttonHeight,setHeight] = useState(0);
    const starFuncRef = useRef(null);
    const dislikeFuncRef = useRef(null)

    const [react,starCount,dislikeCount,isDisabled,changeReact,createOrDeleteReact] = useReactActions(post);

    const starHeight = dislikeCount + starCount==0? 0 : (starCount / (dislikeCount+starCount))*100
    const dislikeHeight = dislikeCount + starCount==0? 0 : (dislikeCount / (dislikeCount+starCount))*100

    function updatePostsContext(postsContext){
        postsContext.loadedPosts.forEach(p=>{
            if(p.id==post.id){
                p.stars = starCount;
                p.dislikes = dislikeCount;
            }
        })
    }

    useEffect(()=>{

        // sync react count with cached posts
        // NEEDS FIX
        updatePostsContext(postsContext);
        updatePostsContext(allPostsContext);
        updatePostsContext(treePostsContext);
        updatePostsContext(branchPostsContext);
    },[starCount,dislikeCount])

    useLayoutEffect(()=>{
        if(buttonRef.current){
            setHeight(buttonRef.current.clientWidth)
        }
    },[buttonRef])

    function handleStarClick(){
        starFuncRef.current();
    }

    function handleDislikeClick(){
        dislikeFuncRef.current();
    }

    return(
        <div className="flex-fill post-actions" style={{height:'auto',marginTop:0,width:'max-content'}}>
            <div className="flex-fill" css={{flexFlow:'column',width:'100%'}}>
                <div className="flex-fill" css={{alignItems:'center',justifyContent:'space-evenly'}}>
                    <div ref={buttonRef} onClick={handleReplyClick}
                    style={{marginRight:20}} css={theme=>buttonWrapper(theme,buttonHeight)}>
                        {isSingular?
                        <div css={{display:'flex',alignItems:'center'}}>
                            <CommentsSvg css={theme=>({height:24,width:24,fill:theme.textHarshColor})}/>
                            <span css={{marginLeft:5,fontSize:'1.2rem'}}>{post.replies_count}</span>
                        </div>:
                        <ReplySvg css={theme=>({height:10,width:10,fill:theme.textHarshColor})}/>
                        }                        
                        
                    </div>
                    <div ref={buttonRef} style={{marginRight:10}} 
                    css={theme=>buttonWrapper(theme,buttonHeight)} onClick={handleStarClick}>
                        <div css={theme=>({height:`${starHeight}%`,transition:'height 0.2s',opacity:react?1:0.4,
                        position:'absolute',bottom:0,left:0,backgroundColor:react?'#ff3333':theme.textLightColor,width:'100%'})}></div>
                        <Star post={post} react={react} changeReact={changeReact} size={isSingular?15:10}
                        createOrDeleteReact={createOrDeleteReact} isDisabled={isDisabled} starClickRef={starFuncRef}/>
                    </div>
                    <div css={theme=>buttonWrapper(theme,buttonHeight)} style={{marginRight:10}}
                    onClick={handleDislikeClick}>
                        <div css={theme=>({height:`${dislikeHeight}%`,transition:'height 0.2s',opacity:react?1:0.4,
                        position:'absolute',bottom:0,left:0,backgroundColor:react?'#3333ff':theme.textLightColor,width:'100%'})}></div>
                        <Dislike post={post} react={react} changeReact={changeReact} size={isSingular?15:10}
                        createOrDeleteReact={createOrDeleteReact} isDisabled={isDisabled} dislikeClickRef={dislikeFuncRef}/>
                    </div>
                </div>
            </div>
            
            {/*
            Needs updates
            <Share post={post} handleSpread={handleSpread} selfSpread={selfSpread} /> 
            */}
            
        </div>
    )
}

function StarCount({reacted,count}){
    let color = reacted?'#fb4c4c':'rgb(67, 78, 88)';

    return(
        <span className="star-count" style={{fontSize:'1.1em',marginLeft:5,color:color,fontWeight:600,paddingTop:3}}>
        </span>
    )
}


function StarDislikeRatio({style,reacted,starCount,dislikeCount}){
    
    let ratio = starCount/(starCount + dislikeCount) * 100;
    
    const percentColors = [
        { pct: 0.0, color: { r: 0xff, g: 0x00, b: 0 } },
        { pct: 0.5, color: { r: 0xff, g: 0xff, b: 0 } },
        { pct: 1.0, color: { r: 255, g: 0, b: 0 } } ];
    
    const getColorForPercentage = function(pct) {
        for (var i = 1; i < percentColors.length - 1; i++) {
            if (pct < percentColors[i].pct) {
                break;
            }
        }
        var lower = percentColors[i - 1];
        var upper = percentColors[i];
        var range = upper.pct - lower.pct;
        var rangePct = (pct - lower.pct) / range;
        var pctLower = 1 - rangePct;
        var pctUpper = rangePct;
        var color = {
            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
        };
        return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
        // or output as hex if preferred
    }

    let color = reacted?getColorForPercentage(ratio):'rgb(67, 78, 88)';

    return(
        /*<span className="star-count" style={{fontSize:'1.1em',marginLeft:5,color:color,fontWeight:600,paddingTop:3}}>
            {starCount>0 || dislikeCount>0?<Line percent={ratio} strokeWidth="4" strokeColor="#D3D3D3" />:null}
        </span>*/
        starCount>0 || dislikeCount>0?
        <div style={{width:'100%',height:3,backgroundColor:'#cacaca',marginTop:4}}>
            <div className="ratio-bar" style={{width:`${ratio}%`,height:'100%',backgroundColor:style?style.color:'rgb(67, 78, 88)'}}>

            </div>
        </div>:null
    )
}

function Comments({post,handleCommentClick}){
    const [clicked,setClicked] = useState(false);

    const onClick = () =>{
         
        setClicked(!clicked);
        handleCommentClick();
    }

    //let className = clicked ? 'comments-clicked' : ''
    let className = 'comments-icon';

    return(
        <div className="post-action-container flex-fill comments">
            <button style={{border:0,backgroundColor:'transparent',padding:0}} onClick={onClick}>
                <div className="flex-fill" style={{alignItems:'center',WebkitAlignItems:'center'}}>
                    <CommentsSvg className={className}/>
                    <CommentsCount count={post.replies_count}/>
                </div>
            </button>
        </div>
    )
}

const commentsCount = theme =>css({
    fontSize:'1.1em',marginLeft:5,color:theme.textLightColor,fontWeight:600,paddingTop:3,
    '&:hover':{
        color:'#1fab89'
    }
})

function CommentsCount({count}){
    let color = 'rgb(67, 78, 88)';

    return(
        <span className="comments-count" css={theme=>commentsCount(theme)}>
            {count!==0?count:null}
        </span>
    )
}

function Share({post,handleSpread,selfSpread}){
    const [clicked,setClicked] = useState(false);
    const [spreadCount,setSpreadCount] = useState(post.spreads_count);
    const [selfSpreadCount,setSelfSpreadCount] = useState(selfSpread?selfSpread.times:0);
    const [selfSpreadId,setSelfSpreadId] = useState(selfSpread?selfSpread.id:null);
    const context = useContext(UserContext);
    const ref = useRef(null);
    const spreadRef = useRef(null);
    const [left,setLeft] = useState(0);
    const clickTimer = useRef(false);

    function createOrUpdateSpread(){
        let config = {
            withCredentials: true,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        }

        if(!selfSpread){
            let uri = `/api/v1/branches/${context.currentBranch.uri}/spreads/new/`;
            let data = {
                post:post.id,
                times:selfSpreadCount>50?50:selfSpreadCount + 1
            }
            axios.post(uri,data,config).then(r=>{
                handleSpread(r.data.id,r.data.times);
                setSelfSpreadId(r.data.id);
            });
        }else{
            let uri = `/api/v1/branches/${context.currentBranch.uri}/spreads/update/${selfSpread.id}/`;
            let data = {
                // 1 spread difference between the user and the data
                // so adding it manually
                times:selfSpreadCount + 1 >= 50 ? 50 : selfSpreadCount + 1
            }
            axios.patch(uri,data,config).then(r=>{
                handleSpread(r.data.id,r.data.times);
            });
        }
    }


    const onClick = (e) =>{
        if(clickTimer.current){
            clearTimeout(clickTimer.current);
        }

        e.stopPropagation();
        if(selfSpreadCount<50){
            setSpreadCount(spreadCount + 1);
            setSelfSpreadCount(selfSpreadCount + 1);
        }
        
        setClicked(!clicked);

        clickTimer.current = setTimeout(()=>{
            createOrUpdateSpread();
        },1000)
    }

    useEffect(()=>{
        if(selfSpreadCount>=50){
            setSelfSpreadCount(50);
        }
    },[selfSpreadCount])

    useEffect(()=>{
        if(spreadRef.current){
            setLeft(spreadRef.current.clientWidth)
        }
    },[spreadRef])

    let className = 'spread-icon';

    function overridePosition(position, currentEvent, currentTarget, node, place, desiredPlace, effect, offset){
        return {left:ref.current.offsetLeft + 60,top:ref.current.offsetTop - 10}
    }

    return(
        <div id="spread-wrapper" className="post-action-container flex-fill spread">
            <button ref={ref}
            style={{border:0,backgroundColor:'transparent'}} onClick={e=>onClick(e)}>
                
                <div ref={spreadRef} className="flex-fill" 
                style={{alignItems:'center',WebkitAlignItems:'center',position:'relative'}}>
                    <ShareSvg className={className}/>
                    <ShareCount spreads={spreadCount}/>
                    {selfSpread?
                        <span style={{position:'absolute',left:left,marginLeft:10,
                        color:'#2196f3',paddingTop:3,fontWeight:'bold'}}>({selfSpreadCount>=50?50:selfSpreadCount})</span>
                    :null}
                </div>
            </button>
            {/*clicked?
            <ShareBox post={post} selfSpread={selfSpread} handleSpread={spread} setClicked={setClicked}/>:null*/}
        </div>
    )
}

function ShareBox({post,selfSpread,handleSpread,setClicked}){
    const ref = useRef(null);

    const copyText = (e) =>{
        var copyText = document.getElementById("spread-clipboard-input");

        /* Select the text field */
        copyText.select();

        /* Copy the text inside the text field */
        document.execCommand("copy");
    }

    function handleClickOutside(event) {
         
        if (ref.current && !ref.current.contains(event.target) && 
        !document.getElementById("spread-wrapper").contains(event.target)) {
            setClicked(false);
        }
    }

    useEffect(()=>{
        document.addEventListener('mousedown',handleClickOutside);
        return(()=>{
            document.removeEventListener('mousedown',handleClickOutside);
        })
    },[])

    return(
        <div ref={ref} className="spread-box" onClick={e=>e.stopPropagation()}>
            <div style={{height:49,borderBottom:'1px solid #eaeaea',position:'relative'}}>
                {selfSpread?
                    <button className="spread-button" onClick={handleSpread}>Undo spread</button>:
                    <button className="spread-button" onClick={handleSpread}>Spread this leaf</button>
                }
                
            </div>
            <div className="spread-url flex-fill" style={{height:50,position:'relative'}}>
                <button className="spread-url-hidden-btn" onClick={copyText}></button>
                <input id="spread-clipboard-input" className="spread-clipboard-input" 
                defaultValue={document.location.href + post.poster + '/' + post.id}></input>
            </div>
        </div>
    )
}



/*const DislikeSvg = props => (
    <svg x="0px" y="0px" viewBox="0 0 260 260" xmlSpace="preserve" {...props}>
        <path
        d="M98.3 222.3c-.6 0-1.3-.1-1.9-.4-2.1-.8-3.3-3-3.1-5.2l8.3-73.6H62.5c-1.7 0-3.3-.9-4.2-2.3-.9-1.4-1-3.2-.3-4.8l53.7-116.4c.8-1.8 2.6-2.9 4.5-2.9h80.6c1.8 0 3.5 1 4.4 2.6s.8 3.6-.2 5.1l-48.5 72.8h35.4c1.9 0 3.7 1.1 4.5 2.8.8 1.7.6 3.8-.5 5.3l-89.5 115c-1.1 1.4-2.6 2-4.1 2zm-28-89.1h36.9c1.4 0 2.8.6 3.7 1.7 1 1.1 1.4 2.5 1.2 3.9l-7 61.5 72.3-92.9h-34.5c-1.8 0-3.5-1-4.4-2.6s-.8-3.6.2-5.1l48.5-72.8h-68L70.3 133.2z"
        fill="#212121"
        />
    </svg>
);*/

const ShareSvg = ({className}) => (
    <svg
      x="0px"
      y="0px"
      viewBox="0 0 260 260"
      style={{
        height: 27,
        width: 27,
        strokeWidth:0
      }}
      xmlSpace="preserve"
      css={theme=>pathFill(theme.textColor,null,null,null,null)}
      className={`post-action-svg ${className}`}>
    
      <path
        d="M205.4 122.3c0-7-2.8-13.6-7.8-18.7-3.9-3.9-8.7-6.5-13.9-7.5V48.4c0-4.2-2.4-7.9-6.3-9.6-3.8-1.7-8.1-.9-11.2 1.9-26.4 24.6-49.5 38.6-63.3 38.6H38C17.3 79.3.5 96.1.5 116.8v5.4c0 18.2 13.1 33.4 30.3 36.8v.3c0 5.2.9 10.2 2.7 15.1 0 .1.1.2.1.3.1.3 11.8 26.1 13.7 31.2l.4 1c2.2 6 6.9 18.5 20.5 18.5h5.4c2.4 0 10.4-.5 14.7-6.8 2-3 3.8-8.2.8-16.2-3-7.9-12.8-29.3-13.9-31.6-1.3-3.5-2-7.2-2-11H103c13.8 0 36.9 14.1 63.3 38.6 2 1.8 4.5 2.8 7 2.8 1.4 0 2.8-.3 4.2-.9 3.9-1.7 6.3-5.4 6.3-9.6v-42.3c12.1-2.3 21.6-13.3 21.6-26.1zm-194.9 0v-5.4c0-15.1 12.3-27.5 27.5-27.5h60v60.4H38c-15.1 0-27.5-12.3-27.5-27.5zM66 174.5c0 .1.1.2.1.3.1.2 10.7 23.3 13.7 31.1.8 2.2 1.6 5.2.3 7-1.2 1.7-4.1 2.5-6.5 2.5h-5.4c-5.6 0-8.3-4.2-11.2-11.9l-.4-1.1c-2-5.2-12.8-29.2-13.9-31.6-1.3-3.5-2-7.2-2-11h22.5c.2 5.1 1.1 10 2.8 14.7zm107.5 16.7c-.2.1-.3 0-.4-.1-15.4-14.3-43.3-37.6-65.1-40.9V89.1c21.8-3.3 49.7-26.6 65.1-40.9.1-.1.2-.2.4-.1.3.1.3.3.3.4v142.3c-.1.1-.1.3-.3.4zm10.2-53v-31.7c2.5.8 4.8 2.2 6.7 4.2 3.1 3.1 4.9 7.4 4.9 11.7.1 7.2-4.9 13.6-11.6 15.8z"
      />
    </svg>
  );

const shareCount = theme =>css({
    fontSize:'1.1em',marginLeft:5,color:theme.textLightColor,fontWeight:600,paddingTop:3,
    '&:hover':{
        color:'#2196f3'
    }
})

function ShareCount({spreads}){

    return(
        <span className="spread-count" css={theme=>shareCount(theme)}>
            {spreads!==0?spreads:null}
        </span>
    )
}

function TopSpreadList({spreaders,selfSpread}){
    const context = useContext(UserContext);
    const theme = useEmotionTheme();

    var topSpreadList = null;
    let postPicture = null;
    if(selfSpread){
        postPicture = <PostPicture style={{width:24,height:24}} 
                            picture={context.currentBranch.branch_image} 
                            uri={context.currentBranch.uri}/>
        if(spreaders.length===1){
            topSpreadList = 
            <>
                {postPicture}
                <p className="top-spread-list">You spread this leaf</p>
            </>
            
        }else if(spreaders.length>1){
            topSpreadList = <>
                {postPicture}
                <p className="top-spread-list">
                You and {spreaders.length - 1} other branches you follow spread this leaf</p>
            </>
        }
    }
    else{
        postPicture = <PostPicture style={{width:24,height:24}} 
                            picture={spreaders[0].branch.branch_image} 
                            uri={spreaders[0].branch.uri}/>

        if(spreaders.length===1){
            topSpreadList = 
            <>
                {postPicture}
                <p className="top-spread-list">
                {spreaders[0].branch.uri} spread this leaf</p>
            </>
            
        }else{
            topSpreadList = <>
                {postPicture}
                <p className="top-spread-list">
                {spreaders[0].branch.uri} and {spreaders.length - 1} other branches you follow have spread this leaf</p>
            </>
        }
    }
    return(
        <div className="top-spread-list flex-fill" style={{color:theme.textLightColor}}>
            {topSpreadList}
        </div>
    )
}

function More({post,posts,setPosts}){
    const ref = useRef(null);
    const [clicked,setClicked] = useState(false);
    const [isDeleted,setDeleted] = useState(false);
    const [message,setMessage] = useState(
        "Leaf successfully removed. Effects will be noticable upon refresh."
    );
    const userContext = useContext(UserContext);

    let isOwnerOfPost = userContext.isAuth?
    userContext.branches.some(b=>b.uri==post.poster):false

    function handleClick(e){
        e.stopPropagation();
        setClicked(!clicked);
    }

    function handleCopyLink(){
        copy(document.location.protocol + '//' + document.location.host + '/' +post.poster + '/leaves/' + post.id)
    }

    async function deletePost(){
        let url = `/api/post/${post.id}/`
        const httpReqHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        };
        const axiosConfigObject = {headers: httpReqHeaders};

        try{
            let response = await axios.delete(url,axiosConfigObject);
            setDeleted(true);
        }catch(e){
            // 
            setMessage('An error occured. Could not delete message');
        }
    }

    let actions = [
        {
            label:'Copy link',
            action:handleCopyLink
        }
    ]

    if(isOwnerOfPost){
        actions = [...actions, {
            label:'Delete leaf', 
            action:deletePost,
            confirmation:true,
            confirmation_message:'Are you sure you want to delete this leaf?'
        }]
    }

    return(
        <>
        {isDeleted?<InfoMessage message={message} time={5000}/>:null}
        <DropdownActionList isOpen={clicked} setOpen={setClicked} actions={actions}
        style={{left:'auto',minWidth:'auto',fontSize:'1.4rem'}} onclick={(e)=>{handleClick(e)}}>
            <div ref={ref}>
                <MoreSvg className="more-icon"/>
            </div>
        </DropdownActionList>
        </>
    )
}

function MoreOption({value,onClick,children}){
    return(
        <div className="more-option" onClick={onClick}>
            <span>{value}</span>
            {children}
        </div>
    )
}

const moreSvg = theme =>css({
    fill:theme.textColor,
    padding: '5px 1px',
    '&:hover':{
        backgroundColor:theme.embeddedHoverColor
    }
})

function MoreSvg({className}){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        width="30px"
        height="20px"
        viewBox="0 0 408 408"
        style={{ enableBackground: "new 0 0 408 408" }}
        xmlSpace="preserve"
        css={theme=>moreSvg(theme)}
        className={className}>
            <path d="M51 153c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm306 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm-153 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51z" />
        </svg>
    )
}

function getDateElement(diff,prefix = ''){
    let fontSize = '1.1rem';

    if(prefix === ''){
        let months = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];
        let month = months[diff.getMonth()];
        let monthDate = diff.getDate();
        return(
            <>
            <span style={{fontSize:fontSize}}>{monthDate}</span>
            <span>&nbsp;</span>
            <span style={{fontSize:fontSize}}>{month}</span>
            </>
        )
    }
    else{
        return(
            <>
            <span style={{fontSize:fontSize}}>{diff}</span>
            <span>&nbsp;</span>
            <span style={{fontSize:fontSize}}>{prefix} ago</span>
            </>
        )
    }
}

function timeDifference(created,now){
    var timeDiff = Math.abs(now.getTime() - created.getTime());
    let diffSec = timeDiff/1000;
    let diffMin = timeDiff/(1000 * 60);
    let diffHour = timeDiff/(1000 * 3600);
    let diffDays = timeDiff / (1000 * 3600 * 24);
    var prefix = '';
    if(diffSec < 60){
        prefix = diffSec===1 ? 'second' : 'seconds'
        return getDateElement(Math.floor(diffSec),prefix);
    }
    else if(diffMin<60){
        prefix = diffMin===1 ? 'minute' : 'minutes'
        return getDateElement(Math.floor(diffMin),prefix);
    }
    else if(diffHour<24){
        prefix = diffHour===1 ? 'hour' : 'hours'
        return getDateElement(Math.floor(diffHour),prefix);
    }
    else{
        return getDateElement(created,prefix);
    }
}