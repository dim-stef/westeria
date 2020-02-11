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
            <h1 style={{padding:10}}>Generic Branches</h1>
            <TopLevelBranches/>
            <h1 style={{padding:10}}>Trending</h1>
            <Trending/>
        </div>
    )
}

const searchContainer = () => css({
    display:'flex',
    flexFlow:'row wrap',
    WebkitFlexFlow:'row wrap',
    justifyContent:'center',
})

const expendableBranch = theme =>css({
    display:'flex',flexFlow:'column',alignItems:'center',justifyContent:'center',
    margin:10,position:'relative',flexGrow:1,maxWidth:200,overflow:'hidden',
    width:170,backgroundColor:theme.backgroundLightColor,borderRadius:25,
    cursor:'pointer',
    '@media (max-width:767px)':{
        maxWidth:'100%'
    }
})
const branchType = theme =>css({
    padding:'10px 0',
    width:'100%',
    backgroundColor:theme.backgroundDarkColor,
    display:'flex',
    justifyContent:'center',
    fontSize:'1.3rem',
    fontWeight:'bold'
})

const info = theme =>css({
    padding:'10px 0',
    width:'100%',
    display:'flex',
    justifyContent:'space-around',
    fontSize:'1.3rem',
    fontWeight:'bold',
    boxSizing:'border-box'
})

const smallBubble = theme =>css({
    padding:10,
    backgroundColor:theme.backgroundDarkColor,
    borderRadius:50
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
    const [branches,setBranches] = useState(null);
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const wrapperRef = useRef(null);


    async function getBranches(){

        let safeText = text.trim()
        let queryParams = {};

        if(text[0]=='@'){
            queryParams = {...queryParams,uri:text.substr(1)} // remove the @ so it doesn't get encoded
        }else{
            queryParams = {...queryParams,name:text}
        
        }

        const params = new URLSearchParams(queryParams)
        const response = safeText ? await axios.get(next?next:`/api/v1/search2/?${params}`,{
            cancelToken: source.token
        }): null
        
        setNext(response.data.next);

        if(!response.data.next){
            setHasMore(false);
        }

        setBranches(branches?[...branches,...response.data.results]:response.data.results);
    }

    useEffect(()=>{
        if(focused){
            getBranches();
        }
    },[text])
    
    function handleChange(e){
        source.cancel('Operation canceled by the user.');
        CancelToken = axios.CancelToken;
        source = CancelToken.source();

        setNext(null);
        setHasMore(true);
        setBranches(null);
        setText(e.target.value)
    }

    return(
        <>
        <Helmet>
            <title>Search - Westeria</title>
            <meta name="description" content="Search the branches of Westeria." />
            <link rel="canonical" href="https://subranch.com/search"/>
        </Helmet>
        <div ref={wrapperRef}>
            <div style={{padding:10}}>
                <input
                    placeholder="Type a name or @username"
                    className="search-button"
                    value={text}
                    onChange={handleChange}
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
        branches?<div css={{display:'flex',flexFlow:'row wrap',justifyContnet:'center'}}>
            {branches.map(b=>{
                return <ExpandableBranch branch={b}/>
            })}
        </div>:null
    )
}

export function ExpandableBranch({branch}){
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

    function handleFollowClick(e){
        e.stopPropagation();
        history.push(`/${branch.uri}/followers`)
    }

    function handleBranchesClick(e){
        e.stopPropagation();
        history.push(`/${branch.uri}/branches`)
    }

    let branchTypeText = 'Person';
    if(branch.branch_type == 'CM'){
        branchTypeText = 'Community'
    }else if(branch.branch_type == 'HB'){
        branchTypeText = 'Hub'
    }

    return (
        <div css={expendableBranch} onClick={()=>history.push(`/${branch.uri}`)}>
            <span css={branchType}>{branchTypeText}</span>

            <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center',height:'100%',width:'100%',
            padding:'20px 10px 20px 10px',boxSizing:'border-box'}}>
                <div>
                    <FadeImage src={branch.branch_image} css={{height:80,width:80,borderRadius:'50%',objectFit:'cover'}}/>
                </div>
                <div css={{display:'flex',flexFlow:'column',justifyContent:'center',alignItems:'center'}}>
                    <span css={theme=>({color:theme.textColor,fontSize:'1.7rem',fontWeight:500,wordBreak:'break-word',
                    textAlign:'center'})}>{branch.name}</span>
                    <span css={theme=>({fontSize:'1.2rem',color:theme.textLightColor,wordBreak:'break-word',
                    textAlign:'center'})}>@{branch.uri}</span>
                </div>
            </div>
            <div css={info}>
                <span css={smallBubble} onClick={handleFollowClick}>{branch.followers_count} followers</span>
                <span css={smallBubble} onClick={handleBranchesClick}>{branch.branch_count} branches</span>
            </div>
            {/*transitions.map(({item, key, props})=>(
                item && <animated.div key={key} style={props} css={{position:'absolute',height:'100%',width:'100%',
                display:'flex',justifyContent:'center',alignItems:'center',flexFlow:'column',willChange:'opacity, scale'}}>
                    <div role="button" css={theme=>button(theme)} onClick={handleProfileClick}>View profile</div>
                    <div role="button" css={theme=>button(theme)} onClick={handleRelatedClick}>{branch.branch_count} Related</div>
                    <div role="button" css={theme=>button(theme,'#f44336c4')} onClick={handleCancelClick}>Cancel</div>
                </animated.div>
            ))*/}
        </div>
    )
}