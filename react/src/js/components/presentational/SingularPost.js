import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {Link, withRouter} from 'react-router-dom'
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import history from "../../history"
import {Helmet} from 'react-helmet'
import {MoonLoader} from 'react-spinners';
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
import {SmallBranch} from "./Branch"
import {useInView} from 'react-intersection-observer'
import {Images} from './PostImageGallery'
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import '@material/react-ripple/dist/ripple.css';

import {withRipple} from '@material/react-ripple';
import {DropdownActionList} from "./DropdownActionList"
import {InfoMessage} from "./InfoMessage"

const copy = require('clipboard-copy')

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
        return context.currentBranch.follows.includes(b.uri) && b.uri!==context.currentBranch.uri
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

export function SingularPost({postId,parentPost=null,postsContext,activeBranch,lastComment}){

    const [post,setPost] = useState(null);
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
            fetchData(data)
            setPost(data);
            setLoaded(true);
        }catch(e){
            setLoaded(true);
        }
    }

    useEffect(()=>{
        getPost();
    },[])

    const updateTree = useCallback(newPost=>{
        setUserReplies([newPost,...userReplies])
    },[replyTrees])

    const measure = () =>{
        return;
    }

    let title = 'Subranch';
    let description = '';
    let maxLength=100;
    let trancuation = ''
    if(post){
        let endOfText = post.text.length > maxLength ? maxLength : post.text.length
        trancuation =  post.text.length > maxLength ? '...':'';
        if(post.text){
            title = post.poster_name + ' ' + post.text.substring(0,endOfText)+ trancuation + ' - Subranch';
            description = `${post.poster_name} @(${post.poster_uri}) on Subranch: ${post.description}`;
        }
    }
    
    return (
        post?
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description}></meta>
            </Helmet>
            <RoutedHeadline/>
            <Post post={post} parentPost={parentPost} postsContext={postsContext}
                index={0} activeBranch={activeBranch} lastComment={lastComment} measure={measure}
                viewAs="post" isStatusUpdateActive updateTree={updateTree} isSingular
            />
            <div>
                {userReplies.map(rt=>{
                    return <ReplyTree topPost={post} parentPost={post} currentPost={rt} 
                    postsContext={postsContext} activeBranch={activeBranch}
                    isStatusUpdateActive={false} isSingular
                    />
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
                    {replyTrees.map(rt=>{
                         
                        return <ReplyTree topPost={post} key={rt.id} parentPost={post} currentPost={rt} 
                        postsContext={postsContext} activeBranch={activeBranch}
                        isStatusUpdateActive={false}
                        />
                    })}
                </InfiniteScroll>
            </div>
        </>:loaded?<p style={{textAlign: 'center'}}>
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

export const Post = React.memo(function Post({post,parentPost=null,
    measure=()=>{},postsContext,posts,setPosts,
    isOpen=false,index,activeBranch,lastComment,
    viewAs="post",isSingular,updateTree=()=>{}}){
    const [isStatusUpdateActive,setStatusUpdateActive] = useState(false);

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


    var date = new Date(post.created.replace(' ', 'T'));
    return(
        <StyledPostWrapper viewAs={viewAs} post={post} isSingular={isSingular}>
            <div ref={ref} data-visible={inView} key={post.id} data-index={index?index:0}>
                <RippledStyledPost post={post} viewAs={viewAs} lastComment={lastComment} 
                date={date} cls="main-post" posts={posts} setPosts={setPosts}
                showPostedTo activeBranch={activeBranch}
                open={open} measure={measure} postsContext={postsContext}
                isStatusUpdateActive={isStatusUpdateActive} isSingular={isSingular} updateTree={updateTree}
                />
            </div>
        </StyledPostWrapper>
    )
})

function StyledPostWrapper({post,viewAs,index,isSingular,children}){
    if(viewAs=="reply" || isSingular){
        return(
            <div id={post.id}>
                {children}
            </div>
        )
    }else{
        return(
            <LinkedPostWithRouter to={`/${post.poster}/leaves/${post.id}/`} dataIndex={index} id={post.id}>
                {children}
            </LinkedPostWithRouter>
        )
    }
}

function LinkedPost({history,dataIndex,id,to,children}){

    function handleClick(e){
        e.stopPropagation();
         
        history.push(to);
    }

    return(
        <div className="preview-post" onClick={handleClick} data-index={dataIndex} id={id}>
            {children}
        </div>
    )
}

const LinkedPostWithRouter = withRouter(LinkedPost)

if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

//Post.whyDidYouRender = true;

function ShownBranch({branch,date,dimensions=48}){
    const theme = useTheme();
    const [showCard,setShowCard] = useState(false);
    let setTimeoutConst;
    let setTimeoutConst2;
    let dateElement=null;

    if(date){
        dateElement = timeDifference(date,new Date());
    }

    function handleMouseEnter(){
        clearTimeout(setTimeoutConst2)

        setTimeoutConst = setTimeout(()=>{
            setShowCard(true);
        },500)
    }

    function handleMouseLeave(){
        clearTimeout(setTimeoutConst)

        setTimeoutConst2 = setTimeout(()=>{
            setShowCard(false);
        },500)
    }

    function handleAnchorClick(e){
        e.stopPropagation()
    }

    return(
        <div style={{display:'-webkit-inline-flex',display:'-ms-inline-flexbox',
        display:'inline-flex',position:'relative'}} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <PostPicture picture={branch.branch_image} 
            style={{width:dimensions,height:dimensions}}
            uri={branch.uri}/>
            <div className="flex-fill" style={{display:'flex',flexFlow:'row wrap'}}>
                <Link to={`/${branch.uri}`} onClick={handleAnchorClick} 
                style={{textDecoration:'none', color:theme.textHarshColor,marginRight:10}}>
                        <strong style={{fontSize:'1.7em'}}>{branch.name}</strong>
                </Link>
                {date?<div style={{padding:'3px 0px',color:theme.textLightColor,fontWeight:600}}>
                    {dateElement}
                </div> :null}
                
            </div>
            {showCard?<SmallCard branch={branch}/>:null}
        </div>
    )
}

const postCss = (theme,isEmbedded) => css({
    padding:10,
    transition:'opacity 0.1s ease-in-out',
    position:'relative',
    '&:hover': {
        backgroundColor:isEmbedded?theme.embeddedHoverColor:theme.hoverColor
    }
})

function StyledPost({post,posts,setPosts,postsContext,date,cls,showPostedTo,
    activeBranch,open,updateTree,measure,viewAs,isSingular,unbounded,initRipple,className,children}){

    const context = useContext(UserContext);
    const theme = useTheme();

    let initSelfSpread = post.spreaders.find(s=>{
        if(context.isAuth && s.branch){
            return s.branch.uri===context.currentBranch.uri
        }
    })

    const [selfSpread,setSelfSpread] = useState(initSelfSpread)

    let isOpen = postsContext.openPosts.some(p=>{
        return p==post.id
    })
    let mainPostedBranch = getPostedTo(post,activeBranch,context);

    const [isStatusUpdateActive,setStatusUpdateActive] = useState(isOpen && viewAs=="post" || isSingular);
    const ref = useRef(null);

    let isEmbedded = viewAs=="embeddedPost" ? true : false;
    let borderBottom = viewAs=="post" || isEmbedded ? `1px solid ${theme.borderColor}` : borderBottom;
    borderBottom = viewAs=="reply" ? 'none' : borderBottom
    let border = isEmbedded ? `1px solid ${theme.borderColor}` : 'none';
    let borderRadius = isEmbedded ? '10px' : '0';
    let marginTop = isEmbedded ? '10px' : '0';

    function handleCommentClick(){

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

    
    return(
        <>
        <div ref={initRipple} className={className} unbounded={unbounded} className="no-highlight">
            <div ref={ref} css={theme=>postCss(theme,isEmbedded)} className={`post`}
            style={{display:'block',border:border,borderBottom:borderBottom,borderRadius:borderRadius,marginTop:marginTop}} 
            poststate={open?"open":"closed"}>
                {post.spreaders.length>0 && !isEmbedded && context.isAuth?
                <TopSpreadList spreaders={post.spreaders} selfSpread={selfSpread}/>
                :null}
                <div className="flex-fill">
                    <div className="flex-fill associated-branches" style={{fontSize:viewAs=='reply'?'0.7rem':null}}>
                        <ShownBranch branch={post.posted_to.find(b=>post.poster==b.uri)} 
                        date={date} post={post} dimensions={viewAs=='reply'?24:36}/>
                        <PostedTo post={post} mainPostedBranch={mainPostedBranch} 
                        activeBranch={activeBranch} showPostedTo={showPostedTo} dimensions={viewAs=='reply'?24:36}/>
                    </div>
                    <More post={post} posts={posts} setPosts={setPosts}/>
                    </div>
                    <div style={{marginTop:10}}>
                        <PostBody post={post} embeddedPostData={post.replied_to} activeBranch={activeBranch} isEmbedded={isEmbedded}
                        text={post.text} postsContext={postsContext} images={post.images} videos={post.videos} 
                        measure={measure} postRef={ref} viewAs={viewAs}/>
                        <PostActions post={post} handleCommentClick={handleCommentClick}
                        handleSpread={onSpread} selfSpread={selfSpread} postsContext={postsContext}/>
                        
                    </div>
            </div>
        </div>
        {isStatusUpdateActive?
        <StatusUpdate replyTo={post.id} postsContext={postsContext} currentPost={post} updateFeed={updateTree}/>:null}
        </>
    )
}

const RippledStyledPost = withRipple(StyledPost)


function PostedToExtension({post,activeBranch,mainPostedBranch}){
    
    const userContext = useContext(UserContext);
    const [branches,setBranches] = useState([]);
    

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
            <div style={{marginLeft:10,alignSelf:'center',
            borderRadius:'50%',
            backgroundColor:'rgb(220, 233, 245)'}}
            onClick={e=>{e.stopPropagation();show()}}>
                <span style={{fontSize:'1.5em',
                display:'block',
                padding:'4px 5px',color:'rgba(0, 0, 0, 0.75)'}}>+{branches.length}</span>
            </div>:null
        )}
        content={hide => (
        <Modal onClick={e=>{e.stopPropagation();hide()}}>
            <div className="post-to-branch-container" onClick={e=>e.stopPropagation()}> 

                <div style={{height:500,padding:'15px 20px',overflow:'auto'}}>
                    {branches.map(b=>{
                        return <div key={b.id}>
                        <SmallBranch branch={b}>
                            <FollowButton uri={b.uri} id={b.id}/>
                        </SmallBranch>
                        </div>
                    })}
                </div>
            </div>
        </Modal>    
        )}/>
    )
}


function PostedTo({post,showPostedTo,activeBranch=null,mainPostedBranch=null,dimensions=48}){

    return(
        mainPostedBranch && post.type!=="reply"?
            <div className="flex-fill" style={{alignItems:'center',margin:'0 10px'}}>
                <div className="arrow-right"></div>
                <div style={{marginLeft:20}}>
                    <div className="flex-fill">
                        {/*<PostPicture style={{width:dimensions,height:dimensions}} 
                        picture={mainPostedBranch.branch_image} 
                        uri={mainPostedBranch.uri}/>
                        <div>
                            <Link to={post.poster} style={{textDecoration:'none', color:'black'}}>
                                <strong style={{fontSize:'1.7em'}}>{mainPostedBranch.name}</strong>
                                <div style={{padding:'3px 0px',color:'#1b4f7b',fontWeight:600,fontSize:'1.4em'}}>
                                    @{mainPostedBranch.uri}
                                </div> 
                            </Link>
                        </div>*/}
                        <ShownBranch branch={mainPostedBranch} dimensions={dimensions}/>
                        <PostedToExtension post={post} activeBranch={activeBranch} mainPostedBranch={mainPostedBranch}/>
                    </div>
                </div>
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
            lastComment={false} viewAs="embeddedPost"></Post> :null}
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
        className="noselect" style={{marginRight:10}}>
            <img src={props.picture} className="post-profile-picture round-picture" 
            style={props.style?{...props.style}:null}/>
        </Link>
    )
}

