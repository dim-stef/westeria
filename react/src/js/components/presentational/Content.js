import React, { Component } from "react";
import MediaQuery from 'react-responsive';
import {WideScreenNavigation} from './WideScreenNavigation'
import {MobileNavigation} from './MobileNavigation'

export const Content = (props) => {
    return (
        <div>
            <MediaQuery query="(max-width: 1200px)">
                <MobileNavigation />
                <div id="mobile-content-container" style={{ height: '100%' }}>
                    {props.children}
                </div>
            </MediaQuery>

            <MediaQuery query="(min-width: 1201px)">
                <WideScreenNavigation />
                <div id="main-wrapper" className="main-wrapper">
                    <div id="wide-content-container" style={{ marginLeft: 190 }}>
                        {props.children}
                    </div>
                </div>
            </MediaQuery>
        </div>
    )
}