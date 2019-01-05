import React, { Component } from "react";
import { Link } from 'react-router-dom'
import { Redirect } from 'react-router'
import {UserContext} from '../container/ContextContainer'
import axios from 'axios'


var csrftoken = getCookie('csrftoken');

const CSRFToken = () => {
    return (
        <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
    );
};


export class WideScreenNavigation extends Component {
    static contextType = UserContext
    constructor(props){
        super(props);
    }

    setMargin(){
        var content = document.getElementById("wide-content-container");
        var width = this.div.offsetWidth;
        content.style.marginLeft = `${width}px`
    }

    componentDidMount(){
        this.setMargin();   
    }

    componentDidUpdate(){
        this.setMargin();
    }

    render(){
        return (
            <div ref={(e) => this.div = e} className="side-bar-container">
                {this.context.isAuth ? (
                    <div style={{display:'flex',flexFlow:'column'}}>
                        <BranchCarousel />
                        <div style={{display:'flex',flexBasis:'90%'}}>
                            <LeftPageBar />
                            <RightPageBar />
                        </div>
                        
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
}

class BranchCarousel extends Component{
    static contextType = UserContext
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="branch-carousel">
                <ProfilePicture/>
            </div>
        )
    }
}

class ProfilePicture extends Component{
    static contextType = UserContext
    constructor(props) {
        super(props)
        this.state = {
            profileImage:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='
        }
    }

    setProfilePicture(){
        this.setState({profileImage:this.context.currentBranch.branch_image})
    }

    componentDidMount(){
        this.setProfilePicture();
    }

    componentDidUpdate(){
        if(this.context.currentBranch.branch_image !== this.state.profileImage){
            this.setProfilePicture();
        }
    }

    render(){
        return(
            <Link to={`/${this.context.currentBranch.uri}`} className="profile-picture" style={{backgroundImage:`url(${this.state.profileImage})`}}/>
        )
    }
}


class RightPageBar extends Component {
    static contextType = UserContext
    constructor(props) {
        super(props)
        this.state = {
            profileImage:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='
        }
    }

    async setProfilePicture(){
        this.setState({profileImage:this.context.currentBranch.branch_image/*data[0].profile_image*/})
    }

    componentDidMount(){
        this.setProfilePicture();
    }

    componentDidUpdate(prevProps, prevState){
        if(this.context.currentBranch.branch_image !== this.state.profileImage){
            this.setProfilePicture();
        }
    }

    render() {
        return (
            <div className="container-side" id="container-side">
                {/*<a className="prof" id="prof">
                    <div id="img-container" className="img-container">
                    </div>
                    <img src={this.state.profileImage} alt="" className="prof-pic noselect" style={{width: '100%'}}/>
                </a>*/}
                <a className="prof" id="prof" style={{width:114,height:114,backgroundPosition:'center',backgroundSize:'cover',backgroundRepeat:'no-repeat',backgroundImage:`url(${this.state.profileImage})`}}></a>
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
            <MyBranchesButton />
            <MapButton />
        </div>
    )
}

const FeedButton = () => {
    return (
        <Link to="/" className="feed" id="feed">
        <svg style={{ width: 34, height: 34 ,marginRight: 10}} viewBox="0 0 24 24">
            <path
                fill="#ffffff"
                d="M20 11H4V8h16m0 7h-7v-2h7m0 6h-7v-2h7m-9 2H4v-6h7m9.33-8.33L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V3l-1.67 1.67z"
            />
        </svg>

            <span className="main-buttons" style={{marginRight:25}}>Feed</span>
        </Link>
    )
}

const MyBranchesButton = () => {
    return (
        <Link to="/mybranches" className="my-groups" id="my-groups">
            <span className="main-buttons">My branches</span>
        </Link>
    )
}
const MapButton = () => {
    return (
        <Link to="/global" className="map" id="map">
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
                    {/*<Create2 />*/}
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
            <button style={{ background: 'transparent', border: 0 }}><i className="material-icons noselect" style={{ fontSize: 44, color: 'white', marginTop: 10 }}>search</i></button>
        )
    }
}

class Create2 extends Component {
    constructor(props){
        super(props);
    }

    render() {
        return (
            <button onClick={this.createClick} id="create2" className="material-icons utility-buttons" style={{ marginTop: 40 }}>create2</button>
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

class Logout extends Component {

    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.state = {
            redirectToReferrer:false
        }
    }

    handleSubmit(){
        localStorage.removeItem('token');
    }

    handleClick(){
        axios({
            method: 'post',
            url:"/rest-auth/logout/",
            contentType: 'application/json',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + localStorage.getItem("token"),
                'X-CSRFToken': getCookie('csrftoken')
            }
        }).then(r=>{
            localStorage.removeItem('token');
            this.setState({redirectToReferrer:true});
        }).catch(er=>{
            console.log(er)
        })
    }

    render(){
        if(this.state.redirectToReferrer){
            return <Redirect to="/login"/>
        }
        return (
            <button type="submit" id="signout" className="fa fa-sign-out settings-button utility-buttons" style={{ fontSize: 20 }} onClick={this.handleClick} />
            
        )
    }
}