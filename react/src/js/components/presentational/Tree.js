import React, { Component } from "react";
import ReactDOM from "react-dom";
import MediaQuery from 'react-responsive';
import {GroupsContainer, MobileGroupsContainer} from '../container/BranchContainer'


export class Tree extends Component {
    constructor(props){
        super(props)
        this.state = {
            root:this.props.root
        }
    }

    componentDidMount(){
        console.log("props",this.props)
    }

    render() {
        return(
            <GroupsContainer root={this.state.root} branches={this.props.branches} key="Groups"/>
        )
    }
}


export class Test extends Component {
    render(){
        return(
            <div>1</div>
        )
    }
}