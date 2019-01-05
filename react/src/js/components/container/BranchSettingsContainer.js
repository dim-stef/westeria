import React, { Component } from "react";
import {UserContext} from './ContextContainer'
import {PureGroup} from '../presentational/PureGroup'
import axios from 'axios'

var csrftoken = getCookie('csrftoken');

const CSRFToken = () => {
    return (
        <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
    );
};



export default class BranchSettingsContainer extends Component{

    static contextType = UserContext

    constructor(props){
        super(props);
        this.state = {
            branchImageError:null,
            branchBannerError:null,
            nameError:null,
            fields:null,
        }
    }

    render(){
        const branch = this.context.branches.find(b=>{
            return b.uri = this.props.match.params.branchUri
        })
        console.log("branch",branch)
        return(
            <div>
                <form onSubmit={this.handleSubmit} className="settings-form" encType="multipart/form-data" method="PUT" 
                action={`/api/branches/update/${this.props.name}`}>
                    <PureGroup branch={branch}/>
                    <input name="branch_image" type="file"/>
                    <input name="branch_banner" type="file"/>
                    <input name="name" />
                    <input name="description" />
                    <input name="parents" />
                    <input name="accessibility" />
                    <input name="over_18" />
                </form>
            </div>
            
        )
    }
}