import React, { Component, useState, useEffect } from "react";
import { Link,NavLink } from 'react-router-dom'
import {ActionArrow} from "./Temporary"

export class BranchNavigation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div style={{zIndex:1}}>
                {/*<div style={{height:'100%',position:'absolute',left:100,width:210,display:'flex',alignItems:'center'}}>
                    <DropProfile branch={this.props.branch}/>
                </div>*/}
                <div style={{backgroundColor:'white',boxShadow:'0 4px 4px -4px rgba(0,0,0,0.25)'}}>
                    <div id="branch-navigation" className="branch-navigation-container flex-fill">
                        <FeedButton branch={this.props.branch}/>
                        <BranchesButton branch={this.props.branch}/>
                    </div>
                </div>
            </div>   
        )
    }
}


function DropProfile({branch}){
    const [backgroundOpacity,setBackgroundOpacity] = useState(0);
    const [className,setClassName] = useState("");

    useEffect(()=>{
        var branchNavigation = document.getElementById('branch-navigation');
        var scrollListener = function(e) {
            var viewportOffset = branchNavigation.getBoundingClientRect();
            if(viewportOffset.top===50){
                setBackgroundOpacity(1);
            }
            else{
                setBackgroundOpacity(0);
            }
        }

        window.addEventListener('scroll', scrollListener);

        return () => {
            window.removeEventListener('scroll', scrollListener);
        };
    })

    return(
        <img src={branch.branch_image} className="opacity-animation" style={{
        width:38,
        height:38,
        objectFit:'cover',
        borderRadius:'50%',
        position:'absolute',
        left:0,
        opacity:backgroundOpacity}}>

        </img>
    )
}


const FeedButton = ({branch}) => {
    return(
        <NavLink exact to={`/${branch.uri}`} className="user-color branch-navigation-button flex-fill" 
        activeClassName="clicked-navigation-button">
            
            <div className="navigation-button-text flex-fill center-items">
                {/*<i className="material-icons navigation-icon">list</i>*/}
                <div style={{padding:10}}>Posts</div>
            </div>
        </NavLink>
    )
}

const BranchesButton = ({branch}) => {

    return(
        <NavLink to={`/${branch.uri}/branches`} className="user-color branch-navigation-button flex-fill" 
        activeClassName="clicked-navigation-button">
            <div className="navigation-button-text flex-fill center-items">
                {/*<i className="material-icons navigation-icon">more</i>*/}
                <div style={{padding:10}}>{branch.children.length} Branches</div>
            </div>
        </NavLink>
    )
}