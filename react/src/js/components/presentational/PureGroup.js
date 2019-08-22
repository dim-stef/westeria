import React, { Component } from "react";
import { Link } from 'react-router-dom'
import {ExtendButton} from "./ExtendButton"
import {BranchDetails} from "./BranchDetails"
import {BranchNavigation} from "./BranchNavigation"
import {UserContext} from '../container/ContextContainer'
import axios from 'axios'


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var csrftoken = getCookie('csrftoken');

export class Branch extends Component{
    static contextType = UserContext

    constructor(props){
        super(props);
    }

    render(){
        let {styleName='', style=null, branch, branchNavigation=null,type="child",editMode, children} = this.props
         

        return(
            <>
            <div className="item-container flex-fill" style={{marginTop:style.marginTop,
            marginBottom:style.marginBottom, 
            flexBasis:style.flexBasis}}>
                {type==="parent" ?
                    <ParentBranch  styleName={styleName} width={style.width}>
                        <BranchBanner branch={branch} dimensions={style.branchDimensions} parent editMode={editMode}/>
                    </ParentBranch>
                    :
                    <ChildBranch uri={branch.uri} styleName={styleName} width={style.width}>
                        <BranchBanner branch={branch} dimensions={style.branchDimensions}/>
                    </ChildBranch>
                }
                {children}
            </div>
            {branchNavigation ? <BranchNavigation branch={branch}/> : null}
            </>  
        )
    }
}

class BranchBanner extends Component{
    constructor(props){
        super(props);
        
        this.onClick = this.onClick.bind(this);
        this.updateBanner = this.updateBanner.bind(this);

        this.state = {
            editMode:false,
            editMenu:false,
            branchBanner:this.props.branch.branch_banner
        }
    }

    updateBanner(url){
        this.setState({branchBanner:url,editMenu:false});
    }

    onClick(e){
        if(this.props.editMode){
            this.setState((prevState,currentProps)=>{
                return {editMenu:!prevState.editMenu}
            })
        }
    }

    render(){
        return(
        <div className="group-container" id={this.props.branch.id} >
            <div onClick={this.onClick} style={{paddingTop: '33.33333%', position: 'relative',width:"100%",
            backgroundImage:`url(${this.state.branchBanner ? this.state.branchBanner : this.props.branch.branch_banner})`, backgroundRepeat:'no-repeat',backgroundSize:'cover',backgroundPosition:'center'}}>
                {this.state.editMenu && this.props.editMode ? <BranchImageEditMenu branch={this.props.branch} updateBanner={this.updateBanner} type="banner"/> : null}
                <BranchImage branch={this.props.branch} dimensions={this.props.dimensions} editMode={this.props.editMode}/>
            </div>
        </div>
        )
    }
}

class BranchImage extends Component {
    constructor(props){
        super(props);

        this.state = {
            height:0,
            editMode:false,
            editMenu:false,
            branchImage:this.props.branch.branch_image
        }

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

    updateImage(url){
        this.setState({branchImage:url,editMenu:false})
    }

    componentDidMount(){
         
        this.setState({
            height:this.el.clientWidth
        })
    }

    render(){
        var initials;
        var matches = this.props.branch.name.match(/\b(\w)/g);
        if(!matches){
            initials = this.props.branch.name;
        }else{
            initials = matches.join('')
        }
    
        var branchImage;
        if(this.props.branch.branch_image){
            branchImage=(
                <div ref={el =>this.el = el} className="group" style={{width:this.props.dimensions,height:this.props.dimensions}}> {/* use this.props.dimensions for fixed dimensions */}
                    <div style={{width:'100%',height:'100%',overflow:'hidden',borderRadius:'50%'}}>
                        <button className="group"
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
                    {this.state.editMenu && this.props.editMode ? <BranchImageEditMenu branch={this.props.branch} updateImage={this.updateImage}/> : null}
                </div>
            )
        }
        else{
            branchImage = (
                <div className="group" style={{width: this.props.dimensions, height:this.props.dimensions,backgroundColor:getRandomColor()}}>
                    <span style={{fontSize:'3em'}}>{initials}</span>
                </div>
            )
        }
        return branchImage;
    }
    
}

class BranchImageEditMenu extends Component{
    static contextType = UserContext

    constructor(props){
        super(props);
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
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

const ChildBranch = ({uri,styleName,width,children}) =>{
    return(
        <Link to={"/" + uri} className={`group-link ${ styleName }`} style={{width:width}}>
            {children}
        </Link>
    )
}

const ParentBranch = ({styleName,width,children}) =>{
    return(
        <div className={`group-link ${ styleName }`} style={{width:width,border:0}}>
            {children}
        </div>
    )
}



export const PureMobileGroup = ({styleName, style, branch}) => {
    return(
        <div className={`item-container ${ styleName }`} style={{marginTop:style.marginTop,marginBottom:style.marginBottom}}>
            <Link to={"/" + branch.uri} className="group-link">
                <div class="group-container" id={branch.id}>
                    <div style={{width:'100%', backgroundColor:"#efefef", display:"inline-block", paddingTop: '27.25%', position: 'relative'}}>
                        <div class="group"></div>
                    </div>
                    <span style={{display: 'block',fontSize: '1.8rem'}}>{branch.name}</span>
                </div>
            </Link>
            <ExtendButton
                newRoot={branch.uri}/>
        </div>
    )
}

export const PureTreeGroup = ({initials, group, navigationArrows, className, children}) => {
    return(
        <li>
            <div className="item-container">
                <Link to={"/" + group.uri} className={`group-link ${className}`} >
                    <div className="group-container" id={group.key}>
                        <div className="group-banner" style={{backgroundImage:`url(${group.group_banner})`}}>
                            <div className="group">
                                <span>{initials}</span>
                            </div>
                        </div>
                        <span style={{display: 'block',fontSize: '1.8rem'}}>{group.name}</span>
                    </div>
                </Link>
                <ExtendButton
                    newRoot={group.uri}/>
                {navigationArrows}
            </div>
            {children}
        </li>
    )
}
