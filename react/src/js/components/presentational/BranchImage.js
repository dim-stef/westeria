import React, {Component} from "react";
import {UserContext} from '../container/ContextContainer'
import axios from 'axios'

export class BranchImage2 extends Component {
    constructor(props){
        super(props);

        this.state = {
            width:0,
            imageOffsetLeft:0,
            editMode:false,
            editMenu:false,
            underBannerInfoHeight:0,
            branchImage:this.props.branch.branch_image
        }

        this.onResize = this.onResize.bind(this);
        this.onClick = this.onClick.bind(this);
        this.updateImage = this.updateImage.bind(this);
    }

    onClick(e){
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();

        if(this.props.editMode){
            this.setState((prevState,currentProps)=>{
                return {editMenu:!prevState.editMenu}
            })
        }
    }

    onResize(){
        this.setState({
            width:this.el.offsetWidth,
            imageOffsetLeft:this.el.offsetLeft,
        })
    }

    updateImage(url){
        this.setState({branchImage:url,editMenu:false})
    }

    componentDidMount(){
        window.addEventListener("resize",this.onResize);
        this.setState({
            width:this.el.offsetWidth,
            imageOffsetLeft:this.el.offsetLeft,
        })
    }

    componentWillUnmount(){
        window.removeEventListener("resize",this.onResize);
    }

    render(){
        var initials;
        var matches = this.props.branch.name.match(/\b(\w)/g);
        if(!matches){
            initials = this.props.branch.name;
        }else{
            initials = matches.join('')
        }
        var style = this.props.parent ? ({
            imageStyle: {
                width:'20%',
                bottom:'-30%',
                left:'7%'
            },
            nameStyle:{
                margin:'10px 0px 10px 10px'
            }
        }) : ({
            imageStyle:{
                width:'25%',
                bottom:'-40%',
                left:'5%'
            },
            nameStyle:{
                margin:'2px 0px 5px 5px'
            }
        });

        var branchImage;
        if(this.props.branch.branch_image){
            branchImage=(
                <>
                <div ref={(img) => { this.el = img }} id={`${this.props.branch.uri}-image`} className="branch-profile-container" style={{width:style.imageStyle.width,
                height: this.state.width,
                bottom:style.imageStyle.bottom,
                left:style.imageStyle.left
                }}
                key={this.props.branch.uri}> {/* use this.props.dimensions for fixed dimensions */}
                    <div style={{width:'100%',height:'100%',overflow:'hidden',borderRadius:'50%',border:'3px solid white'}}>
                        <button
                        onClick={this.onClick}
                        style={{
                        width:'100%',
                        height: '100%',
                        margin:0,
                        backgroundImage:`url(${this.state.branchImage})`, 
                        backgroundRepeat:'no-repeat',
                        backgroundSize:'cover',
                        backgroundPosition:'center',
                        border:0}}></button>
                        
                    </div>
                </div>
                </>
            )
        }
        else{
            branchImage = (
                <div className="group" style={{width:'20%', height:this.state.width,backgroundColor:getRandomColor()}}>
                    <span style={{fontSize:'3em'}}>{initials}</span>
                </div>
            )
        }
        return branchImage;
    }
    
}


export class BranchImageEditMenu extends Component{
    static contextType = UserContext

    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onClick(e){
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    }

    onChange(e){
        var url = `/api/branches/update/${this.props.branch.uri}/`;

        var data = new FormData();
        if(this.props.type==="banner"){
            data.append("branch_banner", this.el.files[0]);
        }
        else{
            data.append("branch_image", this.el.files[0]);
        }

        const request = axios.patch(
            url,
            data, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': csrftoken
            },
            withCredentials: true,
            crossdomain: true,
        }).then(response => { 
            this.context.updateUserData();
            if(this.props.type==="banner"){
                this.props.updateBanner(response.data.branch_banner)
            }else{
                this.props.updateImage(response.data.branch_image)
            }
            
        })
        .catch(error => {
        });
    }

    render(){
        var className = "";
        if(this.props.type==="banner"){
            className="banner-editmode";
        }

        return(
            <div onClick={this.onClick} className={`profile-image-editmode ${className}`}>
                <div className="arrow-up"></div>
                <div style={{backgroundColor:"white", padding:10}}>
                    <label htmlFor="branchImageInput">{this.props.type==="banner" ? "Change Banner": "Change Profile"}</label>
                    <input ref={el=>this.el = el} type="file" id="branchImageInput" style={{width:0,height:0}} onChange={this.onChange} ></input>
                </div>
            </div>
        )
    }
}

export function BranchImage({branch,className}){
    let bottom = branch.description ? -170 : -80;
    return(
        <img src={branch.branch_image} className={className} style={{bottom:bottom}}></img>
    )
}