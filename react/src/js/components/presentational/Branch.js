import React, {Component, useState} from "react";
import { css } from "@emotion/core";
import {Link} from 'react-router-dom'
import {BranchBanner} from "./BranchBanner"
import {UserContext} from '../container/ContextContainer'
import {SmallCard} from "./Card"
import {FadeImage} from "./FadeImage"
import {useMediaQuery} from "react-responsive"

const imageContainer = () =>css({
    display:'flex',
    flexFlow:'column',
    justifyContent:'center',
    alignItems:'center',
    position:'relative'
})

const circularBranchName = (theme,isMobile) =>css({
    color: theme.textColor,
    fontSize:isMobile?'1.3rem':'1.5rem',
    margin:'5px 0',
    fontWeight:400,
    wordBreak:'break-word',
    textAlign:'center'
 })

const squareBranchName = theme =>css({
    color:'white',
    fontSize:'1.5rem',
    fontWeight:500,
    position:'absolute',
    bottom:0,
    paddingBottom:10,
    textAlign:'center',
    background:`linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.6)
      )`,
    textShadow:'0 1px 2px #0000008a',
    width:'100%'
})

export function CircularBranch({branch,endpoint,connect=null}){
    const isMobile = useMediaQuery({
        query: '(max-width: 767px)'
    })

    const body = <div css={imageContainer} style={{margin:'0 5px'}} key={branch.id}>
        <FadeImage className="round-picture branch-profile-setting" 
        style={{height:isMobile?60:100,width:isMobile?60:100,display:'block',
        objectFit:'cover',margin:2,boxSizing:'border-box'}}
        src={branch.branch_image}/>
        <span css={theme=>circularBranchName(theme,isMobile)}>{connect?connect:branch.name}</span>
    </div>

    return(
        connect?<div css={theme=>({height:isMobile?100:150,width:isMobile?100:200,display:'block'})}>
            {body}
        </div>:
        <Link css={theme=>({height:isMobile?100:150,width:isMobile?100:200,display:'block'})}
        to={endpoint=='branches'?`/${branch.uri}/branches`:`/${endpoint}/${branch.uri}`}>
            {body}
        </Link>
    )
}

export function SquareBranch({branch,endpoint}){
    return(
        <Link to={endpoint=='branches'?`/${branch.uri}/branches`:`/${endpoint}/${branch.uri}`}>
            <div css={imageContainer} key={branch.id}>
                <FadeImage className="branch-profile-setting" style={{height:80,width:80,display:'block',
                objectFit:'cover',boxSizing:'border-box'}}
                src={branch.branch_image}/>
                <span css={squareBranchName}>{branch.name}</span>
            </div>
        </Link>
    )
}

export function ChildBranch({styleName='', style=null, branch, editMode, children}){

    return(
        <>
        <div className="flex-fill" style={{marginTop:style.marginTop,
        marginBottom:style.marginBottom,
        flexBasis:style.flexBasis,WebkitFlexBasis:style.flexBasis,zIndex:1}}>
            <Link to={"/" + branch.uri} className={`${ styleName }`} style={{width:style.width}}>
                <BranchBanner branch={branch} dimensions={style.branchDimensions} className="branch-child-picture"/>
            </Link>
            {children}
        </div>
        </>  
    )
    
}

export function BubbleBranch({branch,clickable=null,clicked=false}){
    return(
        <div css={theme=>({display:'flex',margin:'10px 0',alignItems:'center',
        backgroundColor:clicked?'#219ef3 !important':'transparent',cursor:'pointer',transition:'background-color 0.15s ease',
        padding:10,margin:7,borderRadius:50,border:`1px solid ${theme.borderColor}`})} onClick={clickable?clickable:null}>
            <img src={branch.branch_image} css={{width:32,height:32,objectFit:'cover',borderRadius:'50%'}}/>
            <div css={{display:'flex',flexFlow:'column',marginLeft:5}}>
                <span css={theme=>({color:clicked?'white':theme.textColor,fontSize:'1.5rem',fontWeight:500})}>
                    {branch.name}
                </span>
                <span css={theme=>({color:clicked?'white':theme.textLightColor,fontSize:'1.2rem'})}>
                    @{branch.uri}
                </span>
            </div>
        </div>
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


    return(
        <>
        <SmallCard branch={branch} hoverable={hoverable}>
        <div
        onClick={onClick}
        style={{position:'relative'}} className="noselect small-branch-container flex-fill">
            <SmallBranchWrapper uri={branch.uri} isLink={isLink}>
                <div className="flex-fill center-items"
                >
                    <img style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',backgroundColor:'#4d5058',minWidth:48}} 
                    alt="" src={branch.branch_image}/>
                    <div className="flex-fill text-wrap" style={{flexDirection:'column',WebkitFlexDirection:'column',
                    justifyContent:'center',WebkitJustifyContent:'center',marginLeft:10,
                    alignItems:'flex-start',WebkitAlignItems:'flex-start'}}>
                        <p css={theme=>name(theme)}>{branch.name}</p>
                        <span css={theme=>uri(theme)}>@{branch.uri}</span>
                    </div>
                </div>
                
            </SmallBranchWrapper>
            {children}
        </div>
        </SmallCard>
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