import React, { Component,useState,useEffect } from "react";
import axios from 'axios'
import MediaQuery from 'react-responsive';
import {Helmet} from "react-helmet";
import {BranchList} from "../presentational/BranchesPage"
import {BranchPage} from "../presentational/Routes"
const uuidv1 = require('uuid/v1');
import { Node, MobileGroups, BranchesPage } from "../presentational/Group";


export function BranchesPageContainer(props){
    const [branches,setBranches] = useState(null);
    let branchUri = props.branch.uri;
    console.log(props);

    async function getBranches(branchUri,type="children"){
        let uri;

        uri = `/api/branches/${branchUri}/${type}/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let branches = {
            branches:data.results
        }
        setBranches(data.results);
    }


    useEffect(() => {
        
        getBranches(branchUri,props.type);

    },[])

    if(branches){
        let fillerBox = branches.length % 3 == 0?null:<div style={{flexBasis:'33%',order:1}}></div>

        return (
        <>
            <BranchList branches={branches}/>
            {fillerBox}
        </>
        )
    }else{
        return null
    }
}

export function BranchContainer(props){
    const [branches,setBranches] = useState(null);
    let branchUri = props.match.params.uri ? props.match.params.uri : 'global';

    async function getBranches(branchUri){
        let uri;

        uri = `/api/branches/${branchUri}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        setBranches(parentData);
    }

    useEffect(() => {
        
        getBranches(branchUri);

    },[branchUri])

    if(branches){
        return <BranchPage branch={branches} match={props.match.params.uri ? props.match.params.uri : 'global'}/>
    }else{
        return null
    }
}


export class GroupsContainer extends Component{
    constructor(props){
        super(props);
        this.state = {
            root:this.props.root,
            branches:null,
        }
    }

    async collectGroups(branch, updateState){
        let uri;

        uri = `/api/branches/${branch}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        uri = `/api/branches/${branch}/children/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let children = data.results.map(c => c)
        let branches = {
            parent:parentData,
            children:children
        }
        updateState(branches)
    }

    componentDidMount(){
        this.collectGroups(this.state.root, (branches)=>{
            this.setState({branches:branches})
        })
        
    }

    render(){
        if(this.state.branches){
            return <BranchesPage branches={this.props.branches}/>
        }
        return (null);
    }
}

export class MobileGroupsContainer extends Component{
    constructor(props){
        super(props);
        this.state = {
            root:this.props.root,
            branches:null,
        }
    }

    async collectGroups(branch, updateState){
        let uri;

        uri = `/api/groups/${branch}/`
        let parentResponse = await axios.get(uri, {withCredentials: true});
        let parentData = parentResponse.data;

        uri = `/api/groups/${branch}/children/?limit=10`;
        let response = await axios.get(uri, {withCredentials: true});
        let data = response.data;

        let children = data.results.map(c => c)
        let branches = {
            parent:parentData,
            children:children
        }
        updateState(branches)
    }

    componentDidMount(){
        this.collectGroups(this.state.root, (branches)=>{
            this.setState({branches:branches})
        })
        
    }

    render(){
        if(this.state.branches){
            console.log("state", this.state.branches)
            return <MobileGroups branches={this.state.branches}/>
        }
        return (null);
    }
}



export class NodeContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            doneCollecting: false,
            groups: [],
            root: this.props.root,
        }
    }

    async collectGroupsWrapper(group, callback) {
        const results = await this.collectGroups(group)
        const uri = '/api/groups/' + group + '/'
        const respone = await axios.get(uri, {withCredentials: true})
        var parentData = respone.data
        var parent = Object.assign({}, respone.data); 
        console.log(parent)
        parentData.children = results.children;
        parentData['key'] = uuidv1();
        var wrapper = {
            parent:parent,
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
            return (
                <div>
                    <Node groups={this.state.groups} updateNodeContainer={this.updateNodeContainer} parent={this.state.groups.parent} key="node"/>
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

/*const wrapper = document.getElementById("tree");
wrapper ? ReactDOM.render(<NodeContainer root={"ROOT"} />, wrapper) : false;*/
