import React, { useState,useEffect,useContext } from "react";
import axios from 'axios'
import {Helmet} from "react-helmet";
import {BranchList} from "../presentational/BranchesPage"
import {BranchPage} from "../presentational/Routes"
import {AddBranch} from "../presentational/BranchesPage"
import {UserActionsContext,CachedBranchesContext,UserContext} from "./ContextContainer"

export function BranchesPageContainer(props){
    const [branches,setBranches] = useState([]);
    const [pending,setPending] = useState([]);
    const userContext = useContext(UserContext);
    let branchUri = props.branch.uri;
    console.log(props);

    async function getBranches(branchUri,type="children"){
        let uri;

        uri = `/api/branches/${branchUri}/${type}/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let branches = {
            accepted:data.results
        }


        uri = `/api/branches/${branchUri}/received_requests`
        response = await axios.get(uri, {withCredentials: true});

        let requests = response.data.filter(r=>{
            return r.status == "on hold"
        }).map(r=>{
            r.request_from.requestId = r.id
            return r.request_from
        })

        branches.requests = requests;


        setPending(requests);
        setBranches(data.results);
    }


    useEffect(() => {
        getBranches(branchUri,props.type);
    },[])

    if(branches){
        let fillerBox = branches.length % 3 == 0?null:<div style={{flexBasis:'33%',order:1}}></div>

        return (
        <>
            <BranchList branches={branches} ownsBranch={props.ownsBranch} viewedBranch={props.branch}/>
            {/*fillerBox*/}
            {(userContext.isAuth && userContext.currentBranch.uri==props.branch.uri) || props.type=='siblings'?null:
            <AddBranch branch={props.branch} type={props.type}/>}
            {/*{pending.length>0 && props.ownsBranch?
            <>
                <h1 style={{width:'100%',fontSize:'3rem'}}>Pending</h1>
                <BranchList branches={pending} ownsBranch={props.ownsBranch} viewedBranch={props.branch} pending={true}/>
            </>:null}*/}
        </>
        )
    }else{
        return null
    }
}

export function usePendingRequests(branch){
    const userContext = useContext(UserContext);
    const [requests,setPendingRequests] = useState([]);

    async function getRequests(){
        let uri = `/api/branches/${branch.uri}/received_requests/`
        let response = await axios.get(uri, {withCredentials: true});

        let requests = response.data.filter(r=>{
            return r.status == "on hold"
        })

        setPendingRequests(requests)
    }

    useEffect(()=>{
        if(userContext.isAuth){
            getRequests();
        }
    },[])

    return requests;
}

export function BranchContainer(props){
    console.log("match",props)
    const actionContext = useContext(UserActionsContext)
    const [branches,setBranches] = useState(null);
    let branchUri = props.match.params.uri

    async function getBranches(branchUri){
        let uri;

        uri = `/api/branches/${branchUri}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        setBranches(parentData);
    }

    useEffect(()=>{
        console.log("remount2")
        actionContext.lastPostListType = 'branch';
    },[])

    useEffect(() => {
        getBranches(branchUri);
    },[branchUri])

    if(branches){
        return <BranchPage externalPostId={props.match.params.externalPostId} branch={branches} match={branchUri}/>
    }else{
        return null
    }
}


export function useMyBranches(){
    const context = useContext(UserContext);
    const cachedBranches = useContext(CachedBranchesContext);
    const [gotData,setGotData] = useState(false);
    const [branches,setBranches] = useState(cachedBranches.owned)

    async function getUserBranches(){
        let newBranches = []
        for await (const branch of context.branches){
            let response = await axios.get(`/api/branches/${branch.uri}/`)
            let data = await response.data;
            newBranches.push(data)
        }

        cachedBranches.owned = newBranches;
        setGotData(true);
        return newBranches
    }

    async function populateBranches(){
        let branches = await getUserBranches();
        context.branches = branches;
        setBranches(branches);
    }

    useEffect(()=>{
        if(branches.length == 0 && !gotData){
            populateBranches();
        }
    },[])

    return branches
}