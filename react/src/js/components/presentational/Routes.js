import React, { Component } from "react";
import { Switch, Route, Link  } from 'react-router-dom'
import { Page } from '../Page'
import { Tree, Test } from "../presentational/Tree"
import Login from "./Login"
import Register from "./Register"
import BranchSettingsContainer from "../container/BranchSettingsContainer"
import MyBranchesContainer from "../container/MyBranchesContainer"
import { SettingsContainer } from "../container/SettingsContainer"
import GroupHomeContainer  from "../container/GroupHomeContainer"
import {UserContext} from "../container/ContextContainer"

const Routes = (props) => (
    
        <Switch>
            <Route exact path='/login' component={(props) => <Login {...props} />} />
            <Route exact path='/register' component={(props) => <Register {...props} />} />
            <UserContext.Consumer>
            {context => (
                <Page context={context}>
                    <Switch>
                        <Route exact path='/' component={(props) => <Test {...props} />}  />
                        <Route exact path='/settings' component={(props) => <SettingsContainer {...props}/> } />
                        <Route exact path='/mybranches' component={(props) => <MyBranchesContainer {...props}/> } />
                        <Route path='/settings/:branchUri?' component={(props) => <BranchSettingsContainer {...props} />} />
                        <Route exact path='/:uri?' component={(props) => <Tree {...props} root={"global"}/>} />
                        <Route path='/:uri?/chat/:roomName?' component={(props) => <GroupHomeContainer {...props} />} />
                    </Switch>
                </Page>
            )}
            </UserContext.Consumer>
       </Switch>
)

export default Routes;