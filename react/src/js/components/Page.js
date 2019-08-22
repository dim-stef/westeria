import React, { Component,PureComponent,useState,useContext } from "react";
import { Helmet } from "react-helmet";
import Responsive from 'react-responsive';


if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

export const Page = React.memo(function Page(props){
    return(
        <div className="root-wrapper">
            <div>
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

