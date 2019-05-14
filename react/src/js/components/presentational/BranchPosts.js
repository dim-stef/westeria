import React, { useState,useEffect,useContext } from 'react';
import {Link} from 'react-router-dom'
import {RefreshContext} from "../container/ContextContainer"
import StatusUpdate from "./StatusUpdate"
import {Post} from './Post'
import axios from 'axios'

export function DisplayPosts(props){
    const [posts,setPosts] = useState([]);
    const [postedId,setPostedId] = useState(props.postedId);
    const [showPostedTo,setShowPostedTo] = useState(props.showPostedTo);
    const [activeBranch,setActiveBranch] = useState(props.activeBranch);
    const [emphasizedPosts,setEmphasizedPosts] = useState([]);
    const [emphasizedPost,setEmphasizedPost] = useState(null);
    const [hiddenMode,setHiddenMode] = useState(false);
    const context = useContext(RefreshContext);

    useEffect(()=>{
        console.log(props)
        const fetchData = async () =>{
            setPosts([])
            const response = await axios(props.uri);
            setPosts(response.data.results);
        };

        fetchData();
        context.setRefresh(() => fetchData);
    },[props.uri])

    function handleClick(post){
        //setEmphasizedPost(post.id);
        setPostedId(post.poster_id)
        //updateHiddenMode(true);
    }

    function updateHiddenMode(mode){
        setHiddenMode(mode);
    }

    /*function removeFromEmphasized(id){
        let newEmphasizedPosts = emphasizedPosts.splice(emphasizedPosts.indexOf(id), 1 );
        setEmphasizedPosts(newEmphasizedPosts);
    }*/

    function clearEmphasized(e){
        e.stopPropagation();
        setEmphasizedPost(null);
    }

    function updateFeed(newPosts){
        setPosts(newPosts.concat(posts))
    }


    return(
        <ul style={{padding:0,margin:'0 10px',listStyle:'none',flexBasis:'60%'}}>
            <StatusUpdate updateFeed={updateFeed} postedId={postedId} key={props.postedId}/>
            {posts?(
                    //filter posts
                    posts.filter(p=>
                    {
                        if(p.type==="reply"){ //dont return replies
                            return false
                        }
                        return true
                    }).map((post,i) => {
                            
                            let props = {
                            post:post,
                            key:post.id,
                            updateHiddenMode:updateHiddenMode,
                            removeFromEmphasized:null,
                            clearEmphasized:clearEmphasized,
                            handleClick:handleClick,
                            showPostedTo:showPostedTo?true:false,
                            activeBranch:activeBranch};

                            return <li key={post.id} style={{marginTop:10}}><Post {...props} minimized/></li>
                        }   
                    )
                ):
                <p>loading</p>
            }
        </ul>
    )
}

export function LegacyDisplayPosts(props){
    const [posts,setPosts] = useState([]);
    const [postedId,setPostedId] = useState(props.postedId);
    const [showPostedTo,setShowPostedTo] = useState(props.showPostedTo);
    const [activeBranch,setActiveBranch] = useState(props.activeBranch);
    const [emphasizedPosts,setEmphasizedPosts] = useState([]);
    const [emphasizedPost,setEmphasizedPost] = useState(null);
    const [hiddenMode,setHiddenMode] = useState(false);
    const context = useContext(RefreshContext);

    useEffect(()=>{
        console.log(props)
        const fetchData = async () =>{
            setPosts([])
            const response = await axios(props.uri);
            setPosts(response.data.results);
        };

        fetchData();
        context.setRefresh(() => fetchData);
    },[props.uri])

    function handleClick(post){
        setEmphasizedPost(post.id);
        setPostedId(post.poster_id)
        //updateHiddenMode(true);
    }

    function updateHiddenMode(mode){
        setHiddenMode(mode);
    }

    function removeFromEmphasized(id){
        let newEmphasizedPosts = emphasizedPosts.splice(emphasizedPosts.indexOf(id), 1 );
        setEmphasizedPosts(newEmphasizedPosts);
    }

    function clearEmphasized(e){
        e.stopPropagation();
        setEmphasizedPost(null);
    }

    function updateFeed(newPosts){
        setPosts(newPosts.concat(posts))
    }


    return(
        <ul style={{padding:0,margin:'0 10px',listStyle:'none',flexBasis:'60%'}}>
            <StatusUpdate updateFeed={updateFeed} postedId={postedId} key={props.postedId}/>
            {posts?(
                    //filter posts
                    posts.filter(p=>
                    {
                        if(p.type==="reply"){ //dont return replies
                            return false
                        }
                        return true
                    }).map((post,i) => {
                            let props = {
                            post:post,
                            key:post.id,
                            updateHiddenMode:updateHiddenMode,
                            removeFromEmphasized:removeFromEmphasized,
                            clearEmphasized:clearEmphasized,
                            handleClick:handleClick,
                            showPostedTo:showPostedTo?true:false,
                            activeBranch:activeBranch};

                            if(!emphasizedPost){ //emphasizedPosts.length==0
                                return <Post {...props} minimized/>
                            }
                            else{
                                if(emphasizedPost==post.id){ //emphasizedPosts.includes(post.id)
                                    return <Post {...props} emphasized/>
                                }else{
                                    if(hiddenMode){
                                        return <Post {...props} hidden/>
                                    }
                                    else{
                                        return <Post {...props} minimized/>
                                    }
                                }
                            }
                        }   
                    )
                ):
                <p>loading</p>
            }
        </ul>
    )
}