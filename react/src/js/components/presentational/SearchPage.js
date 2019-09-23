import React, {useEffect, useRef, useState} from 'react';
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import {Helmet} from 'react-helmet'
import {ChildBranch} from "./Branch"
import BranchFooter from "./Temporary"
import axios from 'axios';
import axiosRetry from 'axios-retry';

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
            <Trending/>
        </div>
    )
}

const searchContainer = () => css({
    display:'flex',
    flexFlow:'row wrap', 
    justifyContent:'space-between'
})

const searchList = theme => css({
    minWidth:250, 
    width:'30%',
    flexGrow:1,
    margin:10,
    flexFlow:'column',
    border:`1px solid ${theme.borderColor}`
})

function Search(){
    const theme = useTheme();
    const [results,setResults] = useState([])
    const [focused,setFocused] = useState(false);
    const [text,setText] = useState('');
    const wrapperRef = useRef(null);

    async function getResults(){
        let safeText = text.trim()
        const response = safeText ? await axios.get(`/api/search/?branch=${safeText}`,{
            cancelToken: source.token
          }): null
         
        if(response && Array.isArray(response.data)){
            setResults(response.data)
        }
    }

    useEffect(()=>{
        source.cancel('Operation canceled by the user.');
        CancelToken = axios.CancelToken;
        source = CancelToken.source();

        if(focused){
            getResults();
        }
    },[text])
     

    return(
        <>
        <Helmet>
            <title>Search - Subranch</title>
            <meta name="description" content="Branch not found." />
        </Helmet>
        <div ref={wrapperRef}>
            <div style={{padding:10}}>
                <input
                    placeholder="Type something"
                    className="search-button"
                    value={text}
                    onChange={e=> setText(e.target.value)}
                    onFocus={e=> setFocused(true)}
                    style={{border:`1px solid ${theme.borderColor}`,color:theme.textColor}}            
                />
            </div>
            <div className="flex-fill" css={searchContainer} >
                {results.length>0?
                results.map(r=>{
                    return  <div className="branch-container flex-fill" 
                            css={theme=>searchList(theme)}>
                                <ChildBranch style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                                branch={r}/>
                                <BranchFooter branch={r}/>
                            </div>
                           
                }):null}
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
                return  <div key={`${b.id}-trending`} className="branch-container" 
                        css={theme=>searchList(theme)}>
                            <ChildBranch style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={b}/>
                            <BranchFooter branch={b}/>
                        </div>
                       
            }):null}
        </div>
        <div className="flex-fill center-items">
            {next?<button className="load-more" onClick={handleClick}>Load more</button>:null}
        </div>
        </>
    )
}