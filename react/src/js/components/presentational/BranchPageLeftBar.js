import React, { Component } from "react";
import { Link } from 'react-router-dom'
import {UserContext} from '../container/ContextContainer'

export class BranchPageLeftBar extends Component{
    render(){
        return(
            <div style={{float:'left',width:180,height:1}}>
                <div className="side-bar-container">
                    <div>
                        <div>
                            <BranchBox branch={this.props.branch}/>
                        </div>
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

export class BigBranchPicture extends Component{
    render(){
        return(
            <Link to={`/${this.props.branch.uri}`} className={`profile-picture ${this.props.className}`}
            style={{
                width:200,
                height:200,
                border:'5px solid white',
                backgroundImage:`url(${this.props.branch.branch_image})`}}
                />
        )
    }
}

class BranchName extends Component{
    static contextType = UserContext

    render(){
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