function PostActions({post,handleCommentClick,handleSpread,selfSpread}){

    const postsContext = useContext(PostsContext);
    const allPostsContext = useContext(AllPostsContext);
    const treePostsContext = useContext(TreePostsContext);
    const branchPostsContext = useContext(BranchPostsContext);

    const context = useContext(UserContext)
    const [react,setReact] = useState(null);
    const [starCount,setStarCount] = useState(post.stars);
    const [dislikeCount,setDislikeCount] = useState(post.dislikes);
    const [isDisabled,setDisabled] = useState(false);
    let ratio = starCount/(starCount + dislikeCount) * 100;

    useLayoutEffect(()=>{
        if(context.isAuth){
            let reactType = context.currentBranch.reacts.find(x=>x.post===post.id)
            if(reactType){
                setReact(reactType.type);
            }
        }
    },[])

    function changeReact(type){
        setDisabled(true);

        let reactUUID = context.currentBranch.reacts.find(x=>x.post===post.id).id
        let uri = `/api/reacts/${reactUUID}/`;
        let data = {
            type:type,
            branch:context.currentBranch.id,
            post:post.id
        };

        
        if(type=='star'){
            setStarCount(starCount + 1);
            setDislikeCount(dislikeCount-1);
        }else{
            setStarCount(starCount - 1);
            setDislikeCount(dislikeCount + 1);
        }
        
        setReact(type);
        axios.patch(
            uri,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                withCredentials: true
            }).then(r=>{
                // update context
                let index = context.currentBranch.reacts.findIndex(r=>r.post == post.id)
                context.currentBranch.reacts[index] = r.data;
            }).finally(r=>{
                setDisabled(false);
            })
    }

    const createOrDeleteReact = useCallback((type) => {
        setDisabled(true);
        // delete react
        if(type==react){
            react=='star'?setStarCount(starCount - 1):setDislikeCount(dislikeCount - 1);
            setReact(null)
            let reactUUID = context.currentBranch.reacts.find(x=>x.post===post.id).id
            let uri = `/api/reacts/${reactUUID}/`;
            const httpReqHeaders = {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            };

            // check the structure here: https://github.com/axios/axios#request-config
            const axiosConfigObject = {headers: httpReqHeaders};
            axios.delete(uri, axiosConfigObject).then(r=>{
                
                //remove react from context
                context.currentBranch.reacts = context.currentBranch.reacts.filter(r=>{
                    return r.id !== reactUUID;
                })
            }).catch(r=>{
                 
                //setReact(null)
            }).finally(r=>{
                setDisabled(false);
            });
        }else{
            // post react
            
            setReact(type);
            type=='star'?setStarCount(starCount+1):setDislikeCount(dislikeCount+1);
            let uri = `/api/reacts/`;
            let data = {
                type:type,
                branch:context.currentBranch.id,
                post:post.id
            };

            axios.post(
                uri,
                data,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    withCredentials: true
                }).then(r=>{
                    context.currentBranch.reacts.push(r.data);
                    //setReact(type);
                }).catch(r=>{
                    setReact(null);
                    type=='star'?setStarCount(starCount-1):setDislikeCount(dislikeCount-1);
            }).finally(r=>{
                setDisabled(false);
            })
        }
    },[react])

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

    let color = null//'rgb(67, 78, 88)';

    if(react=='star'){
        color = '#fb4c4c';
    }else if(react=='dislike'){
        color = '#3c3fff';
    }

    return(
        <div className="flex-fill post-actions">
            <div className="flex-fill" style={{flexFlow:'column',WebkitFlexFlow:'column',width:'100%'}}>
                <div className="flex-fill" style={{alignItems:'center',WebkitAlignItems:'center'}}>
                    <Star postId={post.id} starCount={starCount} react={react} setReact={setReact} 
                    createOrDeleteReact={createOrDeleteReact} changeReact={changeReact} dislikeCount={dislikeCount} isDisabled={isDisabled}/>
                    {starCount>0 || dislikeCount>0?<span style={{fontWeight:600,fontSize:'1.5em',color:color}}>
                    {Math.ceil(ratio)}</span>:null}
                    <Dislike postId={post.id} count={post.stars} react={react} setReact={setReact} 
                    createOrDeleteReact={createOrDeleteReact} changeReact={changeReact} isDisabled={isDisabled}/>
                </div>
                <StarDislikeRatio css={theme=>number(theme.textLightColor,color)} reacted={react} 
                starCount={starCount} dislikeCount={dislikeCount}/>
            </div>

            <Comments post={post} handleCommentClick={handleCommentClick}/>
            <Share post={post} handleSpread={handleSpread} selfSpread={selfSpread} />
        </div>
    )
}


