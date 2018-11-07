import React, { Component } from "react";
import { Link } from 'react-router-dom'
import {Helmet} from "react-helmet";
import $ from "jquery";


var csrftoken = getCookie('csrftoken');

const CSRFToken = () => {
    return (
        <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
    );
};

export class SideBar extends Component {
    createClick() {
        $.ajax({
            url: "/creategroup",
            success: function () {
                if (!$("#group-container").length) {
                    $("#creategroup-container").load("/creategroup #group-container", function () {
                        $('<script>', { src: '/static/groups/js/creategroupajax.js' }).appendTo('head');
                        document.getElementById("modal-window").classList.add("modal-window");
                        document.getElementById("group-container").classList.add("show");
                    });
                }
            }
        });
        if ($("#group-container").length) {
            document.getElementById("modal-window").classList.toggle("modal-window");
            document.getElementById("group-container").classList.toggle("show");
        }
    }

    modalClick() {
        if ($("#group-container").length) {
            document.getElementById("modal-window").classList.toggle("modal-window");
            document.getElementById("group-container").classList.toggle("show");
        }
    }

    render() {
        return (
            <div className="root-wrapper">
                <div onClick={this.modalClick} id="modal-window" />
                <div id="creategroup-container">
                </div>
                <div class="mobile-menu">
                    <div style={{width: '100%', position: 'relative', height: 100, backgroundColor: '#266277', zIndex: 5}}>
                        <div className="mobile-top-bar-container">
                            <div className="mobile-top-bar">
                                <div className="search-container">
                                    <button className="search-button">
                                        <i class="material-icons noselect" style={{ fontSize:"3em", color:"whitesmoke"}}>search</i>
                                    </button>
                                    <input className="search" type="text" placeholder="Search"></input>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="mobile-content-container" className="main content">
                </div>
                {/* 
                    <div className="closed-drawer-container">
                        <button name="drawer" className="material-icons drawer-btn closed-drawer-btn">menu</button>
                    </div>
                */}
                
                <div className="side-bar-container">
                    <div className="utility-side-bar">
                        <div className="utility-top">
                            <i class="material-icons noselect" style={{fontSize: 44, color: 'white', marginTop: 10}}>search</i>
                            <button onClick={this.createClick} id="create" className="material-icons utility-buttons" style={{marginTop:40}}>create</button>
                        </div>
                        <form method="post" action="/logout/">
                                <CSRFToken />
                                <button type="submit" id="signout" className="fa fa-sign-out settings-button utility-buttons" style={{ fontSize: 20 }} />
                            </form>
                    </div>
                    <div className="container-side" id="container-side">
                        {/*<button name="drawer" className="material-icons drawer-btn">menu</button>*/}
                        <a className="prof" id="prof">
                        </a>
                        <div id="inner-container" className="inner-container">
                            <Link to="/" className="feed" id="feed">
                                <span className="main-buttons">Feed</span>
                            </Link>
                            <Link to="/" className="my-groups" id="my-groups">
                                <span className="main-buttons">My groups</span>
                            </Link>
                            <Link to="/map" className="map" id="map">
                                <span className="main-buttons">Map</span>
                            </Link>
                        </div>
                        <div className="utility-buttons-container">
                            <Link to="/settings">
                                <button id="settings" className="material-icons settings-button utility-buttons">settings</button>
                            </Link>
                            
                        </div>
                    </div>
                </div>
                <div id="main-wrapper" className="main-wrapper">
                    <div id="wide-content-container">
                        <div id="content" className="content">
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
