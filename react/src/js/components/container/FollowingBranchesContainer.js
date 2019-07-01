import React , {useEffect,useState,useContext} from "react"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {SmallBranch} from '../presentational/Branch'
import {UserContext,RefreshContext} from "./ContextContainer"
import {SkeletonBranchList} from "../presentational/SkeletonBranchList";
import axios from 'axios';

export function FollowingBranchesColumnContainer(){
    const context = useContext(UserContext);
    const [branches,setBranches] = useState([])

    async function getUserBranches(){
        let newBranches = []
        for await (const branch of context.currentBranch.follows){
            let response = await axios.get(`/api/branches/${branch}/`)
            let data = await response.data;
            newBranches.push(data)
        }
        return newBranches
    }

    async function populateBranches(){
        let branches = await getUserBranches();
        setBranches(branches);
    }

    useEffect(()=>{
        populateBranches();
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
        return <SkeletonBranchList/>
    }
}

function MyBranch({branch,children}){

    return(
        <div style={{margin:'10px 0',display:'flex',alignContent:'center'}}>
            <img style={{width:48,height:48,borderRadius:'50%'}} src={branch.branch_image}/>
            <div style={{display:'flex',flexDirection:'column',justifyContent:'center',marginLeft:10, flex:'1 1 auto'}}>
                <p style={{fontSize:'1.5rem',margin:0,fontWeight:700}}>{branch.name}</p>
                <span style={{fontSize:'1.4rem',color:'#404040'}}>@{branch.uri}</span>
            </div>
            {children}
        </div>
    )
}