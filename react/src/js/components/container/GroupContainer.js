import React, { Component } from "react";
import ReactDOM from "react-dom";
import { resolve } from "url";
import { jsPlumb } from 'jsplumb'
import MediaQuery from 'react-responsive';
const uuidv1 = require('uuid/v1');
import { Node, MobileGroups } from "../presentational/Group";


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

        this.state = {
            doneCollecting: false,
            groups: [],
            root: this.props.root,
        }

        this.updateNodeContainer = this.updateNodeContainer.bind(this);
    }

    async collectGroupsWrapper(group, callback) {
        const results = await this.collectGroups(group)
        const uri = '/api/groups/' + group + '/'
        const respone = await fetch(uri, { credentials: 'same-origin' })
        var parentData = await respone.json()
        parentData.children = results.children;
        parentData['key'] = uuidv1();
        var wrapper = {
            key: '',
            uri: '',
            id: '', 
            name: '', 
            children: [parentData]
        }
        
        callback(wrapper);
    }

    async collectGroups(group, 
        parents = { key: '', uri: '', id: '', name: '', children: [] }) {

        var uri;

        //uri = '/api/groups/' + group +'/children/?limit=10'
        uri = `/api/groups/${group}/children/?limit=10`
        console.log(uri)
        var response = await fetch(uri, { credentials: 'same-origin' })
        var data = await response.json();

        /*const children = [];   ALTERNATIVE
        for (const c of data.children) {
          children.push(this.collectGroups(c, groups, wrapper));
        }
        await Promise.all(children);*/

        data.results = await Promise.all(
            data.results.map(async (c) => {
                let child = {
                    key:uuidv1(),
                    uri:c.uri,
                    id:c.id,
                    name:c.name,
                    children:[]
                }
                parents.children.push(child);
                console.log(parents)
                return this.collectGroups(c.uri, child);
            })
        )

        return parents;
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


    componentDidMount() {
        console.log("mount")
        
        jsPlumb.ready(function () {
            jsPlumb.setContainer("tree");
        });

        this.collectGroupsWrapper(this.state.root, (groups) => {
            this.setState(prevState => ({
                ...prevState,
                doneCollecting: true,
                groups: groups,
            }))
        })
    }

    render() { //TODO : runs 2 times if group buttons pressed (1 from updateNodeContainer, 1 from didupdate)
        if (this.state.doneCollecting === true) {
            return <Node groups={this.state.groups} updateNodeContainer={this.updateNodeContainer} key="node"/>
        }
        return (null);
    }
}


class MobileGroupsContainer extends Component{
    constructor(props){
        super(props);
        this.state = {
            root:this.props.root,
            groups:null,
        }
    }

    async collectGroups(group, updateState){
        let uri;

        uri = `/api/groups/${group}/`
        let parentResponse = await fetch(uri, { credentials: 'same-origin' })
        let parentData = await parentResponse.json()

        uri = `/api/groups/${group}/children/?limit=10`;
        let response = await fetch(uri, { credentials: 'same-origin' })
        let data = await response.json();
        console.log(data)

        let children = data.results.map(c => c)
        let groups = {
            parent:parentData,
            children:children
        }
        updateState(groups)
    }

    componentDidMount(){
        this.collectGroups(this.state.root, (groups)=>{
            this.setState({groups:groups})
        })
        
    }

    render(){
        if(this.state.groups){
            console.log("state", this.state.groups)
            return <MobileGroups groups={this.state.groups}/>
        }
        return (null);
    }
}


export class Tree extends Component {
    constructor(props){
        super(props)
        this.state = {
            root:this.props.match.params.uri ? this.props.match.params.uri : this.props.root
        }
        console.log("props location =",this.props.match.params.uri)
    }

    render() {
        console.log("tree rendered")
        return (
            <div id="map-container" class="map-container" >
                <div id="tree-container" style={{ position: "relative", width:"100%" }}>
                    <ul id="tree" class="tree">
                    <MediaQuery query="(min-width: 1201px)">
                        <NodeContainer root={this.state.root} key="NodeContainer"/>
                    </MediaQuery>
                    <MediaQuery query="(max-width: 1200px)">
                        <MobileGroupsContainer root={this.state.root} key="MobileGroupsContainer"/>
                    </MediaQuery>
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
