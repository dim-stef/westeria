global._babelPolyfill = false;
import "@babel/polyfill";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Router , Link } from 'react-router-dom'
import AppContainer from "./components/container/AppContainer.js"


var createHistory = require("history").createBrowserHistory
const history = createHistory();

ReactDOM.render((
    <Router history={history}>
        <AppContainer />
    </Router>
), document.getElementById('react-root'))