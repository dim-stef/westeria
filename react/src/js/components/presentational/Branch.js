import React, {Component, useState} from "react";
import { css } from "@emotion/core";
import {Link} from 'react-router-dom'
import {isMobile} from 'react-device-detect';
import {BranchBanner} from "./BranchBanner"
import {UserContext} from '../container/ContextContainer'
import {SmallCard} from "./Card"


export function ChildBranch({styleName='', style=null, branch, editMode, children}){

    return(
        <>
        <div className="flex-fill" style={{marginTop:style.marginTop,
        marginBottom:style.marginBottom,
        flexBasis:style.flexBasis,WebkitFlexBasis:style.flexBasis}}>
            <Link to={"/" + branch.uri} className={`${ styleName }`} style={{width:style.width}}>
                <BranchBanner branch={branch} dimensions={style.branchDimensions} className="branch-child-picture"/>
            </Link>
            {children}
        </div>
        </>  
    )
    
}

const name = theme => css({
    color:`${theme.textColor}`,
    fontSize:'1.5rem',margin:0,fontWeight:700
})

const uri = theme => css({
    color:`${theme.textLightColor}`,
    fontSize:'1.4rem'
})


export function SmallBranch({branch,isLink=true,
    onClick=()=>{},hoverable=true,style=null,children}){
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
        onClick={onClick}
        onMouseEnter={isMobile || !hoverable?null:handleMouseEnter}
        onMouseLeave={isMobile || !hoverable?null:handleMouseLeave}
         style={{position:'relative'}} className="noselect small-branch-container flex-fill">
            <SmallBranchWrapper uri={branch.uri} isLink={isLink}>
                <div className="flex-fill center-items"
                >
                    <img style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',backgroundColor:'#4d5058',minWidth:48}} 
                    alt="" src={branch.branch_image}/>
                    <div className="flex-fill" style={{flexDirection:'column',WebkitFlexDirection:'column',
                    justifyContent:'center',WebkitJustifyContent:'center',marginLeft:10,
                    wordBreak:'break-word',alignItems:'flex-start',WebkitAlignItems:'flex-start'}}>
                        <p css={theme=>name(theme)}>{branch.name}</p>
                        <span css={theme=>uri(theme)}>@{branch.uri}</span>
                    </div>
                </div>
                
            </SmallBranchWrapper>
            {showCard?<SmallCard branch={branch}/>:null}
            {children}
        </div>
        
        </>
    )
}

function SmallBranchWrapper({children,isLink,uri}){
    if(isLink){
        return(
            <Link to={`/${uri}`} className="small-branch flex-fill" >
                {children}
            </Link>
        )
    }else{
        return(
            <div className="small-branch flex-fill">
                {children}
            </div>
        )
    }
}


export class ParentBranch extends Component{
    static contextType = UserContext

    render(){
        let {styleName='', style=null, branch, branchNavigation=null,type="child",editMode, children} = this.props
        return(
            <div className="item-container" style={{marginTop:style.marginTop,
            marginBottom:style.marginBottom, 
            flexBasis:style.flexBasis,
            WebkitFlexBasis:style.flexBasis,
            display:'block'}}>
                <div className={`${ styleName }`} style={{width:style.width,border:0}}>
                    <BranchBanner branch={branch} dimensions={style.branchDimensions} parent className="branch-parent-picture" editMode={editMode}>
                    </BranchBanner>
                </div>
            </div>
        )
    }
}