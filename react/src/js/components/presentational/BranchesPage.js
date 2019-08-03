import React, { Component,useState,useContext } from "react";
import {PureMobileGroup} from "./PureGroup"
import {ParentBranch,ChildBranch} from "./Branch"
import { Switch, Route, Link  } from 'react-router-dom'
import {BranchContainer,BranchesPageContainer} from '../container/BranchContainer'
import BranchFooter, {Modal,ToggleContent} from "./Temporary"
import {UserContext} from '../container/ContextContainer'
import MediaQuery from 'react-responsive';
import axios from 'axios';


function ownsBranch(branches,target){
    console.log("dsfsdf",branches,target)
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
    let externalTab = props.tabMatch.match.params.tab;
    let owns = ownsBranch(context.branches,props.branch)
    console.log("branch[ages",props)
    
    return(
        <div>
            <BranchTypeSelectionBar activeTab={externalTab} currentBranch={props.match}/>
            <div className="branch-details-container">
                <div className="branch-details-children">
                    <BranchesPageContainer type={externalTab} branch={props.branch} ownsBranch={owns}/>
                    {/*<BranchList data={props.data}/>*/}
                </div>
            </div>
        </div>
    )
}


function BranchTypeSelectionBar({activeTab,currentBranch}){
    let props = {currentBranch:currentBranch};

    return(
        <div className="branch-type-selection-bar">
            <div className="branch-type-selection-wrapper">
                <BranchParents {...props}/>
                <BranchSiblings {...props}/>
                <BranchChildren {...props}/>
            </div>
        </div>
    )
}

function BranchParents({currentBranch}){
    return(
        <Link to={`/${currentBranch}/branches/parents`} style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection">
                <h1>Parents</h1>
            </div>
        </Link>
    )
}

function BranchSiblings({currentBranch}){
    return(
        <Link to={`/${currentBranch}/branches/siblings`} style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection">
                <h1>Siblings</h1>
            </div>
        </Link>
    )
}

function BranchChildren({currentBranch}){
    return(
        <Link to={`/${currentBranch}/branches/children`} style={{height:'100%',flexBasis:'33%',color:'white',textDecoration:'none'}}>
            <div className="branch-selection">
                <h1>Children</h1>
            </div>
        </Link>
    )
}

export function BranchList(props){
    //style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}
    function renderBranches(branches){
        return(
            branches.map((c,i)=>{
                return [
                    
                    <MediaQuery query="(min-width: 1601px)" key={`${c.uri}-large`}>
                        <div className="branch-container flex-fill">
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c} pending={props.pending} requestId={c.requestId} viewedBranch={props.viewedBranch}/>
                        </div>
                    </MediaQuery>,
                    <MediaQuery query="(max-width: 1600px)" key={`${c.uri}-small`}>
                        <div className="branch-container flex-fill" >
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c} pending={props.pending} requestId={c.requestId} viewedBranch={props.viewedBranch}/>
                        </div>
                    </MediaQuery>
                ]
            })
        )
    }

    /*return(
        [
            renderBranches(props.branches.accepted),
            props.ownsBranch?renderBranches(props.branches.requests):null
        ]
    )*/
    return(
        renderBranches(props.branches)
    )

}

export function AddBranch({branch,type='child'}){
    const context = useContext(UserContext)
    const [clicked,setClicked] = useState(false);

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
        setClicked(false);
        let uri = `/api/branches/${context.currentBranch.uri}/create_branch_request/`;
        let data = {
            type:clicked?'remove':'add',
            relation_type:relation_type,
            request_to:branch.id
        }

        console.log(data,branch.id)
        axios.post(
            uri,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
            }).then(response => {
                console.log(response);
            }).catch(error => {
            console.log(error)
        })
    }


    return(
        
        <ToggleContent 
            toggle={show=>(
                <div className="branch-add-button branch-container flex-fill" style={{padding:10}} role="button" onClick={onClick}>
                    <AddBranchSvg width={100} height={100}/>
                    <h1 className="branch-add-text">{text}</h1>
                </div>
            )}
            content={hide => (
            <Modal onClick={hide}>
                <div style={{width:708,height:500,margin:'0 auto',marginTop:60,backgroundColor:'white'}} onClick={e=>e.stopPropagation()}> 
                    <div style={{padding:'30px 20px'}}></div>
                </div>
            </Modal>
      )}/>
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