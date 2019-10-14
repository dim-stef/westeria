import React, {useEffect,useState} from 'react'
import {css} from "@emotion/core";
import {useGetAllPaths} from "../container/PathContainer";
import axios from 'axios';


const imgWrapper = () => css({
    display:'flex',
    flexFlow:'row wrap'
})

export function Path({from,to}){
    const branches = useGetAllPaths(from,to);
    return (
        <div style={{height:40,margin:'0 -10px'}} css={imgWrapper}>
            {branches?
                branches.map(b=>{
                return (
                    <div style={{margin:'0 10px'}}>
                        <img src={b.branch_image} className="round-picture" 
                        style={{height:30,width:30,objectFit:'cover'}}/>
                    </div>
                )
            }):null}
        </div>
    )
}