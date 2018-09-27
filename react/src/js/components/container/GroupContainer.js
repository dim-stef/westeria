import React, { Component } from "react";
import ReactDOM from "react-dom";
import Group, { Node } from "../presentational/Group";
import { resolve } from "url";
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
            root: this.props.root,
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
        if(parents.children){
            parents.children.push(wrapper);
        }
        
        groups = parents;
        return groups;
    }

    updateNodeContainer(newRoot) {
        this.collectGroupsWrapper(newRoot, (groups) => {
            console.log(groups)
            if (groups.constructor === Object) {
                var tmp = [];
                tmp.push(groups);
                this.setState(prevState => ({
                    ...prevState,
                    groups: tmp,
                    doneCollecting: true,
                    root: newRoot,
                }), () => {
                    //console.log(this.state);
                })
            }
        })
    }

    componentDidMount() {
        if (this.state.root) {
            this.collectGroupsWrapper(this.state.root, (groups) => {
                if (groups.constructor === Object) {
                    var tmp = [];
                    tmp.push(groups);
                    this.setState(prevState => ({
                        ...prevState,
                        doneCollecting: true,
                        groups: tmp,
                    }))
                }
            })
        }
    }

    render() {
        if (this.state.doneCollecting === true) {
            //console.log(this.state.groups[0]);
            return <Node groups={this.state.groups[0]} updateNodeContainer={this.updateNodeContainer} />
        }
        return (null);
    }
}



//export default GroupContainer;

const wrapper = document.getElementById("tree");
wrapper ? ReactDOM.render(<NodeContainer root={"ROOT"} key="1" />, wrapper) : false;
