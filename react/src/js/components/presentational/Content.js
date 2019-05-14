import React, { Component } from "react";
import MediaQuery from 'react-responsive';
import {WideScreenNavigation} from './WideScreenNavigation'
import {MobileNavigation} from './MobileNavigation'

export const Content = (props) => {
    return (
        <>
            <MediaQuery query="(max-width: 1200px)">
                <MobileNavigation />
                <div id="mobile-content-container" style={{ height: '100%' }}>
                    {props.children}
                </div>
            </MediaQuery>

            <MediaQuery query="(min-width: 1201px)">
                <NavigationBar/>
                <div style={{marginTop:60}}>
                    <WideScreenNavigation />
                    <div id="main-wrapper" className="main-wrapper">
                        <div id="wide-content-container" className="wide-content-container">
                            {props.children}
                        </div>
                    </div>
                </div>
            </MediaQuery>
        </>
    )
}



class NavigationBar extends Component{
    render(){
        return(
            <div style={{
                    height: 50,
                    position: "fixed",
                    width: "100%",
                    backgroundColor: "white",
                    borderBottom: "1px solid rgba(0,0,0,0.25)",
                    zIndex: 5000
                }}
            />
        )
    }
}