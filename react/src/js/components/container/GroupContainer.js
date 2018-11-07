import React, { Component } from "react";
import ReactDOM from "react-dom";
import { resolve } from "url";
import { jsPlumb } from 'jsplumb'
import axios from 'axios'
import MediaQuery from 'react-responsive';
import {Helmet} from "react-helmet";
const uuidv1 = require('uuid/v1');
import { Node, MobileGroups } from "../presentational/Group";


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
        const respone = await axios.get(uri, {withCredentials: true})
        var parentData = respone.data
        parentData.children = results.children;
        parentData['key'] = uuidv1();
        var wrapper = {
            key: '',
            uri: '',
            id: '', 
            name: '',
            description:'',
            group_banner:'',
            group_image:'', 
            children: [parentData]
        }
        console.log(wrapper)
        
        callback(wrapper);
    }

    async collectGroups(group, 
        parents = { key: '', uri: '', id: '', name: '',group_banner:'', group_image:'',  children: [] }) {

        var uri;

        //uri = '/api/groups/' + group +'/children/?limit=10'
        uri = `/api/groups/${group}/children/?limit=10`
        var response = await axios.get(uri, {withCredentials: true})
        var data = response.data;

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
                    description:c.description,
                    group_banner:c.group_banner,
                    group_image:c.group_image, 
                    children:[]
                }
                parents.children.push(child);
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

    componentWillUnmount(){
        jsPlumb.deleteEveryEndpoint();
    }

    render() { //TODO : runs 2 times if group buttons pressed (1 from updateNodeContainer, 1 from didupdate)
        if (this.state.doneCollecting === true) {
            console.log(this.state.groups.children[0].name)
            return (
                <div>
                    <Node groups={this.state.groups} updateNodeContainer={this.updateNodeContainer} key="node"/>
                    <Helmet>
                        <title>{this.state.groups.children[0].name} - Subranch Map</title>
                        <meta name="description" content={`Check out ${this.state.groups.children[0].name} on Subranch map.`}/>
                    </Helmet>
                </div>
            )
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
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        uri = `/api/groups/${group}/children/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

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
