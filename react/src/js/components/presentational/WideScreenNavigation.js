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

    render(){
        return (
            <>
            
            </>
        )
    }
}



export class LeftPageBar extends Component{
    render(){
        return(
            <div className="side-bar-container" style={{left:0}}>
                <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "flex-end"}}>
                        <div style={{
                                height: "100%",
                                width: "70%",
                                right: 0,
                                display: "flex",
                                flexFlow: "column",
                                alignItems: "center",
                                margin: '0 20px'
                        }}>
                            <BranchBox branch={this.props.branch}/>
                        </div>
                </div>
            </div>
        )
    }
}


class BranchPictureBox extends Component{
    render(){
        return(
            <div style={{alignSelf:'center',display:'flex',flexFlow:'column'}}>
                <BigBranchPicture branch={this.props.branch}/>
                <BranchName branch={this.props.branch}/>
            </div>
        )
    }
}

class BranchName extends Component{
    static contextType = UserContext

    render(){
        console.log(this.context);
        return(
            <>
            <div style={{alignSelf:'flex-start',fontSize:'2em'}}>
                {this.props.branch.name}
            </div>
            <div style={{alignSelf:'flex-start', fontSize:'1.5em',color:'#565656'}}>
                @{this.props.branch.uri}
            </div>
            </>
        )
    }
}
class BranchBox extends Component{

    render(){
        return(
            <div style={{
                height: 400,
                width: "100%",
                display: "flex",
                flexFlow: "column"
            }}>
            <BranchPictureBox branch={this.props.branch}/>
        </div>
        )
    }
}


class BoringBar extends Component{
    render(){
        return(
            <div style={{position:'fixed',height:'100%',width:200,right:0,backgroundColor:'#E8EEF0'}}></div>
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

class BottomBar extends Component{
    static contextType = UserContext
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="branch-carousel">
                <Logout/>
                <span style={{fontSize:'1.3rem',WebkitBoxFlex:1,flexGrow:1,flexShrink:1,color:'#00000087',textAlign:'center'}}>© 2019 Subranch</span>
            </div>
        )
    }
}

class BigBranchPicture extends Component{
    static contextType = UserContext

    render(){
        return(
            <Link to={`/${this.props.branch.uri}`} className="profile-picture" 
            style={{
                width:128,
                height:128,
                border:'5px solid white',
                backgroundImage:`url(${this.props.branch.branch_image})`}}
                />
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
            <div className="right-page-bar-container" id="right-page-bar-container">
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
        <Link to="/" className="feed" id="feed" style={{borderBottom: '1px solid #0a495f'}}>
        <svg style={{ width: 33, height: 33 ,marginLeft: 10}} viewBox="0 0 24 24">
            <path
                fill="#ffffff"
                d="M20 11H4V8h16m0 7h-7v-2h7m0 6h-7v-2h7m-9 2H4v-6h7m9.33-8.33L18.67 3 17 4.67 15.33 3l-1.66 1.67L12 3l-1.67 1.67L8.67 3 7 4.67 5.33 3 3.67 4.67 2 3v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V3l-1.67 1.67z"
            />
        </svg>

            <span className="main-buttons">Feed</span>
        </Link>
    )
}

const MyBranchesButton = () => {
    return (
        <Link to="/mybranches" className="my-groups" style={{borderBottom: '1px solid #0a495f'}} id="my-groups">
        <svg style={{ width: 33, height: 33, marginLeft: 10 }} viewBox="0 0 24 24">
            <path
                d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"
                style={{ fill: "white" }}
            />
            <path d="M0 0h24v24H0z" fill="none" />
        </svg>
            <span className="main-buttons">My branches</span>
        </Link>
    )
}
const MapButton = () => {
    return (
        <Link to="/global" className="map" id="map" style={{borderBottom: '1px solid #0a495f'}}>
        <svg style={{ width: 33, height: 33, marginLeft: 10 }} viewBox="0 0 24 24">
        <path
            d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"
            style={{ fill: "white" }}
        />
        <path d="M0 0h24v24H0z" fill="none"/>
        </svg>
            <span className="main-buttons">Explore</span>
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

class LeftPageBar2 extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="utility-side-bar">
                <div className="utility-top">
                    <Search />
                    <Create />
                    <Messages/>
                    <Notifications/>
                    {/*<Create2 />*/}
                </div>
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
            <button onClick={this.createClick} id="create" className="fa fa-plus utility-buttons" style={{ marginTop: 60 }}></button>
        )
    }
}

class Messages extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <button style={{ background: 'transparent', border: 0 }} className="far fa-envelope noselect utility-buttons" style={{ fontSize: 24 }}></button>
        )
    }
}

class Notifications extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <button style={{ background: 'transparent', border: 0 }} className="far fa-bell noselect utility-buttons" style={{ fontSize: 24 }}></button>
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
            <button type="submit" id="signout" className="fa fa-sign-out-alt settings-button utility-buttons" style={{ fontSize: 20 }} onClick={this.handleClick} />
            
        )
    }
}