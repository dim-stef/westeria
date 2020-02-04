import React, {useContext, useEffect, useState} from "react"
import {Link} from "react-router-dom";
import { useTheme } from 'emotion-theming'
import { css } from "@emotion/core";
import {CachedBranchesContext} from "./ContextContainer"
import {SmallBranch} from '../presentational/Branch'
import {SkeletonBranchList} from "../presentational/SkeletonBranchList";
import axios from 'axios';


const trending = theme => css({
    flexBasis:'22%',
    height:'22%',
    backgroundColor:theme.backgroundColor
})

const siteInfo = theme => css({
    display:'flex',
    justifyContent:'space-around',
    margin:15,
    fontSize:'1.4rem'
})

const link = theme => css({
    textDecoration:'none',
    color:theme.textLightColor,
    '&:hover':{
        textDecoration:'underline'
    }
})

export function TrendingWithWrapper(){
    const theme = useTheme();
    return(
        <div css={theme=>trending(theme)}>
            <div style={{padding:'10px 20px',border:`1px solid ${theme.borderColor}`}}>
            <p style={{
                    fontSize: "1.6em",
                    fontWeight: 600,
                    paddingBottom: 5,
                    margin: "-10px -20px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "10px 20px",
                    marginBottom:10
                }}>Popular now</p>
                <TrendingContainer/>
            </div>
            <div css={siteInfo}>
                <Link to="/about" css={theme=>link(theme)}>About</Link>
                <span style={{color:theme.textLightColor}}>© 2020 Westeria</span>
            </div>
            
        </div>
    )
}

export function TrendingContainer(){
    const branches = useTrending();

    if(branches.length>0){
        return(
            branches.map(b=>{
                return <SmallBranch branch={b} key={b.id}/>
            })
        )
    }else{
        return <SkeletonBranchList/>
    }
}


export function useTrending(){
    const cachedBranches = useContext(CachedBranchesContext);
    const [gotData,setGotData] = useState(false);
    const [branches,setBranches] = useState(cachedBranches.trending);

    async function getTrendingBranches(){
        let response = await axios.get(`/api/v1/trending/`);
        let trending = await response.data.results;
        cachedBranches.trending = trending;
        setGotData(true);
        return trending;
    }

    async function populateBranches(){
        let branches = await getTrendingBranches();
        setBranches(branches);
    }

    useEffect(()=>{
        if(branches.length==0 && !gotData){
            populateBranches();
        }
    },[])

    return branches;
} 
