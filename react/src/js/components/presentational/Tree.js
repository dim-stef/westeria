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
    }

    componentDidMount(){
        console.log("props",this.props)
    }

    render() {
        return (
            <div id="map-container" className="map-container" >
                <div className="tree-container" id="tree-container" style={{ position: "relative", width:"100%" }}>
                    
                    <MediaQuery query="(min-width: 1201px)">
                        {/*<NodeContainer root={this.state.root} key="NodeContainer"/>*/}
                        <GroupsContainer root={this.state.root} key="Groups"/>
                    </MediaQuery>
                    <MediaQuery query="(max-width: 1200px)">
                        <MobileGroupsContainer root={this.state.root} key="MobileGroupsContainer"/>
                    </MediaQuery>
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