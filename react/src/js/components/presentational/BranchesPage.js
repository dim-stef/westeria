import React, { Component,useState } from "react";
import {PureMobileGroup} from "./PureGroup"
import {ParentBranch,ChildBranch} from "./Branch"
import { Switch, Route, Link  } from 'react-router-dom'
import {BranchContainer,BranchesPageContainer} from '../container/BranchContainer'
import BranchFooter, {Modal,ToggleContent} from "./Temporary"
import {UserContext} from '../container/ContextContainer'
import MediaQuery from 'react-responsive';


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
    let externalTab = props.tabMatch.match.params.tab;
    console.log("branch[ages",props)
    return(
        <div>
            <BranchTypeSelectionBar activeTab={externalTab} currentBranch={props.match}/>
            <div className="branch-details-container">
                <div className="branch-details-children">
                    <BranchesPageContainer type={externalTab} branch={props.branch}/>
                    {/*<BranchList data={props.data}/>*/}
                    <AddBranch/>
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
        <div className="branch-selection">
            <h1>Siblings</h1>
        </div>
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

export class BranchList extends Component{
    static contextType = UserContext
    
    render(){
        return(
            this.props.branches.map((c,i)=>{
                return [
                    
                    <MediaQuery query="(min-width: 1601px)" key={`${c.uri}-large`}>
                        <div className="branch-container" style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}>
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c}/>
                        </div>
                    </MediaQuery>,
                    <MediaQuery query="(max-width: 1600px)" key={`${c.uri}-small`}>
                        <div className="branch-container" style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}>
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c}/>
                        </div>
                    </MediaQuery>   
                ]
            })
        )
    }
}

function AddBranch(){
    const [clicked,setClicked] = useState(false);

    const onClick = () =>{
        setClicked(!clicked);
    }

    let style={
        marginTop:10,
        display:'flex',
        flexFlow:'column',
        height:334,
        backgroundColor:'rgb(216, 225, 234)',
        justifyContent:'center',
        alignItems:'center'
    }
    let largeStyle={...style,flexBasis:'49%'};
    let smallStyle={...style,flexBasis:'33%'};

    return(
        
        <ToggleContent 
            toggle={show=>(
                <div className="branch-add-button" role="button" onClick={show}>
                    <AddBranchSvg width={100} height={100}/>
                    <h1 className="branch-add-text">Add Branch</h1>
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