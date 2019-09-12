import React, { Component,useState,useContext,useEffect } from "react";
import {Helmet} from 'react-helmet'
import {ParentBranch,ChildBranch} from "./Branch"
import { Switch, Route, Link, NavLink  } from 'react-router-dom'
import {BranchContainer,BranchesPageContainer} from '../container/BranchContainer'
import BranchFooter, {Modal,ToggleContent} from "./Temporary"
import {UserContext} from '../container/ContextContainer'
import {usePendingRequests} from "../container/BranchContainer"
import MediaQuery from 'react-responsive';
import axios from 'axios';


function ownsBranch(branches,target){
    return branches.some(b=>{
        return b.uri==target.uri
    })
}


export function BranchesPageRoutes(props){
    return(
        <Switch>
            <Route exact path={`/${props.match}/branches/:tab?`} component={(tabMatch) => 
                <BranchesPage {...props} tabMatch={tabMatch}/>}
            />
        </Switch>
    )
}

export function BranchesPage(props){
    const context = useContext(UserContext);
    let requests = usePendingRequests(props.branch);
    let externalTab = props.tabMatch.match.params.tab;
    let owns = context.isAuth?ownsBranch(context.branches,props.branch):false

    if(requests.length>0){
        if(externalTab=='children' || !externalTab){
            requests = requests.filter(r=>r.relation_type=='child');
        }else if(externalTab=='parents'){
            requests = requests.filter(r=>r.relation_type=='parent');
        }else{
            requests.length = 0;
        }
    }

    let title = externalTab?externalTab.replace(externalTab[0], externalTab[0].toUpperCase()):'Children'
    return(
        <>
        <Helmet>
            <title>{props.branch.name} @({props.branch.uri}) {title} {' '} - Subranch</title>
            <meta name="description" content="Your messages." />
        </Helmet>
        <div>
            <BranchTypeSelectionBar activeTab={externalTab} currentBranch={props.match}/>
            <div className="branch-details-container">
                <div className="branch-details-children">
                    <BranchesPageContainer type={externalTab} branch={props.branch} ownsBranch={owns}/>
                    {requests.length>0 && owns?
                    <>
                        <h1 style={{width:'100%',fontSize:'3rem'}}>Pending</h1>
                        <BranchList branches={requests.map(r=>r.request_from)} requestBundles={requests.map(r=>{
                            return {branch:r.request_from.uri,requestId:r.id}
                        })} 
                        ownsBranch={owns} 
                        viewedBranch={props.branch} pending={true} pendingType={externalTab}/>
                    </>:null}
                    {/*<BranchList data={props.data}/>*/}
                </div>
            </div>
        </div>
        </>
    )
}


function BranchTypeSelectionBar({activeTab,currentBranch}){
    let props = {currentBranch:currentBranch};
    return(
        <div className="branch-type-selection-bar">
            <div className="branch-type-selection-wrapper">
                <BranchParents {...props}/>
                <BranchSiblings {...props}/>
                <BranchChildren {...props} activeTab={activeTab}/>
            </div>
        </div>
    )
}

function BranchParents({currentBranch}){
    return(
        <NavLink exact to={`/${currentBranch}/branches/parents`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection">
                <h1>Parents</h1>
            </div>
        </NavLink>
    )
}

function BranchSiblings({currentBranch}){
    return(
        <NavLink exact to={`/${currentBranch}/branches/siblings`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection">
                <h1>Siblings</h1>
            </div>
        </NavLink>
    )
}

function BranchChildren({currentBranch,activeTab}){

    // if activeTab is undefined render default BranchChildren

    return(
        <NavLink exact to={`/${currentBranch}/branches/children`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none',backgroundColor:activeTab?null:'#1c87dc'}}>
            <div className="branch-selection">
                <h1>Children</h1>
            </div>
        </NavLink>
    )
}

export function BranchList(props){
    //style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}
    return(
        props.branches.map((c,i)=>{
            let requestId = null;
            if(props.requestBundles){
                requestId = props.requestBundles.find(b=>c.uri==b.branch).requestId
            }

            return [
                <div className="branch-container flex-fill" >
                    <ChildBranch
                    style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                    branch={c}>
                        
                    </ChildBranch>
                    <BranchFooter branch={c} pending={props.pending} requestId={requestId} 
                    viewedBranch={props.viewedBranch}/>
                </div>
            ]
        })
    )

}

export function AddBranch({branch,type='children'}){
    const context = useContext(UserContext)
    const [sumbitted,setSubmitted] = useState(false);
    const [requestStatus,setRequestStatus] = useState(null);

    let text;
    let relation_type;

    if(type=='children'){
        text = 'Become child';
        relation_type = 'child';
    }else if(type=='parents'){
        text = 'Become parent';
        relation_type = 'parent';
    }

    const onClick = () =>{
        
        let uri = `/api/branches/${context.currentBranch.uri}/create_branch_request/`;
        let data = {
            type:sumbitted?'remove':'add',
            relation_type:relation_type,
            request_to:branch.id
        }

        axios.post(
            uri,
            data,
            
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                
            }).then(response => {
                setRequestStatus(response.data.status)
                setSubmitted(true);
            }).catch(error => {
        })
    }

    async function getSentRequests(){
        const response = await axios.get(`/api/branches/${context.currentBranch.uri}/sent_requests/`);

        // try to find existing request
        let sentRequest = response.data.find(r=>{
            return r.request_to.id == branch.id && r.relation_type == relation_type
        })
        setRequestStatus(sentRequest?sentRequest.status:null)
    }

    useEffect(()=>{
        getSentRequests();
    },[])

    return(
        !requestStatus?
        <div className="branch-add-button branch-container flex-fill" style={{padding:10,cursor:'pointer'}}
            role="button" onClick={onClick}>  
            <AddBranchSvg width={100} height={100}/>
            <h1 className="branch-add-text">{text}</h1>
            
        </div>
        :sumbitted && requestStatus == 'accepted'?
            <BranchList branches={[context.currentBranch]} ownsBranch={true} viewedBranch={branch} pending={false}/>
            
            :
            <>
                <RequestOnHold status={requestStatus}/>
                <RequestDeclined status={requestStatus}/>
            </>

    )
}

function RequestOnHold({status}){
    return(
        status=='on hold'?
        <div className="branch-add-button branch-container flex-fill" style={{padding:10}} role="button">
            <p style={{fontSize:'2rem',color:'#7a8c9c'}}>Request has been sent. Waiting for approval</p>
        </div>:null
    )
}

function RequestDeclined({status}){
    return(
        status=='declined'?
        <div className="branch-add-button branch-container flex-fill" style={{padding:10}}>
            <p style={{fontSize:'2rem',color:'#7a8c9c'}}>Request has been declined.</p>
        </div>:null
    )
}


function AddBranchSvg({width,height}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            className="branch-add-icon"
            style={{ fill: "#71859b", width: width, height: height }}
            id="branchAddIcon"
            viewBox="0 0 357 357"
            xmlSpace="preserve"
            >
            <path d="M357 204H204v153h-51V204H0v-51h153V0h51v153h153v51z" />
        </svg>

    )
}