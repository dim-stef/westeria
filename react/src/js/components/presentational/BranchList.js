import React from 'react';
import {Link} from 'react-router-dom'
import { css } from "@emotion/core";
import {useTheme} from "emotion-theming";
import {ChildBranch} from "./Branch"
import BranchFooter from "./Temporary"
import {FollowButton} from "./Card"
import {ExpandableBranch} from "./SearchPage"

export function SmallBranchList({branches}){

    return branches.map(b=>{
        return(
            <div className="flex-fill" style={{marginTop:20}} key={b.uri}>
                <BranchPicture picture={b.branch_image} uri={b.uri}/>
                <div>
                    <Link to={b.uri} style={{textDecoration:'none', color:'black'}}>
                        <strong style={{fontSize:'1.7rem'}}>{b.uri}</strong>
                        <div style={{padding:'3px 0px',color:'#1b4f7b',fontWeight:600,fontSize:'1.4rem'}}>
                            @{b.name}
                        </div> 
                    </Link>
                </div>
                <FollowButton branch={b}/>
            </div>
        )
    })
}

function BranchPicture(props){

    return(
        <Link to={`/${props.uri}`} className="noselect" style={{marginRight:10}}>
            <img src={props.picture} style={{
            backgroundSize:'cover',
            backgroundPosition:'center center',
            backgroundRepeat:'no-repeat',
            border:0,
            borderRadius:'50%',
            width:48,height:48}}/>
        </Link>
    )
}

const searchContainer = () => css({
    display:'flex',
    flexFlow:'row wrap', 
    justifyContent:'center'
})

const searchList = theme => css({
    minWidth:250, 
    width:'auto',
    flexGrow:1,
    margin:10,
    flexFlow:'column',
    border:`1px solid ${theme.borderColor}`
})


export function BigBranchList({branches}){
    return(
        <div className="flex-fill" css={searchContainer} >
            {branches.length>0?
                branches.map(b=>{
                return <ExpandableBranch branch={b}/>
            }):null}
        </div>
    )
}