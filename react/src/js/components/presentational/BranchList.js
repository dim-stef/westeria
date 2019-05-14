import React from 'react';
import {Link} from 'react-router-dom'
import {FollowButton} from "./Card"

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
                <FollowButton id={b.id} uri={b.uri}/>
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