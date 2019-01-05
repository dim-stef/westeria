import React, { Component } from "react";
import {Branch} from "../presentational/PureGroup"
import {UserContext} from "./ContextContainer"
import {BranchDetails} from "../presentational/BranchDetails"
import {BranchPicture} from "../presentational/BranchPicture"
import {MyBranches} from "../presentational/MyBranches"
import axios from 'axios'



export default class MyBranchesContainer extends Component{
    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            branches:null,
            parentBranches:null,
            childBranches:null,
            branchDisplayed:null
        }

        this.updateBranchDisplayed = this.updateBranchDisplayed.bind(this);
        this.getChildBranches = this.getChildBranches.bind(this);
        this.getParentBranches = this.getParentBranches.bind(this);
    }

    updateBranchDisplayed(uri){
        var newBranch = this.context.branches.find(b=>{
            return b.uri === uri
        })
        this.setState({branchDisplayed:newBranch,childBranches:null,parentBranches:null},()=>{
            this.getChildBranches();
            this.getParentBranches();
        })
    }

    async getChildBranches(){
        var response;
        let url = `/api/branches/${this.state.branchDisplayed.uri}/children/`
        while(url){
            response = await axios.get(url)
            url = response.data.next;
            if(!this.state.childBranches){
                this.setState({childBranches:response.data.results})
            }
            else{
                this.setState(prevState=>{
                    var newChildren = prevState.childBranches.concat(response.data.results)
                    return {childBranches:newChildren}
                })
            }            
        }
    }

    async getParentBranches(){
        var response;
        let url = `/api/branches/${this.state.branchDisplayed.uri}/parents/`
        while(url){
            response = await axios.get(url)
            url = response.data.next;
            if(!this.state.parentBranches){
                this.setState({parentBranches:response.data.results})
            }
            else{
                this.setState(prevState=>{
                    var newParents = prevState.parentBranches.concat(response.data.results)
                    
                    return {parentBranches:newParents}
                })
            }            
        }
    }


    componentDidMount(){
        this.setState({
                branches:this.context.branches,
                branchDisplayed:this.context.currentBranch
            },()=>{
                this.getChildBranches();
                this.getParentBranches();
            })
    }

    render(){
        if(this.state.branches){
            return(
                <div className="settings-wrapper">
                    <div className="settings-layout">
                        <div className="branch-selection-tab">
                            <BranchProfilePictures branches={this.state.branches} updateBranchDisplayed={this.updateBranchDisplayed}/>
                        </div>
    
                        <div className="branch-settings-tab">
                        <MyBranches branchDisplayed={this.state.branchDisplayed} childBranches={this.state.childBranches} parentBranches={this.state.parentBranches}/>
                            
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }
}

class BranchProfilePictures extends Component{
    constructor(props){
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    onClick(e,uri){
        this.props.updateBranchDisplayed(uri);
        var elements = document.getElementsByClassName("branch-selector");
        for (let e of elements)
        {
            console.log(e)
            e.classList.remove("selected-branch")
        }

        e.currentTarget.parentElement.classList.add("selected-branch")
    }

    render(){
        return(
            this.props.branches.map(b=>{
                return (
                    <div className="branch-selector" key={b.uri}>
                        <BranchPicture 
                        uri={b.uri}
                        picture={b.branch_image}
                        type="button"
                        dimensions={{width:128,height:128}}
                        onClick={this.onClick}
                        
                        />
                        <p style={{margin:0,fontSize:'2em'}}>{b.name}</p>
                    </div>
                )
                
            })
        )
    }
}