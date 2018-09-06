import React, { Component } from "react";
import ReactDOM from "react-dom";
import Group, { Node } from "../presentational/Group";

function fetchGroup(group) {
    var uri;
    if (group === 'ROOT') {
        uri = '/api/';
    }
    else {
        uri = '/api/groups/'
    }
    return fetch(uri + group, { credentials: 'same-origin' })
        .then(results => {
            return results.json();
        })
        .then(data => {
            return data;
        });
}


class GroupContainer extends Component {  //  UNUSED!!!

    constructor() {
        super();

        this.state = {
            group: 'ROOT',
            name: '',
            childrenID: '',
            children: {},
        }
    }

    saveGroup(data, callback) {
        if (data.constructor === Array) {  //If group is ROOT
            data = data[0];
        }

        console.log("data");
        console.log(data);

        var childrenData = [];
        var route = [];
        const requests = data.children.map((c) => {
            return fetchGroup(c).then((results) => {
                console.log("fetched data: ");
                console.log(results);
                childrenData.push(results);
            });
        })

        console.log("requests");
        console.log(requests);
        Promise.all(requests).then(() => {
            this.setState({
                group: data.id,
                name: data.name,
                childrenID: data.children,
                children: childrenData,
            }, callback);
        });

        
    }


    componentDidMount() {
        console.log(this.state.group);
        fetchGroup(this.state.group).then((data) => this.saveGroup(data, () =>{
            console.log("this.state");
            console.log(this.state);
            this.state.childrenID.map((c) => {
                fetchGroup(c).then((data2) => this.saveGroup(data2)).then(() => {
                    console.log("data2");
                    console.log(data2);
                    console.log("c2");
                    console.log(c);
                });
            });
        }))
        //fetchNext ->map(x,i) data.children -> <GroupList />
    }
    render() {
        if (this.state.children.length) {
            console.log("state = ");
            console.log(this.state);
            return <Node parentName={this.state.name} children={this.state.children} />;
        }
        return (null);
    }
}

class NodeContainer extends Component {
    constructor() {
        super();

        this.groups = [];
        this.max_depth = 0;
        this.state = {
            groups:[],
            root:'ROOT'
        }

    }
    
    collectGroups(group, callback , parents = {id:'',name:'',children:[]}, wrapper = {id:'',name:'',children:[]}){
        fetchGroup(group).then((data) => {
            if (data.constructor === Array) {  //If group is ROOT
                data = data[0];
            }

            wrapper.id = data.id;
            wrapper.name = data.name;

            data.children.map((c)=> {
                this.collectGroups(c,callback , wrapper);
            })
            this.max_depth++;
            console.log("this.max_depth");
            console.log(this.max_depth);
            parents.children.push(wrapper);
            

            if(this.max_depth === 1){
                this.groups = parents;
                //setTimeout(callback, 1000)
                //callback(this.groups);
            }
            callback(this.groups);
        })
        
        return;
    }

    componentDidMount(){
        this.collectGroups(this.state.root,(groups) => {
            this.setState({
                groups:groups,
                root:'ROOT'
            });
        })
    }

    render() {
        if (this.state.groups.length !==0) {
            console.log("state = ");
            console.log(this.state);
            return <Node groups = {this.state.groups}/>
        }
        return (null);
    }
}



export default GroupContainer;

const wrapper = document.getElementById("tree");
wrapper ? ReactDOM.render(<NodeContainer />, wrapper) : false;