require('intersection-observer');
import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { Router , Link } from 'react-router-dom'
import { initializeFirebase,listenForUpdates } from "./push-notification"
import LogRocket from 'logrocket';
import AppContainer from "./components/container/AppContainer.js"
import {ThemeProvider} from "./components/container/ThemeContainer";
import history from './history';

LogRocket.init('xfc8o2/westeria');
listenForUpdates();
ReactDOM.render((
    <Router history={history}>
        <ThemeProvider>
            <AppContainer/>
        </ThemeProvider>
    </Router>
), document.getElementById('react-root'))
initializeFirebase();
