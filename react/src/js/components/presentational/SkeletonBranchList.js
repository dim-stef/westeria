import React , {useEffect,useState,useContext} from "react"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

export function SkeletonBranchList(){

    function getSkeletonBranches(){
        let branches = []
        for(var i =0; i<5;i++){
            let skeleton = <SkeletonBranch key={i}/>
            branches.push(skeleton)
        }
        return branches;
    }

    let branches=  getSkeletonBranches()
     
    return(
        <div>
            {branches}
        </div>
    )
}

function SkeletonBranch(){
    return(
        <div style={{margin:'10px 0',display:'flex',alignContent:'center'}}>
            <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                <Skeleton circle={true} width={48} height={48}/>
            </SkeletonTheme>
            
            <div style={{display:'flex',flexDirection:'column',justifyContent:'center',marginLeft:10, flex:'1 1 auto'}}>
                <SkeletonTheme color="#ceddea" highlightColor="#e1eaf3">
                    <Skeleton count={2} width="60%" height="40%"/>
                </SkeletonTheme>
            </div>
        </div>
    )
}