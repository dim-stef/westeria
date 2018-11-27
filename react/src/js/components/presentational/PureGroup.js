import React, { Component } from "react";
import { Link } from 'react-router-dom'
import {ExtendButton} from "./ExtendButton"

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const PureGroup = ({styleName, style, group, groupNavigation}) => {
    return(
        <div className="item-container" style={{marginTop:style.marginTop,marginBottom:style.marginBottom, width:style.width, flexBasis:style.flexBasis}}>
            <Link to={"/" + group.uri} className={`group-link ${ styleName }`} style={{width:style.width}}>
                <div class="group-container" id={group.id} style={{width:style.width}} >
                    <div style={{width:style.bannerWidth, backgroundColor:getRandomColor(), display:"inline-block", paddingTop: '56.25%', position: 'relative',
                    backgroundImage:`url(${group.group_banner})`, backgroundRepeat:'no-repeat',backgroundSize:'contain',backgroundPosition:'center'}}>
                        <div class="group"></div>
                    </div>
                    <span style={{display: 'block',fontSize: '1.8rem'}}>{group.name}</span>
                </div>
            </Link>
            {groupNavigation}
            {/*<ExtendButton
                newRoot={group.uri}/>*/}
        </div>
    )
}

export const PureMobileGroup = ({styleName, style, group}) => {
    return(
        <div className={`item-container ${ styleName }`} style={{marginTop:style.marginTop,marginBottom:style.marginBottom}}>
            <Link to={"/" + group.uri} className="group-link">
                <div class="group-container" id={group.id}>
                    <div style={{width:'100%', backgroundColor:"#efefef", display:"inline-block", paddingTop: '27.25%', position: 'relative'}}>
                        <div class="group"></div>
                    </div>
                    <span style={{display: 'block',fontSize: '1.8rem'}}>{group.name}</span>
                </div>
            </Link>
            <ExtendButton
                newRoot={group.uri}/>
        </div>
    )
}

export const PureTreeGroup = ({initials, group, navigationArrows, className, children}) => {
    return(
        <li>
            <div className="item-container">
                <Link to={"/" + group.uri} className={`group-link ${className}`} >
                    <div className="group-container" id={group.key}>
                        <div className="group-banner" style={{backgroundImage:`url(${group.group_banner})`}}>
                            <div className="group">
                                <span>{initials}</span>
                            </div>
                        </div>
                        <span style={{display: 'block',fontSize: '1.8rem'}}>{group.name}</span>
                    </div>
                </Link>
                <ExtendButton
                    newRoot={group.uri}/>
                {navigationArrows}
            </div>
            {children}
        </li>
    )
}
