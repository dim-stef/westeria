import React, { Component } from "react";
import { Link } from 'react-router-dom'
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
            <div>
                <div onClick={this.modalClick} id="modal-window" />
                <div id="creategroup-container">
                </div>
                <div id="mobile-content-container" className="main content">
                </div>
                <div className="closed-drawer-container">
                    <button name="drawer" className="material-icons drawer-btn closed-drawer-btn">menu</button>
                </div>
                <div className="mobile-buttons-container">
                    <button id="feed-mobile" className="mobile-buttons material-icons" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.15)' }}>home
            </button>
                    <button id="create-mobile" className="mobile-buttons material-icons" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.15)', borderLeft: '1px solid rgba(0, 0, 0, 0.15)' }}>create
            </button>
                    <button id="settings-mobile" className="mobile-buttons material-icons" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.15)', borderLeft: '1px solid rgba(0, 0, 0, 0.15)' }}>
                        settings
            </button>
                    <button name="drawer" id="mobile-drawer" className="mobile-buttons mobile-drawer material-icons">menu</button>
                </div>
                <div className="container-side" id="container-side">
                    <button name="drawer" className="material-icons drawer-btn">menu</button>
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
                        <button onClick={this.createClick} id="create" className="material-icons utility-buttons">create</button>
                        <form method="post" action="/logout/">
                            <CSRFToken />
                            <button type="submit" id="signout" className="fa fa-sign-out settings-button utility-buttons" style={{ fontSize: 20 }} />
                        </form>
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
