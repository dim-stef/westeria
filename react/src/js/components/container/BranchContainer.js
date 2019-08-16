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
            {(userContext.isAuth && userContext.currentBranch.uri==props.branch.uri) || props.type=='siblings'?null:
            <AddBranch branch={props.branch} type={props.type}/>}
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
    const actionContext = useContext(UserActionsContext)
    const [branch,setBranch] = useState(null);
    const [loaded,setLoaded] = useState(false);
    let branchUri = props.match.params.uri

    async function getBranch(branchUri){
        let uri;

        uri = `/api/branches/${branchUri}/`;
        try{
            let parentResponse = await axios.get(uri);
            let parentData = parentResponse.data;
            setBranch(parentData);
        }
        catch(err){
            //console.log(err.response)
        }
        setLoaded(true);
    }

    useEffect(()=>{
        actionContext.lastPostListType = 'branch';
    },[])

    useEffect(() => {
        getBranch(branchUri);
    },[branchUri])

    if(loaded){
        if(branch){
            return <BranchPage externalPostId={props.match.params.externalPostId} branch={branch} match={branchUri}/>
        }else{
            return <p style={{margin:'0 auto',fontSize:'3rem',fontWeight:'bold',textAlign:'center'}}>Nothing seems to be here :/</p>
        }
    }else{
        return null;
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