import React , {useEffect,useState,useContext} from "react"
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {UserContext,RefreshContext} from "../container/ContextContainer"
import axios from 'axios';

export function MyBranchesColumnContainer(){
    const context = useContext(UserContext);
    const [branches,setBranches] = useState([])

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

    if(branches.length>0){
        return(
            branches.map(b=>{
                console.log(b)
                return <MyBranch branch={b}/>
            })
        )
    }else{
        return <SkeletonBranchList/>
    }
    
}


function SkeletonBranchList(){

    function getSkeletonBranches(){
        let branches = []
        for(var i =0; i<5;i++){
            let skeleton = <SkeletonBranch/>
            branches.push(skeleton)
        }
        return branches;
    }

    let branches=  getSkeletonBranches()
    console.log("branches",branches)
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

function MyBranch({branch}){
    const context = useContext(UserContext);

    function handleClick(){
        console.log(context.changeCurrentBranch)
        context.changeCurrentBranch(branch);
    }
    return(
        <div style={{margin:'10px 0',display:'flex',alignContent:'center'}}>
            <img style={{width:48,height:48,borderRadius:'50%'}} src={branch.branch_image}/>
            <div style={{display:'flex',flexDirection:'column',justifyContent:'center',marginLeft:10, flex:'1 1 auto'}}>
                <p style={{fontSize:'1.5rem',margin:0,fontWeight:700}}>{branch.name}</p>
                <span style={{fontSize:'1.4rem',color:'#404040'}}>@{branch.uri}</span>
            </div>
           <button onClick={handleClick} style={{border:0,backgroundColor:'transparent'}}><RightArrow/></button>
        </div>
    )
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