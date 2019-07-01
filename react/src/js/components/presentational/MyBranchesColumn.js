import React , {useEffect,useState,useContext} from "react"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {UserContext,RefreshContext} from "../container/ContextContainer"
import {SmallBranch} from "./Branch"
import {SkeletonBranchList} from "./SkeletonBranchList";
import axios from 'axios';

export function MyBranchesColumnContainer({show=true}){
    const context = useContext(UserContext);
    const [branches,setBranches] = useState([])

    function handleClick(branch){
        console.log(context.changeCurrentBranch)
        context.changeCurrentBranch(branch);
    }

    async function getUserBranches(){
        let newBranches = []
        for await (const branch of context.branches){
            let response = await axios.get(`/api/branches/${branch.uri}/`)
            let data = await response.data;
            //let newBranches = [...branches, data];
            newBranches.push(data)
            //console.log(branches,newBranches);
            //setBranches(newBranches);
            
        }
        console.log("branches",newBranches)
        return newBranches
    }

    async function populateBranches(){
        let branches = await getUserBranches();
        setBranches(branches);
    }

    useEffect(()=>{
        populateBranches();
    },[])

    if(branches.length>0 && show){
        return(
            branches.map(b=>{
                console.log(b)
                return (
                    <SmallBranch branch={b} key={b.id}>
                        <button onClick={()=>handleClick(b)} style={{border:0,backgroundColor:'transparent'}}><RightArrow/></button>
                    </SmallBranch>
                )
            })
        )
    }else{
        if(!show){
            return null;
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