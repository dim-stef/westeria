import React, { useState, useEffect, useContext } from "react";
import {UserContext} from "../container/ContextContainer"
import axios from 'axios'

var csrftoken = getCookie('csrftoken');

export default function Card({branch}){
    let height = branch.description ? 200 : 90
    return(
        <div style={{width:'100%',backgroundColor:'white',height:height,position:'relative'}}>
            <Identifiers branch={branch}/>
            <FollowInfo followersCount={branch.followers_count} followingCount={branch.following_count}/>
        </div>
    )
}

function FollowInfo({followersCount,followingCount}){
    return(
        <div style={{height:'100%',width:270,position:'absolute',right:0}}>
            <h1>
                <span style={{color: '#156bb7'}}>{followersCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:'#000000e8'}}>Followers</span>
            </h1>
            <h1>
                <span style={{color: '#156bb7'}}>{followingCount}{' '}</span>
                <span style={{fontWeight:500,fontSize:'0.9em',color:'#000000e8'}}>Following</span>
            </h1>
        </div>
    )
}

function Identifiers({branch}){
    console.log(branch.uri,"in1")
    return(
        <div style={{position:'absolute',left:270,width:672}}>
            <div style={{display:'flex',paddingTop:10,alignItems:'flex-end'}}>
                <Name name={branch.name}/>
                <FollowButton id={branch.id} uri={branch.uri}/>
            </div>
            <Uri uri={branch.uri}/>
            {
                branch.description ? 
                <Description description={branch.description}/> : 
                null
            }
        </div>
    )
}

function Name({name}){
    return(
        <h1 style={{margin:0,fontSize:'3rem'}}>{name}</h1>
    )
}

function Uri({uri}){
    return(
        <span style={{fontSize:'2em',color:'rgb(86, 86, 86)'}}>@{uri}</span>
    )
}

function Description({description}){
    return(
            <p style={{wordBreak:'break-word',fontSize:'2em'}}>{description}</p>
    )
}


export function FollowButton({id,uri}){

    const context = useContext(UserContext);

    let clsName;
    let initFollowing;
    if(context.currentBranch.follows.includes(uri)){
        clsName = 'following-secondary'
        initFollowing= true
    }
    else{
        clsName = 'following-main'
        initFollowing= false
    }
    const [className,setClassName] = useState(clsName);
    const [following,setFollowing] = useState(initFollowing);   

    useEffect(()=>{
        if(context.currentBranch.follows.includes(uri)){
            setClassName('following-secondary')
            setFollowing(true)
        }
        else{
            setClassName('following-main')
            setFollowing(false)
        }
    },[uri])

    function onClick(){
        var url = `/api/branches/add_follow/${context.currentBranch.uri}/`;
        if(following){
            url = `/api/branches/remove_follow/${context.currentBranch.uri}/`;
        }

        var data = {
            follows:[id]
        }
        axios.patch(
            url,
            data,
            {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            withCredentials: true,
        }).then(response => {
            console.log(response)
            if(response.status === 200){
                if(following){
                    context.currentBranch.follows.splice(context.currentBranch.follows.indexOf(uri),1);
                    setClassName('following-main');
                    setFollowing(false);
                }else{
                    context.currentBranch.follows.push(uri)
                    setClassName('following-secondary');
                    setFollowing(true);
                }
            }
        }).catch(error => {
            console.log(error)
        })
    }

    return(
        <button
            onClick={onClick}
            className={className}
            name="followAction"
            style={{
            borderRadius: 24,
            margin:'0 15px',
            padding: "8px",
            width:140,
            fontSize: "1.6em",
            fontWeight: 600,
        }}>{following ? 'Following':'Follow'}</button>
    )
}