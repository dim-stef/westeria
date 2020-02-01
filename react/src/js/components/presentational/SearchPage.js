import React, {useEffect, useRef, useState} from 'react';
import {Link} from "react-router-dom";
import { css } from "@emotion/core";
import { useSpring, useTransition, animated, to } from 'react-spring/web.cjs'
import {useTheme} from "emotion-theming";
import {Helmet} from 'react-helmet'
import {ChildBranch} from "./Branch"
import BranchFooter from "./Temporary"
import {FadeImage} from "./FadeImage"
import axios from 'axios';
import axiosRetry from 'axios-retry';
import history from "../../history"

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();

export function SearchPage(props){
    const theme = useTheme();

    return(
        <div className="main-column" style={{flexBasis:'100%',WebkitFlexBasis:'100%',
        margin:0,border:`1px solid ${theme.borderColor}`}}>
            <h1 style={{padding:10}}>Search</h1>
            <Search/>
            <h1 style={{padding:10}}>Trending</h1>
            <TopLevelBranches/>
            <Trending/>
        </div>
    )
}

const searchContainer = () => css({
    display:'flex',
    flexFlow:'row wrap',
    WebkitFlexFlow:'row wrap',
    justifyContent:'space-between'
})

const searchList = theme => css({
    minWidth:250, 
    width:'auto',
    flexGrow:1,
    margin:10,
    flexFlow:'column',
    border:`1px solid ${theme.borderColor}`
})

const button = (theme,backgroundColor='#2196f3c4') =>css({
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    boxSizing:'border-box',
    padding:12,
    width:'85%',
    color:'white',
    fontSize:'1.3rem',
    fontWeight:500,
    borderRadius:50,
    margin:'5px 0',
    backgroundColor:backgroundColor
})

function Search(){
    const theme = useTheme();
    const [results,setResults] = useState([])
    const [branches,setBranches] = useState(null);
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const wrapperRef = useRef(null);

    async function getResults(){
        let safeText = text.trim()
        const response = safeText ? await axios.get(`/api/search/?search=${safeText}`,{
            cancelToken: source.token
          }): null
         
        if(response && Array.isArray(response.data)){
            setResults(response.data)
        }
    }

    async function getBranches(){

        let safeText = text.trim()
        const response = safeText ? await axios.get(next?next:`/api/search/?search=${safeText}`,{
            cancelToken: source.token
        }): null
        
        setNext(response.data.next);

        if(!response.data.next){
            setHasMore(false);
        }

        setBranches(branches?[...branches,...response.data.results]:response.data.results);
    }

    useEffect(()=>{
        source.cancel('Operation canceled by the user.');
        CancelToken = axios.CancelToken;
        source = CancelToken.source();

        setNext(null);
        setHasMore(true);
        setBranches(null);

        if(focused){
            getBranches();
        }
    },[text])
    

    return(
        <>
        <Helmet>
            <title>Search - Subranch</title>
            <meta name="description" content="Search the branches of Subranch." />
            <link rel="canonical" href="https://subranch.com/search"/>
        </Helmet>
        <div ref={wrapperRef}>
            <div style={{padding:10}}>
                <input
                    placeholder="Type a name or @username"
                    className="search-button"
                    value={text}
                    onChange={e=> setText(e.target.value)}
                    onFocus={e=> setFocused(true)}
                    style={{border:`1px solid ${theme.borderColor}`,color:theme.textColor}}            
                />
            </div>
            <div className="flex-fill" css={searchContainer}>
            {branches?
                branches.length>0?
                branches.map(b=>{
                    return <ExpandableBranch branch={b}/>
                           
                }):null
                :null}
            </div>
            <div className="flex-fill center-items">
                {next?<button className="load-more" onClick={getBranches}>Load more</button>:null}
        </div>
        </div>
        </>
    )
}

function Trending(){
    const [branches,setBranches] = useState([]);
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);

    function handleClick(){
        getTrending();
    }

    async function getTrending(){
        let uri = next?next:'/api/trending/';
        const response = await axios.get(uri);

        if(!response.data.next){
            setHasMore(false);
        }

        setNext(response.data.next);
        setBranches([...branches,...response.data.results]);
    }

    useEffect(()=>{
        getTrending();
    },[])

    return(
        <>
        <div className="flex-fill" style={{flexFlow:'row wrap', justifyContent:'space-between'}}>
            {branches.length>0?
            branches.map(b=>{
                return <ExpandableBranch branch={b}/>
            }):null}
        </div>
        <div className="flex-fill center-items">
            {next?<button className="load-more" onClick={handleClick}>Load more</button>:null}
        </div>
        </>
    )
}

function TopLevelBranches(){
    const [branches,setBranches] = useState(null);

    async function getTopLevel(){
        let uri = '/api/v1/top_level_branches/';
        const response = await axios.get(uri);
        setBranches(response.data);
    }

    useEffect(()=>{
        getTopLevel();
    },[])

    return(
        branches?<div css={{display:'flex',flexFlow:'row wrap'}}>
            {branches.map(b=>{
                return <ExpandableBranch branch={b}/>
            })}
        </div>:null
    )
}

function ExpandableBranch({branch}){
    const [showOptions,setShowOptions] = useState(false);

    const transitions = useTransition(showOptions, null, {
        from: { opacity: 0, scale:0.8 },
        enter: { opacity: 1, scale:1 },
        leave: { opacity: 0, scale:0.8 },
        config: {
            duration: 200,
        },
    })

    function handleProfileClick(e){
        e.stopPropagation();
        history.push(`/${branch.uri}`)
    }

    function handleRelatedClick(e){
        e.stopPropagation();
        history.push(`/${branch.uri}/branches`)
    }

    function handleCancelClick(e){
        e.stopPropagation();
        setShowOptions(false);
    }

    return (
        <div css={theme=>({display:'flex',flexFlow:'column',alignItems:'center',justifyContent:'center',
        margin:10,position:'relative',flexGrow:1,maxWidth:200,
        width:150,backgroundColor:theme.backgroundLightColor,borderRadius:25})} onClick={()=>setShowOptions(true)}>
            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center',height:'100%',width:'100%',
            padding:'40px 10px',boxSizing:'border-box',transition:'0.3s filter ease',filter:showOptions?'blur(8px)':null}}>
                <div>
                    <FadeImage src={branch.branch_image} css={{height:80,width:80,borderRadius:'50%',objectFit:'cover'}}/>
                </div>
                <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                    <span css={theme=>({color:theme.textColor,fontSize:'1.7rem',fontWeight:500})}>{branch.name}</span>
                    <span css={theme=>({fontSize:'1.2rem',color:theme.textLightColor})}>@{branch.uri}</span>
                </div>
            </div>
            {transitions.map(({item, key, props})=>(
                item && <animated.div key={key} style={props} css={{position:'absolute',height:'100%',width:'100%',
                display:'flex',justifyContent:'center',alignItems:'center',flexFlow:'column',willChange:'opacity, scale'}}>
                    <div role="button" css={theme=>button(theme)} onClick={handleProfileClick}>View profile</div>
                    <div role="button" css={theme=>button(theme)} onClick={handleRelatedClick}>{branch.branch_count} Related</div>
                    <div role="button" css={theme=>button(theme,'#f44336c4')} onClick={handleCancelClick}>Cancel</div>
                </animated.div>
            ))}
        </div>
    )
}