import React, { Component, useContext,useState } from "react";
import { Link } from 'react-router-dom'
import {BranchBanner} from "./BranchBanner"
import {UserContext} from '../container/ContextContainer'
import {BigBranchPicture} from "./BranchPageLeftBar"
import {SmallCard} from "./Card"
import axios from 'axios'


export class ChildBranch extends Component{
    static contextType = UserContext

    render(){
        let {styleName='', style=null, branch, editMode, children} = this.props

        return(
            <>
            <div className="item-container flex-fill" style={{marginTop:style.marginTop,
            marginBottom:style.marginBottom,
            flexBasis:style.flexBasis}}>
                <Link to={"/" + branch.uri} className={`group-link ${ styleName }`} style={{width:style.width}}>
                    <BranchBanner branch={branch} dimensions={style.branchDimensions} className="branch-child-picture"/>
                </Link>
                {children}
            </div>
            </>  
        )
    }
}

export function SmallBranch({branch,children}){
    const [showCard,setShowCard] = useState(false);
    let setTimeoutConst;
    let setTimeoutConst2;

    function handleMouseEnter(){
        clearTimeout(setTimeoutConst2)

        setTimeoutConst = setTimeout(()=>{
            setShowCard(true);
        },500)
    }

    function handleMouseLeave(){
        clearTimeout(setTimeoutConst)

        setTimeoutConst2 = setTimeout(()=>{
            setShowCard(false);
        },500)
    }

    return(
        <>
        <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
         style={{position:'relative'}} className="noselect small-branch-container flex-fill">
            <Link to={`/${branch.uri}`} className="small-branch flex-fill" >
                <img style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}} src={branch.branch_image}/>
                <div style={{display:'flex',flexDirection:'column',justifyContent:'center',marginLeft:10, flex:'1 1 auto'}}>
                    <p style={{fontSize:'1.5rem',margin:0,fontWeight:700,color:'#232323'}}>{branch.name}</p>
                    <span style={{fontSize:'1.4rem',color:'#404040'}}>@{branch.uri}</span>
                </div>
                {showCard?<SmallCard branch={branch}/>:null}
            </Link>
            {children}
        </div>
        
        </>
    )
}


export class ParentBranch extends Component{
    static contextType = UserContext

    render(){
        let {styleName='', style=null, branch, branchNavigation=null,type="child",editMode, children} = this.props
        console.log(branch)
        return(
            <div className="item-container" style={{marginTop:style.marginTop,
            marginBottom:style.marginBottom, 
            flexBasis:style.flexBasis,
            width:1200,
            display:'block'}}>
                <div className={`group-link ${ styleName }`} style={{width:style.width,border:0}}>
                    <BranchBanner branch={branch} dimensions={style.branchDimensions} parent className="branch-parent-picture" editMode={editMode}>
                    </BranchBanner>
                </div>
            </div>
        )
    }
}

function ProfileImage({branch}){
    const className="branch-parent-picture";

    return(
        <BigBranchPicture branch={branch} className={className}/>
    )
}