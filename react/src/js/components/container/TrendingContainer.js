import React, {useContext, useEffect, useState} from "react"
import {CachedBranchesContext} from "./ContextContainer"
import {SmallBranch} from '../presentational/Branch'
import {SkeletonBranchList} from "../presentational/SkeletonBranchList";
import axios from 'axios';


export function TrendingWithWrapper(){
    return(
        <div style={{ flexBasis:'22%',height:'max-content', backgroundColor:'white'}}>
            <div className="box-border" style={{padding:'10px 20px'}}>
            <p style={{
                    fontSize: "1.6em",
                    fontWeight: 600,
                    paddingBottom: 5,
                    margin: "-10px -20px",
                    backgroundColor: "#219ef3",
                    color: "white",
                    padding: "10px 20px",
                    marginBottom:10
                }}>Popular now</p>
                <TrendingContainer/>
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
