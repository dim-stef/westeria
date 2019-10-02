import React, {useEffect,useState} from 'react';
import {Link} from 'react-router-dom'
import {Helmet} from 'react-helmet'
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import {ChildBranch} from "./Branch"
import BranchFooter from "./Temporary"
import {FollowButton} from "./Card"

import axios from 'axios';


const linkContainer = theme => css({
    flexFlow:'column'
})

export function BranchLinks({match}){
    const theme = useTheme();
    const [branches,setBranches] = useState([]);
    const [next,setNext] = useState(null);

    async function getLinks(){
        let endpoint = match.params.pageNumber?`?page=${match.params.pageNumber}`:''
        let response = await axios.get(`/api/large/branches/${endpoint}`);
        setNext(response.data.next);
        setBranches(response.data.results);
    }

    useEffect(()=>{
        getLinks();
    },[])

    let nextPageNumber = next?new URL(next).searchParams.get('page'):null
    return(
        <>
        <Helmet>
            <meta name="robots" content="noindex, follow" />
            {match.params.pageNumber - 1>1? <link rel="prev" 
            href={`${window.location.origin}/google/links/branches/${match.params.pageNumber - 1}`}/>:null}
            {nextPageNumber?<link rel="next" 
            href={`${window.location.origin}/google/links/branches/${nextPageNumber}`}/>:null}

        </Helmet>
        <div className="flex-fill" css={theme=>linkContainer(theme)}>
            {branches.map(b=>{
                return(
                    <Link to={`/${b.uri}`} style={{color:theme.textColor,fontSize:'2em'}}>{b.uri}</Link>
                )
            })}
        </div>
        {next?<Link to={`/google/links/branches/${nextPageNumber}`}>Next Page</Link>:null}
        </>
    )
}

export function PostLinks({match}){
    const theme = useTheme();
    const [posts,setPosts] = useState([]);
    const [next,setNext] = useState(null);

    async function getLinks(){
        let endpoint = match.params.pageNumber?`?page=${match.params.pageNumber}`:''
        let response = await axios.get(`/api/large/posts/${endpoint}`);
        setNext(response.data.next);
        setPosts(response.data.results);
    }

    useEffect(()=>{
        getLinks();
    },[])

    let nextPageNumber = next?new URL(next).searchParams.get('page'):null
    let prevPageNumber = match.params.pageNumber - 1> 1 ? match.params.pageNumber -1:1

    return(
        <>
        <Helmet>
            <meta name="robots" content="noindex, follow" />
            {match.params.pageNumber - 1>1? <link rel="prev" 
            href={`${window.location.origin}/google/links/posts/${match.params.pageNumber - 1}`}/>:null}
            {nextPageNumber?<link rel="next" 
            href={`${window.location.origin}/google/links/posts/${nextPageNumber}`}/>:null}
            
        </Helmet>
        <div className="flex-fill" css={theme=>linkContainer(theme)}>
            {posts.map(p=>{
                let text;
                if(p.description.length>100){
                    text = `${p.description.substring(0,100)}...`
                }else{
                    text = p.description
                }

                return(
                    <Link to={`/${p.poster || p.poster.uri}/leaves/${p.id}`} style={{color:theme.textColor,fontSize:'2em'}}>
                    {text}</Link>
                )
            })}
        </div>
        {next?<Link to={`/google/links/posts/${nextPageNumber}`}>Next Page</Link>:null}
        </>
    )

}