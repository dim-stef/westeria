import React, { Component } from "react";
import { Link } from 'react-router-dom'
import PropTypes from "prop-types";
import { NodeContainer, Tree } from "../container/GroupContainer"
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
                anchor: ["Bottom", "Top"],
                endpoint: "Blank",
            });
        });
    }
}

function treeOverflow() {
    var treeContainerWidth = document.getElementById("tree-container").scrollWidth;
    var mapContainerWidth = document.getElementById("map-container").clientWidth;
    if (treeContainerWidth > mapContainerWidth) {
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
        this.props.updateNodeContainer(this.state.newRoot);
    }

    componentDidUpdate() {
        if (this.props.visibility === "visible") {

        }
    }

    render() {
        return (
            //<NodeContainer root={null} msg={")))))"} key="1"/>
            //<Node groups={null} key="1"/>
            <button
                style={{ visibility: this.props.visibility }}
                onClick={this.handleClick}>
            </button>
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
            display: "inline-block",
            visibility: "visible",
            hiddenChildren: 0,
            buttonVisible: "visible"
        }
        this.updateParent = this.updateParent.bind(this);
    }

    updateParent() {
        this.setState(prevState => ({
            ...prevState,
            hiddenChildren: prevState.hiddenChildren + 1
        }))
    }

    componentDidMount() {
        if (this.state.name !== "ROOT" && this.state.name !== "global") {
            connector(this.props.parentKey, this.state.childKey);
        }

        if (this.domElement) {
            //console.log(this.domElement.getBoundingClientRect())
        }
    }
    /*componentDidMount(){
        if (treeOverflow() === true) {
            this.setState({ visibility: "hidden" }, () => {
                //console.log(this.props)
                if(this.props.updateParent){
                    this.props.updateParent();
                }
           });
        }

        if (this.state.name !== "ROOT" && this.state.name !== "global") {
            connector(this.props.parentKey, this.state.childKey);
        }
    }*/

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

        return (
            <li style={{ display: this.state.display }} ref={(el) => { this.domElement = el }}>
                <div class="item-container">
                    <li id="id" class="group-link">
                        <Link to={"/" + this.props.id}>Home</Link>
                    </li>
                    <a href="#" class="group-link">
                        <div class="group-container" id={this.state.childKey}>
                            <div class="group"></div>
                            <span>{this.state.name}</span>
                        </div>
                    </a>
                    <ExtendButton
                        key={this.state.childKey}
                        visibility={this.state.buttonVisible}
                        newRoot={this.state.group.id}
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
                    childKey={childKey}
                    parentKey={key}
                    updateParent={this.props.updateParent}
                    updateNodeContainer={this.props.updateNodeContainer}>
                    <Node groups={c} updateNodeContainer={this.props.updateNodeContainer} />
                </Group>
            );
        });

        //this.setState({groups:groups})

        
        return groups;
    }

    componentWillReceiveProps(nextProps) {
        jsPlumb.deleteEveryEndpoint();
        this.setState({ root: nextProps.groups });
    }

    componentWillUnmount(){
        console.log("unmount")
    }

    componentDidUpdate(prevProps, prevState) {
        console.log(prevProps,this.props,prevState)
        console.log("updated")
        jsPlumb.repaintEverything();
    }

    render() {
        console.log("node rendered")
        jsPlumb.repaintEverything();
        var groups = this.collectGroups();
        return (
            <ul>
                {groups}
            </ul>
        );

    }
}