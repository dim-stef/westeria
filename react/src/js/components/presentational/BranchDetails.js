import React, { Component } from "react";
import { Link } from 'react-router-dom'

export const BranchDetails = ({branch,
    className,
    flexBasis,
    branchDescription=false,
    branchChildren=false,
    branchJoin=false,
    branchEdit=false,
    editMode=false,
    onClick=null}) =>{
    return(
        <div className={className} style={{flexBasis:flexBasis}}>
            <BranchDetailsName branch={branch}/>
            {branchDescription ? <BranchDetailsDescription branch={branch}/> : null}
            <BranchDetailsMembers branch={branch}/>
            {branchChildren ? <BranchDetailsBranches branch={branch}/> : null}
            {branchJoin ? <BranchJoin branch={branch}/> : null}
            {branchEdit ? <BranchEdit branch={branch} editMode={editMode} onClick={onClick}/> : null}
        </div>
    )
}

const BranchDetailsName = ({branch}) =>{
    return(
        <div className="group-name">{branch.name}</div>
    )
}

const BranchDetailsDescription = ({branch}) =>{
    return(
        <div className="group-name" style={{fontSize:"0.5em"}}>{branch.description}</div>
    )
}


const BranchDetailsMembers = ({branch}) =>{
    return(
        <div className="group-followers">? Members</div>
    )
}

const BranchDetailsBranches = ({branch}) =>{
    return(
        <div className="group-branches">{branch.children.length} Branches</div>
    )
}

export const BranchJoin = ({branch,className=''}) =>{
    return(
        <button className={`group-join ${className}`}>JOIN</button>
    )
}

export class BranchEdit extends Component{

    constructor(props){
        super(props);

        this.state = {
            editMode:false,
        }

    }

    render(){
        let {onClick,className=''} = this.props;
        if(this.props.editMode){
            return(
                <button className={`group-join ${className}`} onClick={onClick}>Save Changes</button>    
            )
        }
        else{
            return(
                <button className={`group-join ${className}`} onClick={onClick}>Edit</button>    
            )
        }
    }
}