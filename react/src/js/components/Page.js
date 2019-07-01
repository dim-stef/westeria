import React, { Component,PureComponent,useState,useContext } from "react";
import { Helmet } from "react-helmet";
import MediaQuery from 'react-responsive';
import Responsive from 'react-responsive';
import {Content} from './presentational/Content'
import NavigationBar, {MobileNavigationBar,TabbedNavigationBar} from './presentational/Navigation'
import {UserContext} from './container/ContextContainer'


const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
const Tablet = props => <Responsive {...props} minDeviceWidth={768} maxDeviceWidth={1223} />;
const Mobile = props => <Responsive {...props} maxDeviceWidth={767} />;


if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

export const Page = React.memo(function Page(props){
    return(
        <div className="root-wrapper">
            <Desktop>
                <TabbedNavigationBar/>
            </Desktop>
            {/*<Tablet>
                <MobileNavigationBar/>
            </Tablet>
            <Mobile>
                <MobileNavigationBar/>
            </Mobile>*/}
            
            <div style={{marginTop:60}}>
            
                <div id="main-wrapper" className="main-wrapper">
                    <div id="wide-content-container" className="wide-content-container">
                        {props.children}
                    </div>
                </div>
            </div>

            <div className="success-message-container" style={{ display: 'none' }}>
                <p id="success-message" />
            </div>
        </div>
    )
})
export class Page2 extends PureComponent {

    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            isAuth:this.props.context.isAuth,
            branches:this.props.context.branches,
            currentBranch:this.props.context.currentBranch,
        }

        //this.updateUserData = this.updateUserData.bind(this)
    }


    render() {
        console.log("context",this.context)
        return (

            <div className="root-wrapper">
                {/*{localStorage.getItem('token') ? (
                    <div>
                        <div onClick={this.modalClick} id="modal-window" />
                            <div id="creategroup-container">
                        </div>
                    </div>
                ):(
                    null
                )}*/}

                    <Desktop>
                        <NavigationBar/>
                    </Desktop>
                    {/*<Tablet>
                        <MobileNavigationBar/>
                    </Tablet>
                    <Mobile>
                        <MobileNavigationBar/>
                    </Mobile>*/}
                    
                <div style={{marginTop:60}}>
                
                    <div id="main-wrapper" className="main-wrapper">
                        <div id="wide-content-container" className="wide-content-container">
                            {this.props.children}
                        </div>
                    </div>
                </div>

                <div className="success-message-container" style={{ display: 'none' }}>
                    <p id="success-message" />
                </div>
            </div>
        )
    }
}

//Page.whyDidYouRender = true;

