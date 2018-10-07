import React, { Component } from "react";
import ReactDOM from "react-dom";
import { resolve } from "url";
import { jsPlumb } from 'jsplumb'
import Group, { Node } from "../presentational/Group";
const uuidv1 = require('uuid/v1');

function fetchGroup(group, callback) {
    var uri;
    if (group === 'ROOT') {
        uri = '/api/';
    }
    else {
        uri = '/api/groups/'
    }
    return new Promise(resolve => {
        fetch(uri + group, { credentials: 'same-origin' })
            .then(results => {
                return results.json();
            })
            .then(data => {
                if (data.constructor === Array) {  //If group is ROOT
                    data = data[0];
                }
                callback(data);
                resolve();
            });
    })
}


export class NodeContainer extends Component {
    constructor(props) {
        super(props);

        this.groups = [];
        this.state = {
            doneCollecting: false,
            groups: [],
            root: null,
        }

        this.updateNodeContainer = this.updateNodeContainer.bind(this);
    }

    async collectGroupsWrapper(group, callback) {
        var groups = [];
        var results = await this.collectGroups(group, groups)
        console.log(results);
        callback(results);
    }

    async collectGroups(group, groups, parents = { key: '', uri: '', id: '', name: '', children: [] }, wrapper = { key: '', uri: '', id: '', name: '', children: [] }) {

        var uri;
        if (group === 'ROOT') {
            uri = '/api/';
        }
        else {
            uri = '/api/groups/'
        }

        var response = await fetch(uri + group, { credentials: 'same-origin' })
        var data = await response.json();


        if (data.constructor === Array) {  //If group is ROOT
            data = data[0];
        }
        wrapper.key = uuidv1();
        wrapper.uri = data.uri
        wrapper.id = data.id;
        wrapper.name = data.name;


        /*const children = [];   ALTERNATIVE
        for (const c of data.children) {
          children.push(this.collectGroups(c, groups, wrapper));
        }
        await Promise.all(children);*/

        data.children = await Promise.all(
            data.children.map(async (c) => {
                return this.collectGroups(c, groups, wrapper);
            })
        )
        if (parents.children) {
            parents.children.push(wrapper);
        }

        groups = parents;
        return groups;
    }

    updateNodeContainer(newRoot) {
        this.collectGroupsWrapper(newRoot, (groups) => {
            console.log(groups)
            if (groups.constructor === Object) {
                this.setState(prevState => ({
                    ...prevState,
                    groups: groups,
                    doneCollecting: true,
                    root: newRoot,
                }))
            }
        })
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.root != prevState.root) {
            this.collectGroupsWrapper(this.state.root, (groups) => {
                if (groups.constructor === Object) {
                    this.setState(prevState => ({
                        ...prevState,
                        doneCollecting: true,
                        groups: groups,
                    }))
                }
            })
        }
    }

    componentDidMount() {
        console.log("mount")
        
        jsPlumb.ready(function () {
            jsPlumb.setContainer("tree-container");
        });
        this.setState({ root: this.props.root })
    }

    render() { //TODO : runs 2 times if group buttons pressed (1 from updateNodeContainer, 1 from didupdate)
        if (this.state.doneCollecting === true) {
            return <Node groups={this.state.groups} updateNodeContainer={this.updateNodeContainer} key="node"/>
        }
        return (null);
    }
}

export class Tree extends Component {
    constructor(props){
        super(props)
        this.state = {
            root:null
        }
        console.log("cons")
    }

    componentDidMount(){
        this.setState({root:this.props.root})
    }

    render() {
        console.log("tree rendered")
        return (
            <div id="map-container" class="map-container" >
                <div id="tree-container" style={{ position: "relative" }}>
                    <ul id="tree" class="tree">
                        <NodeContainer root={this.props.root} key="NodeContainer"/>
                    </ul>
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

/*const wrapper = document.getElementById("tree");
wrapper ? ReactDOM.render(<NodeContainer root={"ROOT"} />, wrapper) : false;*/
