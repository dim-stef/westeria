import React, {useContext, useEffect, useState, useRef,useLayoutEffect} from "react";
import {Helmet} from 'react-helmet'
import {useMediaQuery} from "react-responsive";
import {ChildBranch} from "./Branch"
import {NavLink, Route, Switch} from 'react-router-dom'
import {BranchesPageContainer, usePendingRequests} from '../container/BranchContainer'
import BranchFooter from "./Temporary"
import {TooltipChain,Tooltip} from "./Tooltip"
import {UserContext,TourContext} from '../container/ContextContainer'
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
            <BranchTypeSelectionBar activeTab={externalTab} branch={props.branch} currentBranch={props.match}/>
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


function BranchTypeSelectionBar({activeTab,currentBranch,branch}){
    const ref = useRef(null);
    const tourContext = useContext(TourContext)
    const [top,setTop] = useState(0);
    const [listWidth,setListWidth] = useState(0);
    const isMobile = useMediaQuery({
        query: '(max-device-width: 767px)'
    })

    useLayoutEffect(()=>{
        if(ref.current){
            setTop(ref.current.clientHeight)
            setListWidth(ref.current.clientWidth);
        }
    },[ref.current])

    function onLeave(){
        tourContext.seenBranchTabs = true;
    }

    // 20 pixels from excess padding
    let width = isMobile?listWidth - 20:listWidth/3 - 20;
    let props = {currentBranch:currentBranch};
    return(
        <div className="branch-type-selection-bar" style={{position:'relative'}} ref={ref}>
            <div className="branch-type-selection-wrapper flex-fill">
                <BranchParents {...props} count={branch.parent_count}/>
                <BranchSiblings {...props} count={branch.sibling_count}/>
                <BranchChildren {...props} count={branch.children_count} activeTab={activeTab}/>
            </div>
            {localStorage.getItem('has_seen_tour')==='false' && !tourContext.seenBranchTabs?
            <TooltipChain delay={12000} onLeave={onLeave}>
                <Tooltip position={{left:0,top:top}}>
                    <p css={{fontWeight:400,width:width}}>
                    <b>Parents</b> are branches that contain more <b>general</b> content than {branch.name}</p>
                </Tooltip>
                <Tooltip position={{left:isMobile?0:listWidth/3,top:top}}>
                    <p css={{fontWeight:400,width:width}}>
                    <b>Siblings</b> occur naturally between parents and children. 
                    They usually contain <b>similar</b> content to {branch.name}
                    </p>
                </Tooltip>
                <Tooltip position={{left:isMobile?0:listWidth/3 * 2,top:top}}>
                    <p css={{fontWeight:400,width:width}}>
                    <b>Children</b> are branches that contain more <b>specific</b> content than {branch.name}</p>
                </Tooltip>
            </TooltipChain>:null}
            
        </div>
    )
}

function BranchParents({currentBranch,count}){
    return(
        <NavLink exact to={`/${currentBranch}/branches/parents`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',width:'100%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection flex-fill center-items">
                <h1>{count>0?`${count} `:''}Parents</h1>
            </div>
        </NavLink>
    )
}

function BranchSiblings({currentBranch,count}){
    return(
        <NavLink exact to={`/${currentBranch}/branches/siblings`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',width:'100%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection flex-fill center-items">
                <h1>{count>0?`${count} `:''}Siblings</h1>
            </div>
        </NavLink>
    )
}

function BranchChildren({currentBranch,count,activeTab}){
    return(
        <NavLink exact to={`/${currentBranch}/branches/children`} activeStyle={{backgroundColor:'#1c87dc'}}
        style={{height:'100%',width:'100%',color:'white',textDecoration:'none',backgroundColor:activeTab?null:'#1c87dc'}}>
            <div className="branch-selection flex-fill center-items">
                <h1>{count>0?`${count} `:''}Children</h1>
            </div>
        </NavLink>
    )
}

export function BranchList(props){
    //style={{display:'flex', width:'100%',width:'100%',flexFlow:'column'}}
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
        if(context.isAuth){
            getSentRequests();
        }
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