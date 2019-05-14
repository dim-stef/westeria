import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet";
import MediaQuery from 'react-responsive';
import Responsive from 'react-responsive';
import {Content} from './presentational/Content'
import NavigationBar from './presentational/Navigation'
import {WideScreenNavigation} from './presentational/WideScreenNavigation'
import {UserContext} from './container/ContextContainer'
import axios from 'axios'


const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
const Tablet = props => <Responsive {...props} minDeviceWidth={768} maxDeviceWidth={991} />;
const Mobile = props => <Responsive {...props} maxDeviceWidth={767} />;

export class Page extends Component {

    static contextType = UserContext

    constructor(props){
        super(props);

        this.state = {
            isAuth:this.props.context.isAuth,
            branches:this.props.context.branches,
            currentBranch:this.props.context.currentBranch,
            updateUserData:null
        }

        //this.updateUserData = this.updateUserData.bind(this)
    }

    /*async updateUserData(){
        try{
            var r = await axios.get("/api/owned_branches/")
            this.setState({
                isAuth:localStorage.getItem("token"),
                branches:r.data,
                currentBranch:r.data.find(b => {
                    return b.default === true
                }),
                startedLoading:true,
            })
        }catch(error){
            localStorage.removeItem("token");
            this.setState({
                isAuth:null,
                branches:null,
                currentBranch:null,
                startedLoading:true,
            })
        }
    }*/

    render() {
        console.log("context",this.context)
        //let updateHandler = {updateUserData:this.updateUserData}
        //let value = {...this.state,...updateHandler}
        return (

            <div className="root-wrapper">
                {/*{localStorage.getItem('token') ? (
                    <div>
                        <div onClick={this.modalClick} id="modal-window" />
                            <div id="creategroup-container">
                        </div>
                    </div>
                ):(
                    null
                )}*/}

                {/*<UserContext.Provider  value={value}> */}
                    <Desktop>
                        <NavigationBar/>
                        <div style={{marginTop:60}}>
                            <WideScreenNavigation />
                        
                            <div id="main-wrapper" className="main-wrapper">
                                <div id="wide-content-container" className="wide-content-container">
                                    {this.props.children}
                                </div>
                            </div>
                        </div>
                    </Desktop>
                    <MediaQuery maxDeviceWidth={1224}>
                        <div>You are a tablet or mobile phone</div>
                    </MediaQuery>
                {/*</UserContext.Provider>*/}
                    

                <div className="success-message-container" style={{ display: 'none' }}>
                    <p id="success-message" />
                </div>
            </div>
        )
    }
}