function Star({postId,react,changeReact,createOrDeleteReact,isDisabled}){
    const [reacted,setReacted] = useState(false);
    const context = useContext(UserContext);

    const onClick = (e) =>{
        e.stopPropagation();
        if(context.isAuth){
            handleStarClick();
        }else{
            history.push('/login');
        }
    }

    useLayoutEffect(()=>{
        if(react=='star'){
            setReacted(true);
        }else{
            setReacted(false);
        }
    },[react])

    function handleStarClick(){
        if(react && react!='star'){
            changeReact('star');
        }else{
            createOrDeleteReact('star');
        }
    }

    // hard-coded clicked class
    let className = reacted ? 'star-clicked' : '';
    let clickedColor = reacted ? '#fb4c4c' : null;
    return(
        <div className="post-action-container flex-fill star" style={{minWidth:0,width:'100%',
        justifyContent:'flex-start',WebkitJustifyContent:'flex-start'}}>
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0,paddingTop:3}}
            disabled={isDisabled} onClick={e=>onClick(e)}>
                <div className="flex-fill" style={{alignItems:'center'}}>
                    <StarSvg className={className} clickedColor={clickedColor}/>
                </div>
            </button>
        </div>
    )
}


function Dislike({postId,react,changeReact,createOrDeleteReact,count,isDisabled}){
    const [reacted,setReacted] = useState(false);
    const context = useContext(UserContext);

    const onClick = (e) =>{
        e.stopPropagation();
        if(context.isAuth){
            handleStarClick();
        }else{
            history.push('/login');
        }
    }

    useLayoutEffect(()=>{
        if(react=='dislike'){
            setReacted(true);
        }else{
            setReacted(false);
        }
    },[react])

    function handleStarClick(){
        if(react && react!='dislike'){
            changeReact('dislike');
        }else{
            createOrDeleteReact('dislike');
        }
    }

    // hard-coded clicked class
    let className = reacted ? 'dislike-clicked' : ''
    let clickedColor = reacted ? '#3c3fff' : null;
    return(
        <div className="post-action-container dislike flex-fill" style={{minWidth:0,width:'100%',justifyContent:'flex-end',
        WebkitJustifyContent:'flex-end'}}>
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0,paddingTop:3}} 
            disabled={isDisabled} onClick={e=>onClick(e)}>
                <div className="flex-fill" style={{alignItems:'center'}}>
                    <DislikeSvg clickedColor={clickedColor} className={`${className} dislike-icon`}/>
                </div>
            </button>
        </div>
    )
}

