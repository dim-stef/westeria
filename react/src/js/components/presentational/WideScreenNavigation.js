import React, { Component } from "react";
import { Link } from 'react-router-dom'
import axios from 'axios'

var csrftoken = getCookie('csrftoken');

const CSRFToken = () => {
    return (
        <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
    );
};


export const WideScreenNavigation = () => {
    return (
        <div className="side-bar-container">
            {localStorage.getItem('token') ? (
                <div style={{display:'flex'}}>
                    <LeftPageBar />
                    <RightPageBar />
                </div>
            ):(
                <div style={{display:'flex'}}>
                    <AnonLeftPageBar />
                    <AnonRightPageBar />
                </div>
            )}
            
        </div>
    )
}

class RightPageBar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            profileImage:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='
        }
    }

    async setProfilePicture(){
        var response = await axios.get('/api/profile/');
        var data = response.data;
        this.setState({profileImage:data[0].profile_image})
    }

    componentDidMount(){
        this.setProfilePicture();
    }

    render() {
        return (
            <div className="container-side" id="container-side">
                <a className="prof" id="prof">
                    <div id="img-container" className="img-container">
                    </div>
                    <img src={this.state.profileImage} alt="" className="prof-pic noselect" style={{width: '100%'}}/>
                </a>
                <NavigationButtons />
                <div className="utility-buttons-container">
                    <UtilityButtons/>
                </div>
            </div>
        )
    }
}

class AnonRightPageBar extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="container-side" id="container-side"></div>
        )
    }
}

const UtilityButtons = () => {
    return (
        <div>
            <SettingsButton/>
        </div>
    )
}

const SettingsButton = () => {
    return (
        <Link to="/settings">
            <button id="settings" className="material-icons settings-button utility-buttons">settings</button>
        </Link>
    )
}

const NavigationButtons = () => {
    return (
        <div id="inner-container" className="inner-container">
            <FeedButton />
            <MyGroupsButton />
            <MapButton />
        </div>
    )
}

const FeedButton = () => {
    return (
        <Link to="/" className="feed" id="feed">
            <span className="main-buttons">Feed</span>
        </Link>
    )
}

const MyGroupsButton = () => {
    return (
        <Link to="/" className="my-groups" id="my-groups">
            <span className="main-buttons">My groups</span>
        </Link>
    )
}
const MapButton = () => {
    return (
        <Link to="/map" className="map" id="map">
            <span className="main-buttons">Map</span>
        </Link>
    )
}


class AnonLeftPageBar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="utility-side-bar">
                
            </div>
        )
    }
}

class LeftPageBar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="utility-side-bar">
                <div className="utility-top">
                    <Search />
                    <Create />
                </div>
                <Logout />
            </div>
        )
    }
}

class Search extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <button style={{ background: 'transparent', border: 0 }}><i class="material-icons noselect" style={{ fontSize: 44, color: 'white', marginTop: 10 }}>search</i></button>
        )
    }
}

class Create extends Component {
    constructor(props) {
        super(props)
    }

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

    render() {
        return (
            <button onClick={this.createClick} id="create" className="material-icons utility-buttons" style={{ marginTop: 40 }}>create</button>
        )
    }
}

const Logout = () => {
    return (
        <form method="post" action="/logout/">
            <CSRFToken />
            <button type="submit" id="signout" className="fa fa-sign-out settings-button utility-buttons" style={{ fontSize: 20 }} />
        </form>
    )
}