import React, { useState,useContext,useEffect,useRef } from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router-dom'
import {UserContext} from '../container/ContextContainer'
import {ToggleContent} from './Temporary'
import {CommentSection} from './Comments'
import {SmallBranchList} from './BranchList'
import axios from 'axios';
import { set } from 'immutable';

var csrftoken = getCookie('csrftoken');


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
        return context.currentBranch.follows.includes(b.uri);
    })

    var postedOnActive = post.posted_to.find(b=>{
        return activeBranch.uri===b.uri && post.poster!==b.uri;
    })

    if(postedOnActive){
        return postedOnActive;
    }

    if(intersection){
 
        if(intersection.uri===activeBranch.uri || intersection.uri===post.poster){
            return post.posted_to.find(b=>{
                return activeBranch.uri===b.uri && post.poster!==b.uri;
            })
        }
        else{
            return intersection;
        }
    }
}


export function Post({post,activeBranch,lastComment,emphasized=false,minimized=false}){
    const context = useContext(UserContext);
    const ref = useRef(null);
    const [cls,setClassName] = useState('');
    const [mainPostedBranch,setMainPostedBranch] = useState(getPostedTo(post,activeBranch,context))
    const [open,setOpen] = useState(false);

    useEffect(()=>{
        if(emphasized || minimized){
            setClassName('main-post');
        }
    })

    function outSideClick(e){
        const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length )

        if(!ref.current.contains(e.target) && isVisible(ref.current)){
            //clearEmphasized(e);
        }
    }

    function closePost(e){
        e.stopPropagation();
        setOpen(false);
    }

    function openPost(){
        setOpen(true);
    }

    var date = new Date(post.created);
    return(
        <div ref={ref}>
            <SmallPost post={post} lastComment={lastComment} mainPostedBranch={mainPostedBranch} date={date} cls={cls}
            emphasized={emphasized} showPostedTo activeBranch={activeBranch} openPost={openPost} open={open} closePost={closePost}/>
        </div>
    )
}

function SmallPost({post,mainPostedBranch,date,cls,showPostedTo,activeBranch,openPost,open,closePost,lastComment}){
    const [isStatusUpdateActive,setStatusUpdateActive] = useState(false);
    let dateElement = timeDifference(date,new Date());
    let borderBottom = lastComment ? 'none' : '1px solid #e2eaf1';

    function handleCommentClick(){
        if(post.level===0){ //if its top level post always display status bar
            setStatusUpdateActive(true);
        }
        else{
            setStatusUpdateActive(!isStatusUpdateActive);
        }
    }

    function handleOpenPost(){
        openPost();
        setStatusUpdateActive(true);
    }

    return(
        <div className={`post ${cls}`} style={{display:'block',borderBottom:borderBottom}} 
        poststate={open?"open":"closed"} 
        onClick={handleOpenPost}>
            <div className="flex-fill">
                <div className="flex-fill" style={{flex:'1 1 auto'}}>
                    <PostPicture picture={post.poster_picture} uri={post.poster}/>
                    <div>
                        <Link to={post.poster} style={{textDecoration:'none', color:'black'}}>
                                <strong style={{fontSize:'1.7rem'}}>{post.poster}</strong>
                        </Link>
                        <div style={{padding:'3px 0px',color:'#1b4f7b',fontWeight:600}}>
                            {dateElement}
                        </div> 
                    </div>
                    <PostedTo post={post} mainPostedBranch={mainPostedBranch} activeBranch={activeBranch} showPostedTo={showPostedTo}/>
                </div>
                <More/>
                {open?
                    <button style={{height:45,width:45}} onClick={e=>{closePost(e);setStatusUpdateActive(false);}}></button>:null
                }
                </div>
                <div>
                    <PostBodyv2 text={post.text}/>
                    <PostActions post={post} handleCommentClick={handleCommentClick}/>
                    {open?
                    <div style={{margin:'0 -10px -10px'}}>
                        {/*<h1 style={{borderBottom:'1px solid rgb(210, 220, 228)', padding:'10px 0'}}>Comments</h1>*/}
                        <CommentSection currentPost={post} activeBranch={activeBranch} commentIds={post.replies} 
                            isStatusUpdateActive={isStatusUpdateActive}
                        />
                    </div>
                    :null}
                </div>
        </div>
    )
}

function PostedToExtension({post,activeBranch,mainPostedBranch}){
    
    const [branches,setBranches] = useState([]);
    
    function branchesToDisplay(){
        return post.posted_to.filter(function(b) {
            return b.uri !== mainPostedBranch.uri && b.uri!==post.poster;
        });
    }

    useEffect(()=>{
        setBranches(branchesToDisplay())
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
            <div style={{width:708,height:500,margin:'0 auto',marginTop:60,backgroundColor:'white'}} onClick={e=>e.stopPropagation()}> 
                <div style={{padding:'30px 20px'}}>
                    <SmallBranchList branches={branches}/>
                </div>
            </div>
        </Modal>    
        )}/>
    )
}