function StarSvg({className,clickedColor=null}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 49.94 49.94"
            className={`post-action-svg star-icon ${className}`}
            xmlSpace="preserve">
            <path css={theme=>pathFill('transparent',theme.textColor,null,'#fb4c4c',clickedColor)} d="M48.856 22.73a3.56 3.56 0 0 0 .906-3.671 3.56 3.56 0 0 0-2.892-2.438l-12.092-1.757a1.58 1.58 0 0 1-1.19-.865L28.182 3.043a3.56 3.56 0 0 0-3.212-1.996 3.56 3.56 0 0 0-3.211 1.996L16.352 14c-.23.467-.676.79-1.191.865L3.069 16.622A3.56 3.56 0 0 0 .177 19.06a3.56 3.56 0 0 0 .906 3.671l8.749 8.528c.373.364.544.888.456 1.4L8.224 44.701a3.506 3.506 0 0 0 .781 2.904c1.066 1.267 2.927 1.653 4.415.871l10.814-5.686a1.619 1.619 0 0 1 1.472 0l10.815 5.686a3.544 3.544 0 0 0 1.666.417c1.057 0 2.059-.47 2.748-1.288a3.505 3.505 0 0 0 .781-2.904l-2.065-12.042a1.582 1.582 0 0 1 .456-1.4l8.749-8.529z" />
        </svg>
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

const Modal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);

