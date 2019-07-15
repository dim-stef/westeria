import React, { useState,useContext,useEffect,useRef,useCallback } from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router-dom'
import {Post} from './SingularPost'
import {PostsContext} from "../container/ContextContainer"
import StatusUpdate from './StatusUpdate'
import axios from 'axios';


export function CommentSection({currentPost,postsContext,activeBranch,commentIds,isStatusUpdateActive,measure,viewAs}){
    const [comments,setComments] = useState([]);
    const [justGotCached,setGotCached] = useState(false);
    const didMount = useRef(null)
    //const postsContext = useContext(PostsContext);

    let inCache = postsContext.cachedPosts.some(post=>{
        return commentIds.some(id=>post.id==id)
    })

    useEffect(()=>{
        console.log("incache",inCache)
        if(!inCache){
            console.log("not cached remeasure")
            measure();
        }

        const fetchData = async () =>{
            let arr = []
            for(const id of commentIds){
                const response = await axios(`/api/post/${id}/`);
                arr.push(response.data);
            }
            
            setComments(arr)

            if(!inCache){
                postsContext.cachedPosts = [...postsContext.cachedPosts,...arr];
                setGotCached(true);
            }
        };

        // try to find post in cached posts
        

        console.log("cached",inCache,postsContext)

        if(inCache.length>0){
            setComments(inCache)
        }else{
            fetchData();
        }
    },[])

    useEffect(()=>{
        if(justGotCached){
            console.log("remeasure")
            measure()
            setGotCached(false);
        }
    },[justGotCached])

    const updateFeed = useCallback(newComments=>{
        setComments(newComments.concat(comments))
    },[comments])
    
    
    return(
        <div ref={didMount} style={{marginTop:10}}>
            {isStatusUpdateActive?<StatusUpdate postsContext={postsContext} currentPost={currentPost} 
            updateFeed={updateFeed} measure={measure} replyTo={currentPost.id}
            style={{borderTop:'1px solid rgb(199, 210, 219)',borderBottom:'1px solid rgb(199, 210, 219)'}}/>:null}
            {comments?
            <ul style={{listStyle:'none',padding:0}}>
                {comments.map((c,i)=>{
                    let last = false;
                    let isOpen = postsContext.openPosts.some(id=>{
                        console.log("isOpen",c.id,currentPost.id)
                        return c.id==id
                    })
                    
                    let borderLeft = 'none';
                    let marginLeft = 0;

                    if(comments.length === i + 1){
                        last = true;
                    }

                    if(viewAs=="post" && c.level - 1 == currentPost.level){
                        marginLeft = 0
                    }else{
                        marginLeft = 33;
                        borderLeft='3px solid #e2eaf1';
                    }

                    return (
                        <li key={c.id} style={{marginLeft:marginLeft,borderLeft:borderLeft}}>
                            <Post isOpen={isOpen} post={c} postsContext={postsContext} 
                            measure={measure} activeBranch={activeBranch} 
                            updateFeed={updateFeed} lastComment={last} viewAs="reply"/>
                        </li>
                    )
                })}
            </ul>
            :null}
        </div>
    )
}



export function ReplyTree({currentPost,topPost,parentPost,postsContext,activeBranch,commentIds,isStatusUpdateActive,viewAs="reply"}){
    const [comments,setComments] = useState([]);
    const [justGotCached,setGotCached] = useState(false);
    const didMount = useRef(null)
    function measure(){
        return
    }
    //const postsContext = useContext(PostsContext);
    console.log("postscontext",comments,postsContext)

    let inCache = postsContext.cachedPosts.some(post=>{
        return currentPost.replies.some(id=>post.id==id)
    })

    useEffect(()=>{
        console.log("incache",inCache)
        if(!inCache){
            console.log("not cached remeasure")
            measure();
        }

        const fetchData = async () =>{
            let uri = `/api/post/${currentPost.id}/replies/`;
            let response = await axios.get(uri);

            
            setComments(response.data.results)

            if(!inCache){
                postsContext.cachedPosts = [...postsContext.cachedPosts,...response.data.results];
                setGotCached(true);
            }
        };

        // try to find post in cached posts
        

        console.log("cached",inCache,postsContext)

        if(inCache.length>0){
            setComments(inCache)
        }else{
            fetchData();
        }
    },[])

    useEffect(()=>{
        if(justGotCached){
            console.log("remeasure")
            measure()
            setGotCached(false);
        }
    },[justGotCached])

    const updateFeed = useCallback(newComments=>{
        setComments(newComments.concat(comments))
    },[comments])
    
    let last = false;
    let isOpen = postsContext.openPosts.some(id=>{
        return currentPost.id==id
    })

    let borderLeft = 'none';
    let marginLeft = 0;

    if(currentPost.level - 1 == topPost.level){
        marginLeft = 0;
    }else{
        marginLeft = 33;
        borderLeft='3px solid #e2eaf1';
    }
    console.log("postscontext",comments,postsContext)
    return(
        <div ref={didMount} style={{marginTop:10}}>
            {isStatusUpdateActive?<StatusUpdate postsContext={postsContext} currentPost={currentPost} 
            updateFeed={updateFeed} measure={measure} replyTo={post.id}
            style={{borderTop:'1px solid rgb(199, 210, 219)',borderBottom:'1px solid rgb(199, 210, 219)'}}/>:null}
            <ul style={{listStyle:'none',padding:0}}>
                <li key={currentPost.id} style={{marginLeft:marginLeft,borderLeft:borderLeft}}>
                    <Post isOpen={true} post={currentPost} postsContext={postsContext} 
                    measure={measure} activeBranch={activeBranch} 
                    updateFeed={updateFeed} lastComment={last} viewAs="reply"/>
                    {comments.map((c,i)=>{
                    return (
                        <ReplyTree topPost={topPost} parentPost={currentPost} currentPost={c} postsContext={postsContext} activeBranch={activeBranch}
                        isStatusUpdateActive={false}/>
                    )
                })}
                </li>
            </ul>
        </div>
    )
}

function ImmidiateComment(){

}