function PostedTo({post,showPostedTo,activeBranch=null,mainPostedBranch=null}){

    //console.log(post.poster,mainPostedBranch.uri)
    return(
        mainPostedBranch && post.type!=="reply"?
            <div className="flex-fill" style={{alignItems:'center',margin:'0 20px'}}>
                <div className="arrow-right"></div>
                <div style={{marginLeft:20}}>
                    <div className="flex-fill">
                        <PostPicture picture={mainPostedBranch.branch_image} uri={mainPostedBranch.uri}/>
                        <div>
                            <Link to={post.poster} style={{textDecoration:'none', color:'black'}}>
                                <strong style={{fontSize:'1.7rem'}}>{mainPostedBranch.uri}</strong>
                                <div style={{padding:'3px 0px',color:'#1b4f7b',fontWeight:600,fontSize:'1.4rem'}}>
                                    @{mainPostedBranch.name}
                                </div> 
                            </Link>
                        </div>
                        <PostedToExtension post={post} activeBranch={activeBranch} mainPostedBranch={mainPostedBranch}/>
                    </div>
                </div>
            </div>
        :null
    )
}

function SmallPost2({post,date,cls,handleClick}){
    return(
        <div className={`post ${cls}`} onClick={() => handleClick(post.id)}>
            <PostPicture picture={post.poster_picture} uri={post.poster}/>
            <div>
                <PostBody text={post.text} poster={post.poster} postDate={date}/>
                <PostActions post={post}/>
                <CommentSection currentPost={post} commentIds={post.replies}/>
            </div>
        </div>
    )
}

function PostBodyv2({text}){

    return(
        <div>
            <p style={{fontSize:'1.5rem',margin:0,
            marginTop:10,wordWrap:'break-word',
            wordBreak:'break-word',wordBreak:'break-all',
            whiteSpace:'pre-line'}}>{text}</p>
        </div>
    )
}

function PostPicture(props){

    return(
        <Link to={`/${props.uri}`} className="noselect" style={{marginRight:10}}>
            <img src={props.picture} style={{
            backgroundSize:'cover',
            backgroundPosition:'center center',
            backgroundRepeat:'no-repeat',
            border:0,
            borderRadius:'50%',
            width:48,height:48}}/>
        </Link>
    )
}

function PostBody({poster, postDate, text}){

    const [date,setDate] = useState(postDate);
    
    let dateElement = timeDifference(date,new Date());

    return(
        <div>
            <div>
                <Link to={poster} style={{textDecoration:'none', color:'black'}}>
                    <strong style={{fontSize:'1.5rem'}}>{poster}</strong>
                </Link>
                {dateElement}
            </div>
            
            <p style={{fontSize:'1.5rem',margin:0,wordWrap:'break-word',wordBreak:'break-word',wordBreak:'break-all'}}>{text}</p>
        </div>
    )
}


function PostActions({post,handleCommentClick}){
    const context = useContext(UserContext)

    return(
        <div className="flex-fill" style={{height:30,marginTop:5,alignItems:'center'}}>
            <Star postId={post.id} currentBranchId={context.currentBranch.id} count={post.stars}/>
            <Comments post={post} handleCommentClick={handleCommentClick}/>
            <Share/>
        </div>
    )
}


function Star({postId,currentBranchId,count}){
    const [reacted,setReacted] = useState(false);
    const [starCount,setStarCount] = useState(count);
    const context = useContext(UserContext);

    const onClick = (e) =>{
        e.stopPropagation();
        setReacted(!reacted);
        addStar();
    }

    useEffect(()=>{
        // check in context if posts is starred
        if(context.currentBranch.reacts.find(x=>x.post===postId)){
            setReacted(true);
        }
    },[])

    const addStar = () =>{
        if(!reacted){ 
            let uri = `/api/reacts/`;
            let data = {
                type:"star",
                branch:currentBranchId,
                post:postId
            };

            axios.post(
                uri,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    withCredentials: true
                }).then(r=>{

                    // update context
                    context.currentBranch.reacts.push(r.data);
                    // update star count
                    setStarCount(starCount + 1);
                }).catch(r=>{
                    console.log(r)
            })
        }
        else{

            // find reacts id on context
            let reactUUID = context.currentBranch.reacts.find(x=>x.post===postId).id
            let uri = `/api/reacts/${reactUUID}/`;
            const httpReqHeaders = {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            };

            // check the structure here: https://github.com/axios/axios#request-config
            const axiosConfigObject = {headers: httpReqHeaders};
            axios.delete(uri, axiosConfigObject).then(r=>{
                setReacted(false);

                //remove react from context
                context.currentBranch.reacts = context.currentBranch.reacts.filter(r=>{
                    return r.id !== reactUUID;
                })

                // update star count
                setStarCount(starCount - 1);
            }).catch(r=>{
                console.log(r)
            });
        }
    }

    // hard-coded clicked class
    let className = reacted ? 'star-clicked' : ''
    return(
        <div className="post-action-container star">
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0,paddingTop:3}} onClick={e=>onClick(e)}>
                <div className="flex-fill" style={{alignItems:'center'}}>
                    <StarSvg className={className}/>
                    <StarCount reacted={reacted} count={starCount}/>
                </div>
            </button>
        </div>
    )
}

