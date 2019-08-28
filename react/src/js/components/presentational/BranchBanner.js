import React, { Component } from "react";
import {BranchImage,BranchImage2,BranchImageEditMenu} from "./BranchImage"


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

export class BranchBanner2 extends Component{
    constructor(props){
        super(props);
        
        this.onClick = this.onClick.bind(this);
        this.updateBanner = this.updateBanner.bind(this);
        this.onResize = this.onResize.bind(this);

        this.state = {
            editMode:false,
            editMenu:false,
            domPosition:null,
            branchBanner:this.props.branch.branch_banner
        }
    }

    updateBanner(url){
        this.setState({branchBanner:url,editMenu:false});
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

    componentDidMount(){
        window.addEventListener('resize', this.onResize);

        this.setState({
            domPosition:this.banner.getBoundingClientRect()
        })
    }

    onResize(){
        this.setState({
            domPosition:this.banner.getBoundingClientRect()
        })
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.onResize);
    }

    render(){
        var parent = this.props.parent ? true : false;
        var branchImage = this.props.parent ? null : (
            <BranchImage2 branch={this.props.branch} 
            dimensions={this.props.dimensions} 
            parent={parent} 
            editMode={this.props.editMode}
            domPosition={this.state.domPosition}
            />
        )
        var branchImage2 = <BranchImage branch={this.props.branch} className={this.props.className} />
        return(
        <div ref={(banner) => { this.banner = banner }} className="group-container" id={this.props.branch.id} style={{position:'relative'}} >
            <div onClick={() => this.onClick()} style={{paddingTop: '33.33333%', position: 'relative',width:"100%",
            backgroundImage:`url(${this.state.branchBanner ? this.props.branch.branch_banner : this.state.branchBanner})`, backgroundRepeat:'no-repeat',backgroundSize:'cover',backgroundPosition:'center'}}>
                {branchImage2}
                {branchImage}
            </div>
            {this.props.children}
        </div>
        )
    }
}

export function BranchBanner(props){
    let defaultBannerUrl = '/images/group_images/banner/default';
    let r = new RegExp(defaultBannerUrl);
    let isDefault = r.test(props.branch.branch_banner)
    return(
        <div id={props.branch.id} style={{position:'relative'}}>
            <div style={{paddingTop: '33.33333%', position: 'relative',width:"100%",
            backgroundImage:`url(${isDefault?null:props.branch.branch_banner})`, 
            backgroundRepeat:'no-repeat',backgroundSize:'cover',backgroundPosition:'center',
            backgroundColor:getRandomColor()}}>
                <div>
                    <BranchImage branch={props.branch} className={props.className} />
                </div>
            </div>
            {props.children}
        </div>
    )
}