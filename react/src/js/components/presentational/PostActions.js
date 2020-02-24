import React, {useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import history from "../../history"
import {
    UserContext
} from '../container/ContextContainer'
import axios from 'axios';
import {StarSvg,DislikeSvg} from "./Svgs"


export function useReactActions(post){

    const context = useContext(UserContext)
    const [react,setReact] = useState(null);
    const [starCount,setStarCount] = useState(post.stars);
    const [dislikeCount,setDislikeCount] = useState(post.dislikes);
    const [isDisabled,setDisabled] = useState(false);
    const disabled = useRef(isDisabled);

    useLayoutEffect(()=>{
        if(context.isAuth){
            let reactType = context.currentBranch.reacts.find(x=>x.post===post.id)
            if(reactType){
                setReact(reactType.type);
            }
        }
    },[])

    function changeReact(type){
        if(disabled.current) return;
        disabled.current = true;
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
                disabled.current = false;
                setDisabled(false);
            })
    }

    const createOrDeleteReact = (type) => {
        
        if(disabled.current) return;
        disabled.current = true;
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
                disabled.current = false;
                setDisabled(false);
            });
        }else{

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
                }).then(r=>{
                    context.currentBranch.reacts.push(r.data);
                    //setReact(type);
                }).catch(r=>{
                    setReact(null);
                    type=='star'?setStarCount(starCount-1):setDislikeCount(dislikeCount-1);
            }).finally(r=>{
                disabled.current = false;
                setDisabled(false);
            })
        }
    }

    return [react,starCount,dislikeCount,isDisabled,changeReact,createOrDeleteReact];
}

export function Star({react,isDisabled,changeReact,createOrDeleteReact,size=20,starClickRef}){
    const [reacted,setReacted] = useState(false);
    const context = useContext(UserContext);

    function handleStarClick(){
        if(react && react!='star'){
            changeReact('star');
        }else{
            createOrDeleteReact('star');
        }
    }

    const onClick = (e) =>{
        try{
            e.stopPropagation();
        }catch(e){

        }
        
        if(context.isAuth){
            handleStarClick();
        }else{
            history.push('/login');
        }
    }

    starClickRef.current = onClick

    useLayoutEffect(()=>{
        if(react=='star'){
            setReacted(true);
        }else{
            setReacted(false);
        }
    },[react])

    return(
        <div css={{zIndex:1,justifyContent:'center',alignItems:'center',cursor:'pointer'}}>
            <button css={{border:0,backgroundColor:'transparent',padding:0}}>
                <div css={{display:'flex',alignItems:'center'}}>
                    <StarSvg css={theme=>({height:size,width:size,stroke:reacted?'white':theme.textHarshColor,strokeWidth:'5%',
                    fill:reacted?'white':'transparent',overflow:'visible'})}/>
                </div>
            </button>
        </div>
    )
}

export function Dislike({react,changeReact,createOrDeleteReact,size=20,dislikeClickRef}){
    const [reacted,setReacted] = useState(false);
    const context = useContext(UserContext);

    const onClick = (e) =>{
        try{
            e.stopPropagation();
        }catch(e){

        }
        
        if(context.isAuth){
            handleDislikeClick();
        }else{
            history.push('/login');
        }
    }

    dislikeClickRef.current = onClick

    useLayoutEffect(()=>{
        if(react=='dislike'){
            setReacted(true);
        }else{
            setReacted(false);
        }
    },[react])

    function handleDislikeClick(){
        if(react && react!='dislike'){
            changeReact('dislike');
        }else{
            createOrDeleteReact('dislike');
        }
    }

    return(
        <div css={{zIndex:1,justifyContent:'center',alignItems:'center',cursor:'pointer'}}>
            <button css={{border:0,backgroundColor:'transparent',padding:0,paddingTop:5}}>
                <div css={{display:'flex',alignItems:'center'}}>
                    <DislikeSvg css={theme=>({height:size,width:size,stroke:reacted?'white':theme.textHarshColor,strokeWidth:'5%',
                    fill:reacted?'white':'transparent',overflow:'visible'})}/>
                </div>
            </button>
        </div>
    )
}
