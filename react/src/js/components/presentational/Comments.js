import React, { useState,useContext,useEffect,useRef } from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router-dom'
import {Post} from './Post'
import StatusUpdate from './StatusUpdate'
import axios from 'axios';


export function CommentSection({currentPost,activeBranch,commentIds,isStatusUpdateActive}){
    const [comments,setComments] = useState([]);


    useEffect(()=>{
        const fetchData = async () =>{
            let arr = []
            for(const id of commentIds){
                const response = await axios(`/api/post/${id}/`);
                arr.push(response.data);
            }
            setComments(arr)
        };

        fetchData();
    },[])

    function updateFeed(newComments){
        setComments(newComments.concat(comments))
    }

    return(
        <div style={{marginTop:10}}>
            {isStatusUpdateActive?<StatusUpdate currentPost={currentPost} updateFeed={updateFeed} replyTo={currentPost.id}
            style={{borderTop:'1px solid rgb(199, 210, 219)',borderBottom:'1px solid rgb(199, 210, 219)'}}/>:null}
            {comments?
            <ul style={{listStyle:'none',padding:0}}>
                {comments.map((c,i)=>{
                    let last = false;
                    let borderLeft = 'none';

                    if(comments.length === i + 1){
                        last = true;
                    }
                    if(c.level>1){
                        borderLeft='3px solid #e2eaf1';
                    }
                    let marginLeft = c.level===1 ? 0 : 33
                    return (
                        <li key={c.id} style={{marginLeft:marginLeft,borderLeft:borderLeft}}><Post post={c} activeBranch={activeBranch} lastComment={last}/></li>
                    )
                })}
            </ul>
            :null}
        </div>
    )
}