import React, { Component } from "react";
import { Link } from 'react-router-dom'
import sizeMe from "react-sizeme"
import {PureGroup,PureMobileGroup, PureTestGroup} from "./PureGroup"
const uuidv1 = require('uuid/v1');

const REACT_VERSION = React.version;
console.log(REACT_VERSION);

function connector(parent, child) {
    parent = document.getElementById(parent)
    child = document.getElementById(child)
    if (parent && child) {
        console.log("connect")
        jsPlumb.ready(function () {
            jsPlumb.connect({
                connector: ["Flowchart"],
                source: parent,
                target: child,
                anchor: ["Right", "Left"],
                endpoint: "Blank",
                paintStyle:{ outlineStroke:"rgb(206, 206, 206)"},
            });
        });
    }
}

function treeOverflow() {
    var treeWidth = document.getElementById("tree").scrollWidth;
    var mapContainerWidth = document.getElementById("map-container").clientWidth;
    console.log(treeWidth, mapContainerWidth)
    if (treeWidth > mapContainerWidth) {
        return true;
    }
}


class Group extends Component {
    constructor(props) {
        super(props);
        this.state = {
            group: this.props.group,
            name: this.props.name,
            childKey: this.props.childKey,
            display: "flex", //change to inline-block for horizontal tree view
            visibility: "visible",
            hiddenChildren: 0,
            buttonVisible: "visible",
            hidden: false
        }
        this.updateParent = this.updateParent.bind(this);
    }

    updateParent() {
        this.setState(prevState => ({
            ...prevState,
            hiddenChildren: prevState.hiddenChildren + 1
        }))
    }

    componentDidMount(){
        if (this.state.name !== "ROOT" && this.state.name !== "global") {
            connector(this.props.parentKey, this.state.childKey);
        }
    }

    componentDidUpdate() {
        if (this.state.name !== "ROOT" && this.state.name !== "global") {
            connector(this.props.parentKey, this.state.childKey);
        }

        if (this.state.hiddenChildren > 0 && this.state.buttonVisible === "hidden") {
            this.setState(prevState => ({
                ...prevState,
                buttonVisible: "visible"
            }))
        }
        jsPlumb.repaintEverything();

    }

    render() {
       
        if (this.props.name === 'ROOT') {
            return (
                <div>{this.props.children}</div>
            );
        }
        var NavigationArrows = null;
        var parentClassName = ''
        if(this.props.parent){
            NavigationArrows = (
                <div className="navigation-arrows-container">
                    <button className="navigation-arrows ">
                        <ArrowUp className="navigation-arrow-up"/>
                    </button>
                    <button className="navigation-arrows">
                        <ArrowDown className="navigation-arrow-down"/>
                    </button>
                </div>
            )

            parentClassName = 'parent-group'
        }

        var matches = this.state.name.match(/\b(\w)/g);
        var initials = matches.join('')
        return (
            <PureGroup initials={initials} group={this.state.group} navigationArrows={NavigationArrows} className={parentClassName}>
                {React.cloneElement(this.props.children, { updateParent: this.updateParent })}
            </PureGroup>
            
        );
    }    
}


export class Node extends Component {
    constructor(props) {
        super(props);

        this.state = {
            groups: null,
            root: this.props.groups,
            more:false
        }
    }


    collectGroups() {
        let groups = [];
        groups = this.state.root.children.map((c) => {
            var childKey = c.key;
            return (
                <Group
                    group={c}
                    key={childKey}
                    id={c.uri}
                    name={c.name}
                    childKey={c.key}
                    parentKey={this.state.root.key}
                    parent={this.props.parent}
                    updateParent={this.props.updateParent}>
                    <Node groups={c}/>
                </Group>
            );
        });
        return groups;
    }

    /*componentWillReceiveProps(nextProps) {
        console.log("received props")
        //jsPlumb.deleteEveryEndpoint();
        this.setState({ root: nextProps.groups });
    } 
    *///UNCOMMENT IF SUNCHRONOYS FETCHING

    componentWillUnmount() {
        jsPlumb.repaintEverything();
    }

    componentDidMount(){
        var tree = document.getElementById("tree");
        if(window.innerHeight > tree.clientHeight){
            var mapContainer = document.getElementById("map-container")
            mapContainer.classList.add("fix-middle");
        }
    }

    render() {
        var groups = this.collectGroups();
        return (
            <ul>
                {groups}
            </ul>
        );
    }
}

class GroupNavigation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div style={{height:this.props.height, flexBasis:'40%'}}>

            </div>
        )
    }

}

export class Groups extends Component{
    constructor(props){
        super(props);
        this.state = {
            groups:this.props.groups,
            height:0
        }
    }

    collectGroups(){
        let groups = this.state.groups.children.map((c)=>{
            var styleName = '';
            return (
                <PureGroup styleName={styleName} style={{marginTop:10,marginBottom:0,width:'100%',bannerWidth:'100%',flexBasis:'33%'}} group={c}/>
            )
        })
        return groups;
    }

    componentDidMount(){
        var height = this.group.clientHeight;
        this.setState({height:height})
    }

    render(){
        var groups = this.collectGroups();
        var parent = this.state.groups.parent;
        var groupNavigation = null;
        if(parent){
            groupNavigation = (
                <GroupNavigation height={this.state.height}/>
            )
        }
        var styleName = 'parent';
        return (
            <div style={{display: 'flex',flexFlow:'row wrap', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
                <div ref={ (divElement) => {this.group = divElement}} style={{flexBasis:'100%'}}>
                    <PureGroup 
                        styleName={styleName} 
                        style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', flexBasis:0}} 
                        group={parent} 
                        groupNavigation={groupNavigation} />
                </div>
                {groups}
            </div>
        )
    }
}

export class MobileGroups extends Component{
    constructor(props){
        super(props);
        this.state = {
            groups:this.props.groups
        }
    }

    collectGroups(){
        let groups = this.state.groups.children.map((c)=>{
            var styleName = '';
            return (
                <PureMobileGroup styleName={styleName} style={{marginTop:10,marginBottom:0}} group={c}/>
            )
        })
        return groups;
    }

    render(){
        var groups = this.collectGroups();
        var parent = this.state.groups.parent;
        var styleName = 'parent';
        return (
            <div style={{display: 'flex', flexFlow:'column', width:'100%', alignItems:'center',marginTop: '100px'}}>
                <PureMobileGroup styleName={styleName} style={{marginTop:0,marginBottom:30}} group={parent}/>
                {groups}
            </div>
        )
    }
}


const ArrowUp = (props) =>{
    return(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={100} height={100} className={props.className} ><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" style={{fill: '#19586D'}} /></svg>
    )
}

const ArrowDown = (props) =>{
    return(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={100} height={100} className={props.className} ><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z" style={{fill: '#19586D'}} /></svg>
    )
}

