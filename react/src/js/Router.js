global._babelPolyfill = false;
import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { Router , Link } from 'react-router-dom'
import AppContainer from "./components/container/AppContainer.js"
import history from './history';


ReactDOM.render((
    <Router history={history}>
        <AppContainer />
    </Router>
), document.getElementById('react-root'))