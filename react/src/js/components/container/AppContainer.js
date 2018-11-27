import React, { Component } from "react";
import { Switch, Route, Link  } from 'react-router-dom'
import { withRouter , Redirect } from 'react-router'
import { Page } from '../Page'
import { Tree, Test } from "../presentational/Tree"
import GroupHomeContainer from "../container/GroupHomeContainer"
import GroupChatContainer, {GroupChatMessagesContainer} from "../container/GroupChatContainer"
import { SettingsContainer } from "./SettingsContainer"
import axios from 'axios'


const Routes = (props) => (
    <Page>
        <Switch>
            <Route exact path='/' component={(props) => <Test {...props} />}  />
            <Route exact path='/settings' component={(props) => <SettingsContainer {...props}/> }  />
            <Route path='/map/:uri?' component={(props) => <Tree {...props} root={"global"} key="Tree" />} />
            <Route path='/:uri?/chat/:roomName?' component={(props) => <GroupChatMessagesContainer {...props} />} />
            <Route path='/:uri?' component={(props) => <GroupHomeContainer {...props} />} />
            
        </Switch>
    </Page>
)

class App extends Component {
    constructor(props){
        super(props)

        this.unlisten = this.props.history.listen((location, action) => {
            console.log("on route change");
        });
    }

    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        return (
            <Routes />
        );
    }
}

export default withRouter(App);
//export const AppContainer = withRouter(App);