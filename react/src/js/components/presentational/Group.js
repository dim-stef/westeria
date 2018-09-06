import React, {Component} from "react";
import PropTypes from "prop-types";



const Group = (props) => {
    console.log("group props");
    console.log(props);

    if(props.name === 'ROOT'){
        return(
            <div>{props.children}</div>
        );
    }
    return(
        <li>
            <a class="group-link">
                 <div class="group-container" id={props.id}>
                    <div class="group"></div>
                    <span>{props.name}</span>
                </div>
            </a>
            {props.children}
        </li>
    );
}

export class Node extends Component{
    render(){
        var groups = [];

        if(this.props.groups){

            groups = this.props.groups.children.map((c) =>
            {
                return (
                    <Group id={c.id} name={c.name}>
                        <Node groups={c}/>
                    </Group>
                );
            });
        }
        
        return (
            <ul>
                {groups}
            </ul>
        );
    }
    /*render(){
        var children = [];
        if(this.props.children){
            console.log("props = ");
            console.log(this.props.children);
            children = this.props.children.map((c) =>
            {
                console.log("c");
                console.log(c);
                return (
                    <Group id={c.id} name={c.name}>
                        <Node componentChildren={c.children}/>
                    </Group>
                );
            });
            console.log(children);
        }
        
        return (
            <ul>
                {children}
            </ul>
        );
    }*/
}



