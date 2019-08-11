import React, { useState, useContext, useEffect,useRef,lazy,Suspense } from "react"
import {FollowingBranchesColumnContainer} from "../container/FollowingBranchesContainer";
//const MyBranchesColumnContainer = lazy(() => import('./MyBranchesColumn'));
import MyBranchesColumnContainer from "./MyBranchesColumn";


export function FrontPageLeftBar(){
    const [show,setShow] = useState(true);

    return(
        <div style={{ flexBasis:'22%', height:'max-content'}}>
            <div>
                <div className="box-border" style={{padding:'10px 20px',backgroundColor:'white'}}>
                    <div className="flex-fill" style={{alignItems:'center'}}>
                        <h1>My branches</h1>
                        <button role="button" onClick={()=>setShow(!show)} style={{
                            border:0,
                            color:'#1DA1F2',
                            fontSize:'1.3rem',
                            marginLeft:10,
                            marginTop:3,
                            backgroundColor:'transparent'
                        }}>{show?"hide":"show"}</button>
                    </div>
                    <MyBranchesColumnContainer show={show}/>
                </div>
                <div style={{marginTop:10}}>
                    <FollowingBranches/>
                </div>
            

            </div>
        </div>
    )
}

function FollowingBranches(){
    return(
        <div style={{height:'max-content', backgroundColor:'white'}}>
            <div className="box-border" style={{padding:'10px 20px'}}>
            <p style={{
                    fontSize: "1.6em",
                    fontWeight: 600,
                    paddingBottom: 5,
                    margin: "-10px -20px",
                    backgroundColor: "#219ef3",
                    color: "white",
                    padding: "10px 20px",
                    marginBottom:10
                }}>Following</p>
                <FollowingBranchesColumnContainer/>
            </div>
        </div>
    )
}