const ImageModal = ({ children ,onClick}) => (
    ReactDOM.createPortal(
        <div className="image-modal" onClick={onClick}>
            {children}
        </div>,
        document.getElementById('modal-root')
    )
);

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

const CommentsSvg = ({className}) => (
    <svg
      id="Layer_1"
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
    
      <style>{".st0{fill:#rgb(67, 78, 88)}"}</style>
      <path
        className="st0"
        d="M34.4 224.7c-2.3 0-4.6-1-6.2-2.8-2-2.3-2.6-5.6-1.4-8.5 2.8-7.1 4.8-15.4 5.4-23.1-10.8-10.9-16.7-24.6-16.7-38.7 0-25.1 18.1-47.4 46.2-56.8 2.6-.9 5.5.5 6.3 3.1.9 2.6-.5 5.5-3.1 6.3-23.9 8.1-39.3 26.6-39.3 47.3 0 12.1 5.4 23.8 15.2 33.1 1.1 1 1.6 2.4 1.6 3.9-.4 8.4-2.1 17.3-5 25.3 13.2-3.7 20.9-9.1 25.2-13.1 1.3-1.2 3.1-1.7 4.9-1.1 7.3 2.2 14.8 3.3 22.3 3.3 15.4 0 30.3-4.4 42-12.5 2.3-1.6 5.4-1 7 1.3 1.6 2.3 1 5.4-1.3 7-13.5 9.2-30.4 14.3-47.8 14.3-7.6 0-15.1-1-22.5-2.9-5.8 4.9-15.6 10.8-30.9 14.5-.6.1-1.3.1-1.9.1zM134.5 103.1c-2.8 0-5-2.2-5-5V94c0-2.8 2.2-5 5-5s5 2.2 5 5v4.1c0 2.7-2.2 5-5 5zM177.2 103.1c-2.8 0-5-2.2-5-5V94c0-2.8 2.2-5 5-5s5 2.2 5 5v4.1c0 2.7-2.2 5-5 5z"
      />
      <path
        className="st0"
        d="M220.5 204.2c-.7 0-1.5-.1-2.2-.3-16.8-4.1-31-10.8-41.4-19.4-7 1.4-14 2.2-21 2.2-48.6 0-88.1-33.1-88.1-73.9 0-40.7 39.5-73.9 88.1-73.9s88.1 33.2 88.1 74c0 18-7.8 35.2-22 48.7 1 10.2 3.6 20.7 7.2 29.7 1.3 3.3.7 7.1-1.6 9.8-1.9 2-4.4 3.1-7.1 3.1zm-.6-9.2zm-41.7-20.9c1.2 0 2.4.4 3.3 1.3 6.4 5.7 18.1 13.5 37.9 18.5-4.1-10.5-6.7-22.2-7.7-34-.1-1.6.5-3.1 1.7-4.1 13.2-11.8 20.5-27.1 20.5-43 0-35.2-35-63.9-78.1-63.9-43.1 0-78.1 28.7-78.1 63.9s35 63.9 78.1 63.9c7 0 14.2-.8 21.2-2.5.5 0 .9-.1 1.2-.1z"
      />
      <path
        className="st0"
        d="M155.9 158.2c-32.9 0-59.6-21.4-59.6-47.8 0-2.8 2.2-5 5-5s5 2.2 5 5c0 20.8 22.3 37.7 49.6 37.7 27.4 0 49.6-16.9 49.6-37.7 0-2.8 2.2-5 5-5s5 2.2 5 5c0 26.4-26.8 47.8-59.6 47.8z"
      />
    </svg>
);

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

const DislikeSvg = props => (
    <svg
      x="0px"
      y="0px"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      className={`post-action-svg ${props.className}`}
      css={{strokeWidth:34}}
    >
      <path css={theme=>pathFill('transparent',theme.textColor,null,'#3c3fff',props.clickedColor)} d="M400.268 175.599a8.53 8.53 0 00-7.731-4.932h-101.12l99.797-157.568a8.529 8.529 0 00.265-8.678A8.533 8.533 0 00384.003 0H247.47a8.541 8.541 0 00-7.637 4.719l-128 256a8.522 8.522 0 00.375 8.294 8.546 8.546 0 007.262 4.053h87.748l-95.616 227.089a8.55 8.55 0 003.413 10.59 8.55 8.55 0 0010.983-1.775l273.067-324.267a8.541 8.541 0 001.203-9.104z" />
    </svg>
  );

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
    const theme = useTheme();

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
            //console.log("an error occured")
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
    let fontSize = '1.4em';

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