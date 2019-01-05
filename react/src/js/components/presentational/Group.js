import React, { Component } from "react";
import sizeMe from "react-sizeme"
import {PureGroup,PureMobileGroup, PureTestGroup, Branch} from "./PureGroup"
import {BranchDetails} from "./BranchDetails"
import {BranchNavigation} from "./BranchNavigation"
import {UserContext} from '../container/ContextContainer'
import {BranchJoin, BranchEdit} from './BranchDetails'
import MediaQuery from 'react-responsive';
const uuidv1 = require('uuid/v1');

const REACT_VERSION = React.version;
console.log(REACT_VERSION);

function ownBranch(targetBranch, branches){
    return branches.find(b=>{
        return b.uri === targetBranch.uri
    })
}

export class Groups extends Component {
    constructor(props){
        super(props);
        this.state = {
            branches:this.props.branches,
        }
    }

    render(){
        var branches = <div className="branch-details-container">
                        <div className="branch-details-children">
                            <BranchList branches={this.props.branches}/>
                        </div>
                    </div>
        return (
            <div className="flex-fill" 
            style={{display: 'flex',flexFlow:'row wrap'}}>
                <ParentBranchWrapper branch={this.props.branches.parent}/>
                {branches}
            </div>
        )
    }
}

class BranchList extends Component{
    static contextType = UserContext
    
    render(){
        return(
            this.props.branches.children.map((c)=>{
                
                var owned = ownBranch(c,this.context.branches);
                var branchDetails;
                var branchFooter;
                branchDetails = <BranchDetails branch={c} className="group-details" branchChildren/>
                if(owned){
                    branchFooter = <BranchFooter branch={c}>
                                        <BranchEdit branch={c} className="branch-view-button"/>
                                    </BranchFooter>
                }
                else{
                    branchFooter = <BranchFooter branch={c}>
                                        <BranchJoin branch={c} className="branch-view-button"/>
                                    </BranchFooter>
                }
                
                
                return [
                    <MediaQuery query="(min-width: 1600px)" key={`${c.uri}-large`}>
                        <div className="branch-container" style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}>
                            <Branch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                {branchDetails}
                            </Branch>
                            {branchFooter}
                        </div>
                    </MediaQuery>,
                    <MediaQuery query="(max-width: 1601px)" key={`${c.uri}-small`}>
                        <div className="branch-container" style={{display:'flex', width:'100%',flexBasis:'49%',flexFlow:'column'}}>
                            <Branch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                {branchDetails}
                            </Branch>
                            {branchFooter}
                        </div>
                    </MediaQuery>
                ]
            })
        )
    }
}



class BranchFooter extends Component{
    render(){
        return(
            <div className="branch-footer flex-fill">
                <BranchDescription branch={this.props.branch}/>
                {this.props.children}
            </div>
        )
    }
}


class BranchDescription extends Component{
    render(){
        return(
            <div className="branch-description">
                {this.props.branch.description}
            </div>
        )
    }
}


class ParentBranchWrapper extends Component {
    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            editMode:false
        }

        this.onClick = this.onClick.bind(this);
    }

    onClick(){
        this.setState((previousState, currentProps) => {
            return {
                editMode:!previousState.editMode
            }
        })
    }

    render(){
        var styleName = 'parent';

        var owned = ownBranch(this.props.branch,this.context.branches);
        var branchDetails;

        if(owned){
            branchDetails = <BranchDetails className="parent-branch-details"
             branch={this.props.branch}
             branchDescription branchEdit 
             onClick={this.onClick}
             editMode={this.state.editMode}
             />
        }
        else{
            branchDetails = <BranchDetails className="parent-branch-details" 
            branch={this.props.branch} 
            branchDescription 
            branchJoin 
            onClick={this.onClick}
            />
        }

        return(
            <div style={{display:'flex',flexDirection:'column',flexBasis:'100%'}}>
                <div ref={ (divElement) => {this.branch = divElement}} style={{flexBasis:'100%'}}>
                    <Branch 
                        styleName={styleName}
                        style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%'}} 
                        branch={this.props.branch}
                        branchNavigation
                        editMode={this.state.editMode}
                        type="parent"
                    >{branchDetails}</Branch>
                </div>
            </div>
        )
    }
}


export class MobileGroups extends Component{
    constructor(props){
        super(props);
        this.state = {
            branches:this.props.branches
        }
    }

    collectGroups(){
        let branches = this.state.branches.children.map((c)=>{
            var styleName = '';
            return (
                <PureMobileGroup styleName={styleName} style={{marginTop:10,marginBottom:0}} branch={c}/>
            )
        })
        return branches;
    }

    render(){
        var branches = this.collectGroups();
        var parent = this.state.branches.parent;
        var styleName = 'parent';
        return (
            <div style={{display: 'flex', flexFlow:'column', width:'100%', alignItems:'center',marginTop: '100px'}}>
                <PureMobileGroup styleName={styleName} style={{marginTop:0,marginBottom:30}} branch={parent}/>
                {branches}
            </div>
        )
    }
}
