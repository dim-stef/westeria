import React , {useEffect,useState,useContext} from "react"
import {UserContext,RefreshContext} from "./ContextContainer"
import {SmallBranch} from '../presentational/Branch'
import {SkeletonBranchList} from "../presentational/SkeletonBranchList";
import axios from 'axios';

export function TrendingContainer(){
    const [branches,setBranches] = useState([])

    async function getTrendingBranches(){
        let response = await axios.get(`/api/trending/`);
        let trending = await response.data.results;

        return trending;
    }

    async function populateBranches(){
        let branches = await getTrendingBranches();
        setBranches(branches);
    }

    useEffect(()=>{
        populateBranches();
    },[])

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
