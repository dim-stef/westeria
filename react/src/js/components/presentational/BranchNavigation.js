import React, { Component, useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import {ActionArrow} from "./Temporary"

export class BranchNavigation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div style={{position:'sticky',top:51,zIndex:5000}}>
                <div style={{height:'100%',position:'absolute',left:100,width:210,display:'flex',alignItems:'center'}}>
                    <DropProfile branch={this.props.branch}/>
                </div>
                <div style={{backgroundColor:'white',boxShadow:'0 4px 4px -4px rgba(0,0,0,0.25)'}}>
                    <div id="branch-navigation" className="group-navigation-container flex-fill">
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


function useHandleButton(branch, buttonLink){
    const [className,setClassName] = useState('');

    useEffect(() => {
        let match1 = `/${branch.uri}/${buttonLink}/`;
        let match2 = `/${branch.uri}/${buttonLink}`;
        
        let match3 = `/${branch.uri}/`;
        let match4 = `/${branch.uri}`;
        if(window.location.pathname === match1 || window.location.pathname === match2){
            setClassName("clicked-navigation-button");
        }
        else if((window.location.pathname === match3 || window.location.pathname === match4) && buttonLink===''){
            setClassName("clicked-navigation-button");
        }
        else{
            setClassName("");
        }
    })

    return className;
}

const FeedButton = ({branch}) => {
    const className = useHandleButton(branch,'');

    return(
        <Link to={`/${branch.uri}`} className={`user-color group-navigation-button ${className}`}>
            
            <div className="navigation-button-text">
                {/*<i className="material-icons navigation-icon">list</i>*/}
                <div style={{padding:10}}>Posts</div>
            </div>
        </Link>
    )
}

const BranchesButton = ({branch}) => {
    const className = useHandleButton(branch,'branches');

    return(
        <Link to={`/${branch.uri}/branches`} className={`user-color group-navigation-button ${className}`}>
            <div className="navigation-button-text">
                {/*<i className="material-icons navigation-icon">more</i>*/}
                <div style={{padding:10}}>{branch.children.length} Branches</div>
            </div>
        </Link>
    )
}