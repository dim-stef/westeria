import React, { Component,useState } from "react";
import {PureMobileGroup} from "./PureGroup"
import {ParentBranch,ChildBranch} from "./Branch"
import BranchFooter, {Modal,ToggleContent} from "./Temporary"
import {UserContext} from '../container/ContextContainer'
import MediaQuery from 'react-responsive';

const REACT_VERSION = React.version;
 

function ownBranch(targetBranch, branches){
    return branches.find(b=>{
        return b.uri === targetBranch.uri
    })
}

export class BranchesPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            branches:this.props.branches,
        }
    }

    render(){

        var branches =  (
            <div className="branch-details-container">
                <div className="branch-details-children">
                    <BranchList branches={this.props.branches}/>
                    <AddBranch/>
                </div>
            </div>
        )

        return (
            <div>
                {branches}
            </div>
        )
    }
}

function AddBranch(){
    const [clicked,setClicked] = useState(false);

    const onClick = () =>{
        setClicked(!clicked);
    }

    let style={
        marginTop:10,
        display:'flex',
        flexFlow:'column',
        height:334,
        backgroundColor:'rgb(216, 225, 234)',
        justifyContent:'center',
        alignItems:'center'
    }
    let largeStyle={...style,flexBasis:'49%'};
    let smallStyle={...style,flexBasis:'33%'};

    return(
        
        <ToggleContent 
            toggle={show=>(
                <div className="branch-add-button" role="button" onClick={show}>
                    <AddBranchSvg width={100} height={100}/>
                    <h1 className="branch-add-text">Add Branch</h1>
                </div>
            )}
            content={hide => (
                <Modal onClick={hide}>
                    <div style={{width:708,height:500,margin:'0 auto',marginTop:60,backgroundColor:'white'}} onClick={e=>e.stopPropagation()}> 
                        <div style={{padding:'30px 20px'}}></div>
                    </div>
                </Modal>
                
      )}/>
    )
}

function AddBranchSvg({width,height}){
    return(
        <svg
            xmlnsXlink="http://www.w3.org/1999/xlink"
            version="1.1"
            x="0px"
            y="0px"
            className="branch-add-icon"
            style={{ fill: "#71859b", width: width, height: height }}
            id="branchAddIcon"
            viewBox="0 0 357 357"
            xmlSpace="preserve"
            >
            <path d="M357 204H204v153h-51V204H0v-51h153V0h51v153h153v51z" />
        </svg>

    )
}

class BranchList extends Component{
    static contextType = UserContext
    
    render(){
        return(
            this.props.branches.children.map((c)=>{  
                return [
                    <MediaQuery query="(min-width: 1601px)" key={`${c.uri}-large`}>
                        <div className="branch-container standard-border" style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}>
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c}/>
                        </div>
                    </MediaQuery>,
                    <MediaQuery query="(max-width: 1600px)" key={`${c.uri}-small`}>
                        <div className="branch-container standard-border" style={{display:'flex', width:'100%',flexBasis:'33%',flexFlow:'column'}}>
                            <ChildBranch
                            style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%', branchDimensions:96}} 
                            branch={c}>
                                
                            </ChildBranch>
                            <BranchFooter branch={c}/>
                        </div>
                    </MediaQuery>
                ]
            })
        )
    }
}



class BranchFooter2 extends Component{

    constructor(props){
        super(props);

        this.onResize = this.onResize.bind(this);
        this.updateStateFromImage = this.updateStateFromImage.bind(this);

        this.state = {
            imagePosition:null,
            bannerPosition:null,
            imageWidth:0,
            imageOffsetLeft:0
        }
    }

    updateStateFromImage() {
        let image = document.getElementById(`${this.props.branch.uri}-image`)
        let banner = document.getElementById(this.props.branch.id)
        let offsetLeft = image.offsetLeft;
        let width = image.offsetWidth;
        let imagePosition = image.getBoundingClientRect();
        let bannerPosition = banner.getBoundingClientRect();
        this.setState({imagePosition:imagePosition,bannerPosition:bannerPosition,imageWidth:width,imageOffsetLeft:offsetLeft})
    }

    componentDidMount(){
        window.addEventListener('resize', this.onResize);

        this.updateStateFromImage();
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.onResize);
    }

    onResize(){
        this.updateStateFromImage();
    }

    render(){
        return(
            <div className="branch-footer flex-fill">
                <UnderBannerInfo imageOffsetLeft={this.state.imageOffsetLeft}
                imageWidth={this.state.imageWidth}
                branch={this.props.branch}
                bannerPosition={this.state.bannerPosition}
                imagePosition={this.state.imagePosition}
                />
                <BranchDescription branch={this.props.branch}/>
                <BranchFollow/>
            </div>
        )
    }
}

const UnderBannerInfo = (props) =>{
    let height = props.bannerPosition ? Math.abs(props.bannerPosition.bottom - props.imagePosition.bottom) : 0
    return(
        <div className="under-banner-info" style={{height:height}}>
            <BranchName imageOffsetLeft={props.imageOffsetLeft} imageWidth={props.imageWidth} branch={props.branch}/>
        </div>
    )
}

const BranchName = (props) =>{
    return(
        <div className="branch-name" style={{margin:0,left:props.imageOffsetLeft+props.imageWidth+10}}>
            <div style={{fontSize: "2.5rem", fontWeight:500}}>{props.branch.name}</div>
            <div style={{fontSize: "1.5rem", color: "rgb(86, 86, 86)"}}>@{props.branch.uri}</div>
        </div>
    )
}

class BranchDescription extends Component{
    render(){
        return(
            <div style={{width:'100%', height:80, textAlign:'start',marginLeft:10,marginTop:10}}>
                <div className="branch-description">
                    {this.props.branch.description}
                </div>
            </div>
        )
    }
}

class BranchFollow extends Component{
    render(){
        return(
            <button className="group-join branch-view-button">Follow</button>
        )
    }
}

class ParentBranchWrapper extends Component {
    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            editMode:false
        }
    }

    render(){
        var styleName = 'parent';
        return(
            <div style={{flexBasis:'100%'}}>
                <div style={{backgroundColor:'#ffffff'}}>
                    <ParentBranch 
                        styleName={styleName}
                        style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%'}} 
                        branch={this.props.branch}
                        branchNavigation
                        editMode={this.state.editMode}
                    ></ParentBranch>
                </div>
            </div>
        )
    }
}


export class MobileGroups extends Component{
    constructor(props){
        super(props);
        this.state = {
            branches:this.props.branches
        }
    }

    collectGroups(){
        let branches = this.state.branches.children.map((c)=>{
            var styleName = '';
            return (
                <PureMobileGroup styleName={styleName} style={{marginTop:10,marginBottom:0}} branch={c}/>
            )
        })
        return branches;
    }

    render(){
        var branches = this.collectGroups();
        var parent = this.state.branches.parent;
        var styleName = 'parent';
        return (
            <div style={{display: 'flex', flexFlow:'column', width:'100%', alignItems:'center',marginTop: '100px'}}>
                <PureMobileGroup styleName={styleName} style={{marginTop:0,marginBottom:30}} branch={parent}/>
                {branches}
            </div>
        )
    }
}
