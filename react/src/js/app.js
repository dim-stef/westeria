//import 'react-app-polyfill/ie11';
//import 'react-app-polyfill/stable';
require('intersection-observer');
import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { Router , Link } from 'react-router-dom'
import { initializeFirebase } from "./push-notification"
import AppContainer from "./components/container/AppContainer.js"
import {ThemeProvider} from "./components/container/ThemeContainer";
import history from './history';


ReactDOM.render((
    <Router history={history}>
        <ThemeProvider>
            <AppContainer/>
        </ThemeProvider>
    </Router>
), document.getElementById('react-root'))
initializeFirebase();