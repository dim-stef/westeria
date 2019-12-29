import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Post} from './SingularPost'
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
         
        if(!inCache){
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
        if(inCache.length>0){
            setComments(inCache)
        }else{
            fetchData();
        }
    },[])

    useEffect(()=>{
        if(justGotCached){
             
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

export function ReplyTree({currentPost,topPost,
    postsContext,activeBranch,isStatusUpdateActive,viewAs="reply"}){
    const [comments,setComments] = useState([]);
    const [justGotCached,setGotCached] = useState(false);
    const [hasMore,setHasMore] = useState(true);
    const [next,setNext] = useState(null);
    const [viewAll,setViewAll] = useState(false);

    const didMount = useRef(null)
    function measure(){
        return
    }
    //const postsContext = useContext(PostsContext);
     

    let inCache = postsContext.cachedPosts.some(post=>{
        return currentPost.replies.some(id=>post.id==id)
    })

    function handleClick(){
        setViewAll(true);
    }

    const fetchData = async () =>{
        if(!hasMore){
            return
        }

        let uri = next?next:`/api/post/${currentPost.id}/replies/`;
        let response = await axios.get(uri);

        if(!response.data.next){
            setHasMore(false);
        }

        if(!inCache){
            postsContext.cachedPosts = [...postsContext.cachedPosts,...response.data.results];
            setGotCached(true);
        }

        setNext(response.data.next)
        setComments([...comments,...response.data.results])
    };

    useEffect(()=>{
        if(!inCache){
            measure();
        }

        if(inCache.length>0){
            //setComments(inCache)
        }else{
            fetchData();
        }
    },[])

    useEffect(()=>{
        if(justGotCached){
            measure()
            setGotCached(false);
        }
    },[justGotCached])

    useEffect(()=>{
        if(viewAll && next != null){
            fetchData();
        }
    },[comments,viewAll])

    const updateFeed = useCallback(newComments=>{
        setComments([newComments,...comments])
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
        marginLeft = 15;
        borderLeft='3px solid #e2eaf1';
    }
     
    return(
        <div ref={didMount} style={{marginTop:10}} key={currentPost.id}>
            
            <ul style={{listStyle:'none',padding:0}}>
                <li style={{marginLeft:marginLeft,borderLeft:borderLeft}}>
                    <Post isOpen={true} post={currentPost} postsContext={postsContext} 
                    measure={measure} activeBranch={activeBranch} updateTree={updateFeed}
                    lastComment={last} viewAs="reply"/>
                    {comments.map((c,i)=>{
                        return (
                            <div key={c.id}>
                                <ReplyTree topPost={topPost} parentPost={currentPost} currentPost={c} 
                                postsContext={postsContext} activeBranch={activeBranch}
                                isStatusUpdateActive={isStatusUpdateActive}/>
                            </div>
                        )
                    })}
                    {hasMore && next && !viewAll?<button onClick={handleClick}>View more</button>:null}
                </li>
            </ul>
        </div>
    )
}