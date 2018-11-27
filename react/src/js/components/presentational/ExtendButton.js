import React, { Component } from "react";
import { Link } from 'react-router-dom'

export class ExtendButton extends Component {
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
