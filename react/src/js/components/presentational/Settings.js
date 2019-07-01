import React, { Component, useState,useEffect,useRef,useContext } from "react";
import { NavLink } from 'react-router-dom'
//import {Link} from "react-router-dom"
import Responsive from 'react-responsive';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {UserContext} from "../container/ContextContainer"
import {FrontPage,FrontPageFeed} from "./Routes"
import { RoutedTabs, NavTab } from "react-router-tabs";
import axios from 'axios'


export function Settings(){
    return (
        <>
            <ContentsBar/>
            <SettingsBar/>
            <FillerBar/>
        </>
    )
}

function ContentsBar(){
    return(
        <div style={{flexBasis:'22%',marginRight:10}}>
            <General/>
            <Branches/>
        </div>
    )
}

function SettingsBar(){
    return(
        <div style={{flexBasis:'56%',backgroundColor:'white',height:610}}>

        </div>
    )
}

function FillerBar(){
    return(
        <div style={{flexBasis:'22%',marginLeft:10}}>

        </div>
    )
}

function General(){
    return(
        <div style={{backgroundColor:'white',width:'100%',height:300}}>
            <h1 style={{padding:'0 10px'}}>General</h1>
            <div>
                <NavLink to="/about">About</NavLink>

            </div>
        </div>
    )
}

function Branches(){
    return(
        <div style={{backgroundColor:'white',width:'100%',marginTop:10,height:300}}>

        </div>
    )
}