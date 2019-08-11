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

    function arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
      
        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.
        // Please note that calling sort on an array will modify that array.
        // you might want to clone your array first.
      
        for (var i = 0; i < a.length; ++i) {
          if (a[i] != b[i]) return false;
        }
        return true;
      }

    useEffect(()=>{
        if(context.isAuth){
            // if currentBranch changed then we need to get new branches
            // so we compare the ones on context with the ones of the currentBranch
            let currentFollowing = branches.length>0?branches.map(b=>{
                return b.uri
            }):[]
            
            if(!arraysEqual(currentFollowing,context.currentBranch.follows) && (currentFollowing.length>0 || context.currentBranch.follows.length>0)){
                populateBranches();
            }
    
            if(branches.length == 0 && !gotData){
                populateBranches();
            }
        }
    })


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
            return <p style={{fontSize: '2rem', color:'#8f9ca7'}}>You are not following anyone</p>
        }else{
            if(context.isAuth){
                return <SkeletonBranchList/>
            }else{
                return null
            }
        }
    }
}