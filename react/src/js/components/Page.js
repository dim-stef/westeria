import React, { Component } from "react";
import { Link } from 'react-router-dom'
import { Helmet } from "react-helmet";
import MediaQuery from 'react-responsive';
import {Content} from './presentational/Content'
import $ from "jquery";

export class Page extends Component {

    constructor(props){
        super(props);
    }

    modalClick() {
        if ($("#group-container").length) {
            document.getElementById("modal-window").classList.toggle("modal-window");
            document.getElementById("group-container").classList.toggle("show");
        }
    }


    render() {
        console.log(localStorage.getItem('token'))
        return (
            <div className="root-wrapper">
                {localStorage.getItem('token') ? (
                    <div>
                        <div onClick={this.modalClick} id="modal-window" />
                            <div id="creategroup-container">
                        </div>
                    </div>
                ):(
                    null
                )}
                
                
                <Content {...this.props}/>

                <div className="success-message-container" style={{ display: 'none' }}>
                    <p id="success-message" />
                </div>
            </div>
        )
    }
}


