import React, { Component } from "react";
import { Switch, Route, Link  } from 'react-router-dom'
import { withRouter } from 'react-router'
import { SideBar } from '../home'
import { Tree, Test } from "./GroupContainer"
import { SettingsContainer } from "./SettingsContainer"




const Routes = () => (
    <SideBar>
        <Switch>
            <Route exact path='/' component={(props) => <Test {...props} />}  />
            <Route exact path='/settings' component={(props) => <SettingsContainer {...props} />}  />
            <Route path='/map' component={(props) => <Tree {...props} root={"ROOT"} key="Tree" />} />
        </Switch>
    </SideBar>
)

class App extends Component {
    constructor(props){
        super(props)

        console.log(this.props)
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