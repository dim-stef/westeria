import React, {useEffect, useRef, useState} from 'react';
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import InfiniteScroll from 'react-infinite-scroll-component';
import {MoonLoader} from 'react-spinners';
import {Helmet} from 'react-helmet'
import RoutedHeadline from './RoutedHeadline'
import {BigBranchList} from "./BranchList"
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, 
    {
        retries:15,
        retryDelay: axiosRetry.exponentialDelay
    });

let CancelToken = axios.CancelToken;
let source = CancelToken.source();


function useFollowBranches(branchUri,type){
    const [branches,setBranches] = useState(null);
    const [next,setNext] = useState(null);
    const [hasMore,setHasMore] = useState(true);

    async function getFollowBranches(){
        if(!hasMore){
            return
        }

        let uri = next?next:`/api/branches/${branchUri}/${type}/`;
        let response = await axios.get(uri);

        if(!response.data.next){
            setHasMore(false);
        }

        setNext(response.data.next);
        setBranches(branches?[...branches,...response.data.results]:response.data.results);
    }

    useEffect(()=>{
        getFollowBranches();
    },[])

    return [branches,hasMore,getFollowBranches];
}



export function FollowPage({match,type="followed_by"}){
    const theme = useTheme();
    const [branches,hasMore,getMoreBranches] = useFollowBranches(match.params.uri,type);

    return(
        <div className="main-column" style={{flexBasis:'100%',WebkitFlexBasis:'100%',
        margin:0,border:`1px solid ${theme.borderColor}`}}>
        <RoutedHeadline headline={`@${match.params.uri}'s ${type==='following'?'following':'followers'}`}/>
        <InfiniteScroll
            dataLength={branches?branches.length:0}
            next={getMoreBranches}
            hasMore={hasMore}
            scrollableTarget={document.getElementById('mobile-content-container')?
            document.getElementById('mobile-content-container'):null}
            endMessage={
                <div></div>
            }
            loader={<div className="flex-fill center-items" style={{margin:20}}>
                <MoonLoader
                    sizeUnit={"px"}
                    size={20}
                    color={'#123abc'}
                    loading={true}
                />
            </div>}>
            <BigBranchList branches={branches||[]}/>
            </InfiniteScroll>
        </div>
    )
}