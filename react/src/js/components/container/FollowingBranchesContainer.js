import React , {useEffect,useState,useContext} from "react"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {SmallBranch} from '../presentational/Branch'
import {UserContext,CachedBranchesContext} from "./ContextContainer"
import {SkeletonBranchList} from "../presentational/SkeletonBranchList";
import axios from 'axios';

export function FollowingBranchesColumnContainer(){
    const context = useContext(UserContext);
    const cachedBranches = useContext(CachedBranchesContext);
    const [gotData,setGotData] = useState(false);
    const [branches,setBranches] = useState(cachedBranches.following);

    async function getUserBranches(){
        let newBranches = []
        for await (const branch of context.currentBranch.follows){
            let response = await axios.get(`/api/branches/${branch}/`)
            let data = await response.data;
            newBranches.push(data)
        }
        cachedBranches.following = newBranches;
        setGotData(true);
        return newBranches
    }

    async function populateBranches(){
        let branches = await getUserBranches();
        setBranches(branches);
    }

    useEffect(()=>{
        if(branches.length == 0 && !gotData){
            populateBranches();
        }
    },[])

    if(branches.length>0){
        return(
            <div>
                {branches.map(b=>{
                    return <SmallBranch branch={b} key={b.id}/>
                })}
            </div>
        )
    }else{
        if(gotData){
            return <p>You are not following anyone</p>
        }else{
            return <SkeletonBranchList/>
        }
    }
}