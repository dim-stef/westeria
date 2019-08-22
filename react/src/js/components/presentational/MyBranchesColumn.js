import React , {useEffect,useState,useContext} from "react"
import {UserContext,CachedBranchesContext} from "../container/ContextContainer"
import {useMyBranches} from "../container/BranchContainer"
import {SmallBranch} from "./Branch"
import {CreateNewBranch} from "./CreateNewBranch"
import {SkeletonBranchList} from "./SkeletonBranchList";
import axios from 'axios';

export default function MyBranchesColumnContainer({show=true,children}){
    const context = useContext(UserContext);
    const branches = useMyBranches();
    function handleClick(branch){
         
        context.changeCurrentBranch(branch);
    }

    if(branches.length>0 && show){
        return(
            <>
            {branches.map(b=>{
                let isCurrentBranch = context.currentBranch.uri==b.uri?true:false;
                let style = isCurrentBranch?
                {
                    backgroundColor:'#f5f5f5',
                    borderRadius:25
                }:null
                return (
                    <div style={style} key={b.id}>
                        <SmallBranch branch={b} hoverable={false}>
                            {isCurrentBranch?null:
                            <button onClick={()=>handleClick(b)} style={{border:0,backgroundColor:'transparent'}}><RightArrow/></button>}
                        </SmallBranch>
                    </div>
                )
            })}
            <CreateNewBranch/>
            </>
        )
    }else{
        if(!show){
            return <div style={{
                backgroundColor:'#f5f5f5',
                borderRadius:25
            }}><SmallBranch branch={context.currentBranch} hoverable={false}/></div>;
        }
        return <SkeletonBranchList/>
    }
}


function RightArrow(){
    return(
        <svg
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        viewBox="0 0 129 129"
        enableBackground="new 0 0 129 129"
        style={{height:15,fill:'#9cb1c3'}}
        >
            <path d="M40.4 121.3c-.8.8-1.8 1.2-2.9 1.2s-2.1-.4-2.9-1.2c-1.6-1.6-1.6-4.2 0-5.8l51-51-51-51c-1.6-1.6-1.6-4.2 0-5.8 1.6-1.6 4.2-1.6 5.8 0l53.9 53.9c1.6 1.6 1.6 4.2 0 5.8l-53.9 53.9z" />
        </svg>

    )
}