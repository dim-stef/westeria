import React, { Component } from "react";
import { Link } from 'react-router-dom'
import sizeMe from "react-sizeme"
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


class ExtendButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            newRoot: this.props.newRoot
        }
        this.handleClick = this.handleClick.bind(this)
    }

    handleClick() {
        console.log(this.state.newRoot);
        jsPlumb.deleteEveryEndpoint();
        //this.props.updateNodeContainer(this.state.newRoot);
    }

    componentDidUpdate() {
        if (this.props.visibility === "visible") {

        }
    }

    render() {
        return (
            //<NodeContainer root={null} msg={")))))"} key="1"/>
            //<Node groups={null} key="1"/>
            <Link to={"/map/" + this.state.newRoot} onClick={this.handleClick}>
                <button
                    style={{ visibility: this.props.visibility }} onClick={this.handleClick}>

                </button>
            </Link>
        )
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
        console.log("group mount")
        console.log(this.domElement)
        
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

        if (this.state.visibility === "hidden") {
            return (null);
        }

        var matches = this.state.name.match(/\b(\w)/g);
        var initials = matches.join('')
        return (
            <li ref={(el) => { this.domElement = el }} style={{ display: this.state.display }}>
                <div class="item-container">
                    <li id="id" class="group-link">

                    </li>
                    <Link to={"/" + this.props.id} className="group-link">
                        <div class="group-container" id={this.state.childKey}>
                            <div style={{width:200, backgroundColor:"#e7e7e7", display:"inline-block",
                            paddingTop: '40.25%',position: 'relative',
                            backgroundImage:`url(${this.state.group.group_banner})`,backgroundRepeat: "no-repeat",backgroundSize: "cover"}}>
                                <div class="group">
                                    <span>{initials}</span>
                                </div>
                            </div>
                            <span style={{display: 'block'}}>{this.state.name}</span>
                        </div>
                    </Link>
                    <ExtendButton
                        key={this.state.childKey}
                        visibility={this.state.buttonVisible}
                        newRoot={this.state.group.uri}
                        updateNodeContainer={this.props.updateNodeContainer} />
                </div>
                {React.cloneElement(this.props.children, { updateParent: this.updateParent })}
            </li>
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
        var key = this.state.root.key;
        if (this.state.root.name == "ROOT") {
            key = "ROOT";
        }

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
                    updateParent={this.props.updateParent}
                    updateNodeContainer={this.props.updateNodeContainer}>
                    <Node groups={c} updateNodeContainer={this.props.updateNodeContainer} />
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
        console.log("unmount")
        jsPlumb.repaintEverything();
    }

    render() {
        console.log("node rendered")
        //jsPlumb.repaintEverything();
        var groups = this.collectGroups();
        return (
            <ul>
                {groups}
            </ul>
        );

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
                <PureGroup styleName={styleName} style={{marginTop:10,marginBottom:0}} group={c}/>
            )
        })
        return groups;
    }

    render(){
        var groups = this.collectGroups();
        console.log(groups)
        var parent = this.state.groups.parent;
        var styleName = 'parent';
        return (
            <div style={{display: 'flex', flexFlow:'column', width:'100%', alignItems:'center'}}>
                <PureGroup styleName={styleName} style={{marginTop:0,marginBottom:30}} group={parent}/>
                {groups}
            </div>
        )
    }
}


const PureGroup = ({styleName, style, group}) => {
    return(
        <div className={`item-container ${ styleName }`} style={{marginTop:style.marginTop,marginBottom:style.marginBottom}}>
            <Link to={"/" + group.uri} className="group-link">
                <div class="group-container" id={group.id}>
                    <div style={{width:'100%', backgroundColor:"#efefef", display:"inline-block", paddingTop: '27.25%', position: 'relative'}}>
                        <div class="group"></div>
                    </div>
                    <span style={{display: 'block',fontSize: '1.8rem'}}>{group.name}</span>
                </div>
            </Link>
            <ExtendButton
                newRoot={group.uri}/>
        </div>
    )
}