function StarSvg({className}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 49.94 49.94"
            className={`post-actions star-icon ${className}`}
            xmlSpace="preserve">
            <path d="M48.856 22.73a3.56 3.56 0 0 0 .906-3.671 3.56 3.56 0 0 0-2.892-2.438l-12.092-1.757a1.58 1.58 0 0 1-1.19-.865L28.182 3.043a3.56 3.56 0 0 0-3.212-1.996 3.56 3.56 0 0 0-3.211 1.996L16.352 14c-.23.467-.676.79-1.191.865L3.069 16.622A3.56 3.56 0 0 0 .177 19.06a3.56 3.56 0 0 0 .906 3.671l8.749 8.528c.373.364.544.888.456 1.4L8.224 44.701a3.506 3.506 0 0 0 .781 2.904c1.066 1.267 2.927 1.653 4.415.871l10.814-5.686a1.619 1.619 0 0 1 1.472 0l10.815 5.686a3.544 3.544 0 0 0 1.666.417c1.057 0 2.059-.47 2.748-1.288a3.505 3.505 0 0 0 .781-2.904l-2.065-12.042a1.582 1.582 0 0 1 .456-1.4l8.749-8.529z" />
        </svg>
    )
}

function StarCount({reacted,count}){
    let color = reacted?'#fb4c4c':'rgb(67, 78, 88)';

    return(
        <span className="star-count" style={{fontSize:'1.1em',marginLeft:5,color:color,fontWeight:600,paddingTop:3}}>
            {count!==0?count:null}
        </span>
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

function Comments({post,handleCommentClick}){
    const [clicked,setClicked] = useState(false);

    const onClick = () =>{
        setClicked(!clicked);
        handleCommentClick();
    }

    let className = clicked ? 'comments-clicked' : ''

    return(
        <div className="post-action-container comments">
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0,paddingTop:3}} onClick={onClick}>
                <div className="flex-fill">
                    <CommentsSvg className={className}/>
                    <CommentsCount count={post.replies_count}/>
                </div>
            </button>
        </div>
    )
}

function PostBigBody({post}){

    return(
        <div style={{width:708,height:500,margin:'0 auto',marginTop:60,backgroundColor:'white'}} onClick={e=>e.stopPropagation()}> 
            <div style={{padding:'30px 20px'}}>
                <div>
                    <img src={post.poster_picture} style={{height:48,width:48}}></img>
                    <span style={{fontSize:'1.2em', fontWeight:'bold'}}>{post.poster_name}</span>
                    <span style={{fontSize:'1.2em'}}> @{post.poster}</span>
                </div>
                <div>
                    <p style={{fontSize:'2em'}}>{post.text}</p>
                </div>
            </div>
        </div>
    )
}

function CommentsSvg({className}){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 60 60"
        viewBox="0 0 60 60"
        className={`post-actions ${className} comments-icon`}
        style={{strokeWidth:4.5}}
        xmlSpace="preserve"
        >
            <path
                d="M30 1.5c-16.542 0-30 12.112-30 27 0 5.205 1.647 10.246 4.768 14.604-.591 6.537-2.175 11.39-4.475 13.689a1 1 0 0 0 .847 1.697c.405-.057 9.813-1.412 16.617-5.338C21.622 54.711 25.738 55.5 30 55.5c16.542 0 30-12.112 30-27s-13.458-27-30-27z"/>
        </svg>
    )
}

function CommentsCount({count}){
    let color = 'rgb(67, 78, 88)';

    return(
        <span className="comments-count" style={{fontSize:'1.1em',marginLeft:5,color:color,fontWeight:600,paddingTop:3}}>
            {count!==0?count:null}
        </span>
    )
}

function Share(){
    const [clicked,setClicked] = useState(false);

    const onClick = () =>{
        setClicked(!clicked);
    }

    let className = clicked ? 'comments-clicked' : ''

    return(
        <div className="post-action-container">
            <button style={{height:25,border:0,backgroundColor:'transparent',padding:0}} onClick={onClick}>
                <div className="flex-fill">
                    <ShareSvg className={className}/>
                </div>
            </button>
        </div>
    )
}

function ShareSvg({className}){
    return(
        <svg viewBox="0 -22 512 511" 
        style={{strokeWidth:35}} 
        className={`post-actions ${className}`}>
            <path
                d="M512 233.82L299.223.5v139.203h-45.239C113.711 139.703 0 253.414 0 393.687v73.77l20.094-22.02a360.573 360.573 0 0 1 266.324-117.5h12.805v139.204zm0 0"
            />
        </svg>

    )
}

function More(){
    return(
        <MoreSvg/>
    )
}

function MoreSvg(){
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
        fill="rgba(0,0,0,0.75)"
        >
            <path d="M51 153c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm306 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51zm-153 0c-28.05 0-51 22.95-51 51s22.95 51 51 51 51-22.95 51-51-22.95-51-51-51z" />
        </svg>
    )
}

function getDateElement(diff,prefix = ''){
    let fontSize = '1.4rem';

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