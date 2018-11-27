import React, { Component } from "react";
import ReactDOM from "react-dom";
import MediaQuery from 'react-responsive';
import {GroupsContainer, MobileGroupsContainer} from '../container/GroupContainer'

export class Tree extends Component {
    constructor(props){
        super(props)
        this.state = {
            root:this.props.match.params.uri ? this.props.match.params.uri : this.props.root
        }
        console.log("props location =",this.props.match.params.uri)
    }

    render() {
        return (
            <div id="map-container" class="map-container" >
                <div id="tree-container" style={{ position: "relative", width:"100%" }}>
                    
                    <MediaQuery query="(min-width: 1201px)">
                        {/*<NodeContainer root={this.state.root} key="NodeContainer"/>*/}
                        <GroupsContainer root={this.state.root} key="Groups"/>
                    </MediaQuery>
                    <MediaQuery query="(max-width: 1200px)">
                        <MobileGroupsContainer root={this.state.root} key="MobileGroupsContainer"/>
                    </MediaQuery>
                    {/* For tree view 
                    <ul id="tree" class="tree">
                    </ul>*/}
                </div>
            </div>
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