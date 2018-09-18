import React, { Component } from "react";
import PropTypes from "prop-types";
const uuidv1 = require('uuid/v1');


function connector(parent, child) {
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
            visibility: this.props.visibility
        }
    }
    componentDidUpdate() {

    }

    render() {
        return (
            <button style={{ visibility: this.props.visibility }}></button>
        )
    }
}


class Group extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            childKey: this.props.childKey,
            display: "inline-block",
            visibility: "visible",
            hiddenChildren: 0,
            buttonVisible: "hidden"
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
        if (treeOverflow() === true) {
            this.setState({ visibility: "hidden" }, () => {
                this.props.updateParent();
           });
        }else{
            if (this.state.name !== "ROOT" && this.state.name !== "global") {
                connector(this.props.parentKey, this.state.childKey);
            }
        }
        
    }

    componentDidUpdate() {
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

        if(this.state.visibility === "hidden"){
            return (null);
        }

        return (
            <li style={{ display: this.state.display }}>
                <div class="item-container">
                    <a class="group-link">
                        <div class="group-container" id={this.state.childKey}>
                            <div class="group"></div>
                            <span>{this.state.name}</span>
                        </div>
                    </a>
                    <ExtendButton key={this.state.childKey} visibility={this.state.buttonVisible} />
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
                    key={childKey}
                    updateParent={this.props.updateParent}
                    id={c.uri}
                    name={c.name}
                    childKey={childKey}
                    parentKey={key}>
                    <Node groups={c} key={c.uri} />
                </Group>
            );
        });
        return groups;
    }


    render() {
        if (this.collectGroups()) {
            return (
                <ul>
                    {this.collectGroups()}
                </ul>
            );
        }
        else {
            return (null);
        }
    }
}
