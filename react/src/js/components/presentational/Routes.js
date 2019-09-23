import React, {Component, useContext, useEffect, useState} from "react"
import {Link, Redirect, Route, Switch, withRouter} from 'react-router-dom'
import { Global, css } from "@emotion/core";
import styled from '@emotion/styled'
import { withTheme, useTheme as useEmotionTheme } from 'emotion-theming'
import {Helmet} from "react-helmet";
import {Page} from '../Page'
import Login from "./Login"
import Logout from "./Logout"
import Register from "./Register"
import PasswordReset from "./PasswordReset"
import PasswordResetConfirm from "./PasswordResetConfirm"
import EmailConfirm from "./EmailConfirm"
import {
    BranchCommunityPostsContext,
    BranchPostsContext,
    BranchTreePostsContext,
    NotificationsProvider,
    SingularPostContext,
    UserContext
} from "../container/ContextContainer"
import {ChatRoomsContainer} from "../container/ChatRoomsContainer"
import {ChatRoomSettings} from "./ChatRoomSettings"
import {CreateNewChat} from "./CreateNewChat"
import {GenericBranchPosts} from "./BranchPosts"
import {ParentBranch} from "./Branch"
import {BranchContainer} from "../container/BranchContainer"
import {BranchesPageRoutes} from "./BranchesPage"
import {BranchNavigation} from "./BranchNavigation"
import {TrendingContainer, TrendingWithWrapper as Trending} from "../container/TrendingContainer"
import Card from "./Card"
import Responsive from 'react-responsive';
import {ResponsiveNavigationBar} from "./Navigation"
import {NotificationsContainer} from "./Notifications"
import {SearchPage} from "./SearchPage"
import {SettingsPage} from "./SettingsPage"
import {SingularPost} from "./SingularPost"
import {CSSTransition} from "react-transition-group";
import MyBranchesColumnContainer from "./MyBranchesColumn"
//const MyBranchesColumnContainer = lazy(() => import('./MyBranchesColumn'));
//const FeedPosts = lazy(() => import('./BranchPosts'));
import {FrontPage, FrontPageLeftBar} from "./FrontPage"
import {MobileBranchPageWrapper} from "./MobileParentBranch"
import {useTheme} from "../container/ThemeContainer"
import {matchPath} from "react-router";
import pathToRegexp from 'path-to-regexp'


const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
const Tablet = props => <Responsive {...props} minDeviceWidth={768} maxDeviceWidth={1223} />;
const Mobile = props => <Responsive {...props} maxDeviceWidth={767} />;

function RouteTransition({location,children}){
    return(
        <CSSTransition key={location.key}
        timeout={{ enter: 300, exit: 300 }} classNames={'pages'}>
            {children}
        </CSSTransition>
    )
}
/*<TransitionGroup style={{display:'inherit',width:'100%',position:'relative'}} className="transition-group">
                            <CSSTransition
                            key={location.key}
                            timeout={{ enter: 300, exit: 300 }} classNames={'pages'}
                            >
                                <div className="route-section flex-fill" style={{width:'100%'}}>

</div>
                                </CSSTransition>
                            </TransitionGroup>*/
const Routes = ()=>{

  
    return(
        <Switch>
            <Route exact path='/logout/:instant(instant)?' component={(props) => <Logout {...props} />} />
            <Route exact path='/login' component={(props) => <Login {...props} />} />
            <Route exact path='/register' component={(props) => <Register {...props} />} />
            <Route exact path='/password/reset' component={PasswordReset} />
            <Route exact path='/reset/:uid/:token' component={(props) => <PasswordResetConfirm {...props} />} />
            <Route path='/accounts/confirm-email/:token' component={(props) => <EmailConfirm {...props} />} />
            <Page>
                <ResponsiveNavigationBar/>
                <NonAuthenticationRoutes/>
            </Page>
            
        </Switch>
    )
}



/*const GlobalStyle = createGlobalStyle`
  body {
    color: ${props => props.theme.textColor};
    backgroundColor: ${props => props.theme.backgroundColor};
  }
`*/

const makeGlobalStyles = theme => css`
  body {
    background: ${theme.backgroundColor};
    color: ${theme.textColor};
  }
`

const GlobalStyles = withTheme(({ theme }) => (
  <Global styles={makeGlobalStyles(theme)} />
))

const RoutesWrapper = (props) =>{
  const [messages,setMessages] = useState([]);
  const [notifications,setNotifications] = useState([]);
  
  return(
    <NotificationsProvider value={{messages:messages,setMessages:setMessages,
    notifications:notifications,setNotifications:setNotifications}}>
      {/*<GlobalStyle/>*/}
      <GlobalStyles/>
      <Routes/>
    </NotificationsProvider>
  )
}

export default withRouter(RoutesWrapper);

function NonAuthenticationRoutes(){
    const userContext = useContext(UserContext);
    return(
        <Switch>
            <Route path='/settings' render={()=>userContext.isAuth?<SettingsPage/>:<Redirect to="/login"/>}/>
            <Route exact path='/:page(popular|all|tree)?/' render={()=><FrontPage/>}/>
            <Route path='/search' component={SearchPage} />
            <Route path='/notifications' render={()=>userContext.isAuth?<NotificationsContainer/>:<Redirect to="/login"/>}/>
            <Route exact path='/messages/create_conversation' render={(props)=>userContext.isAuth?<CreateNewChat {...props}/>:<Redirect to="/login"/>}/>
            <Route exact path='/messages/:roomName/:page(invite|settings)' render={(props)=>userContext.isAuth?<ChatRoomSettings {...props}/>:<Redirect to="/login"/>}/>
            <Route path='/messages/:roomName?' render={(props)=>userContext.isAuth?<ChatRoomsContainer {...props}/>:<Redirect to="/login"/>}/>
            <Route path='/:uri/leaves/:externalId' render={({match}) => 
                <SingularPostWrapper externalPostId={match.params.externalId}/>}/>
            <Route path='/:uri?' render={(props)=><BranchContainer {...props}/>}/>
        </Switch>
    )
}

function NonAuthenticationColumn(){
    return(
        <div className="box-border flex-fill" style={{padding:'10px 20px',
        alignItems:'center',WebkitAlignItems:'center',flexFlow:'column',WebkitFlexFlow:'column'}}>
            <Link to="/login" className="login-or-register">Login</Link>
            <span style={{fontSize:'1.4rem',color:'#a4a5b2'}}>or</span>
            <Link to="/register" className="login-or-register">Register</Link>
        </div>
    )
}


if (process.env.NODE_ENV !== 'production') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React);
}

const postWrapper = theme=>css({
  border:`1px solid ${theme.borderColor}`
})

function SingularPostWrapper({externalPostId}){
    const singularPostContext = useContext(SingularPostContext)
    const userContext = useContext(UserContext);

    return(
        <>
            <Desktop>
                <FrontPageLeftBar/>
                <ul className="post-list" css={theme=>postWrapper(theme)}>
                    <SingularPost postId={externalPostId} postsContext={singularPostContext}
                    activeBranch={userContext.currentBranch}
                /></ul>
                <Trending/>
            </Desktop>

            <Tablet>
                <ul className="post-list" css={theme=>postWrapper(theme)}>
                    <SingularPost postId={externalPostId} postsContext={singularPostContext}
                    activeBranch={userContext.currentBranch}
                /></ul>
            </Tablet>

            <Mobile>
                <ul className="post-list" css={theme=>postWrapper(theme)}>
                    <SingularPost postId={externalPostId} postsContext={singularPostContext}
                    activeBranch={userContext.currentBranch}
                /></ul>
            </Mobile>
            
        </>
        
    )
}

const rightBar = theme => css({
  backgroundColor:theme.backgroundColor,
  color:theme.textColor,
  flexBasis:'22%',
  height:'max-content'
})

const rightBarP = theme => css({
  fontSize: "1.6em",
  fontWeight: 600,
  paddingBottom: 5,
  margin: "-10px -20px",
  backgroundColor: "#219ef3",
  color: theme.textColor,
  padding: "10px 20px",
  marginBottom:10
})


function FrontPageRightBar(){
    return(
        <div css={theme => rightBar(theme)}>
            <div className="box-border" style={{padding:'10px 20px'}}>
            <p css={theme => rightBarP(theme)}>Popular now</p>
                <TrendingContainer/>
            </div>
        </div>
    )
}


function ResponsiveBranchPage({branch,children}){
    return(
        <>
            <Desktop>
                <DesktopParentBranchWrapper branch={branch}>
                    {children}
                </DesktopParentBranchWrapper>
            </Desktop>
            <Tablet>
                <MobileBranchPageWrapper branch={branch}>
                    {children}
                </MobileBranchPageWrapper>
            </Tablet>
            <Mobile>
                <MobileBranchPageWrapper branch={branch}>
                    {children}
                </MobileBranchPageWrapper>
            </Mobile>    
            </>
    )
}

function DesktopParentBranchWrapper(props){

    return(
        <div className="flex-fill" style={{flexFlow:'row wrap',width:'100%'}}>
            <div style={{flexBasis:'100%',WebkitFlexBasis:'100%'}}>
                <div>
                    <ParentBranch
                        styleName="parent"
                        style={{marginTop:0,marginBottom:0,width:'100%',bannerWidth:'100%'}} 
                        branch={props.branch}
                        branchNavigation
                        editMode={false}
                    ></ParentBranch>
                </div>
                <Card branch={props.branch}/>
                <BranchNavigation branch={props.branch} refresh={props.refresh}/>
                {props.children}
            </div>
        </div>
    )
}

export function BranchPage(props){
    return(
        <ResponsiveBranchPage branch={props.branch}>
            <Helmet>
                <title>{props.branch.name} (@{props.branch.uri}) - Subranch</title>
                <meta name="description" content={props.branch.description} />
            </Helmet>
            <Switch>
                <Route path={`/${props.match}/branches`} component={() => <BranchesPageRoutes {...props}/>}/>
                <Route path={`/${props.match}/:keyword(community|tree)?/`} 
                component={({match})=> <BranchFrontPage {...props} keywordMatch={match}/>}/>
            </Switch>
        </ResponsiveBranchPage>
    )        
}

function BranchFrontPage(props){
    let _context = null;

    const theme = useEmotionTheme();
    let keyword = props.keywordMatch.params.keyword
    if(keyword == 'community'){
      _context = BranchCommunityPostsContext
    }else if(keyword == 'tree'){
      _context = BranchTreePostsContext
    }else{
      _context = BranchPostsContext;
    }    

    const postsContext = useContext(_context)
    const userContext = useContext(UserContext);
    
    var uri;
    
    uri = `/api/branches/${props.match}/posts/`;
    

    useEffect(()=>{
        
        return ()=>{
            let lastVisibleElements = document.querySelectorAll('[data-visible="true"]');
            postsContext.lastVisibleElement = lastVisibleElements[0];
            postsContext.lastVisibleIndex = lastVisibleElements[0]?
            lastVisibleElements[0].dataset.index:0;
        }
    },[])

    return(
        <>
        <Desktop>
            <div>
                <div style={{marginTop:10}}>
                    <div className="flex-fill" style={{width:'100%'}}>
                        <div style={{flexBasis:'22%',WebkitFlexBasis:'22%'}}>
                        {userContext.isAuth?
                            <div style={{backgroundColor:theme.backgroundColor,
                            padding:'10px 20px',border:`1px solid ${theme.borderColor}`}}>
                                <div className="flex-fill" style={{alignItems:'center',WebkitAlignItems:'center'}}>
                                    <img src="/static/logo_full.png"/>
                                </div>
                                    <MyBranchesColumnContainer/>
                            </div>
                            :<NonAuthenticationColumn/>
                        }
                        </div>
                        {props.externalPostId?<SingularPost postId={props.externalPostId} postsContext={postsContext}
                        activeBranch={userContext.currentBranch}
                        />:<GenericBranchPosts {...props}
                        keyword={keyword}
                        branch={props.match}
                        activeBranch={props.branch}
                        postedId={props.branch.id}
                        uri={uri}
                        />}
                        
                        <Trending/>
                    </div>
                </div>
            </div>
        </Desktop>
        <Tablet>
            <GenericBranchPosts {...props}
            keyword={keyword}
            branch={props.match}
            activeBranch={props.branch}
            postedId={props.branch.id}
            uri={uri}
            />
        </Tablet>
        <Mobile>
            <GenericBranchPosts {...props}
            keyword={keyword}
            branch={props.match}
            activeBranch={props.branch}
            postedId={props.branch.id}
            uri={uri}
            />
        </Mobile>
        </>
    )
}


class NavigatorWrapper extends Component {
  state = {
    urls: {}
  };

  // Trigger the location change to the route path
  handleIndexChange = (index, type) => {
    const {
      props: { path, defaultParams }
    } = React.Children.toArray(this.props.children)[index];

    let url;
    if (path.includes(":")) {
      if (path in this.state.urls) {
        url = this.state.urls[path];
      } else {
        // Build url with defaults
        url = generatePath(path, defaultParams);
        this.setState(state => ({ urls: { ...state.urls, [path]: url } }));
      }
    } else {
      url = path;
    }
    this.historyGoTo(url);

    // Call the onChangeIndex if it's set
    if (typeof this.props.onChangeIndex === "function") {
      this.props.onChangeIndex(index, type);
    }
  };

  triggerOnChangeIndex = location => {
    const { children } = this.props;
    React.Children.forEach(children, (element, index) => {
      const { path: pathProp, exact, strict, from } = element.props;
      const path = pathProp || from;
      if (matchPath(location.pathname, { path, exact, strict })) {
        if (typeof this.props.onChangeIndex === "function") {
          this.props.onChangeIndex(index);
        }
        this.setState(state => ({
          urls: { ...state.urls, [path]: location.pathname }
        }));
      }
    });
  };

  historyGoTo = path => {
    const { replace, history } = this.props;
    return replace ? history.replace(path) : history.push(path);
  };

  componentDidMount() {
    const { history } = this.props;
    this.triggerOnChangeIndex(history.location);
    this.unlistenHistory = history.listen(location => {
      // When the location changes, call onChangeIndex with the route index
      this.triggerOnChangeIndex(location);
    });
  }

  componentWillUnmount() {
    this.unlistenHistory();
  }

  componentDidUpdate(prevProps) {
    // If index prop changed, change the location to the path of that route
    if (prevProps.index !== this.props.index) {
      const paths = React.Children.map(
        this.props.children,
        element => element.props.path
      );
      this.historyGoTo(paths[this.props.index]);
    }
  }

  render() {
    const {
      children,
      index,
      replace,
      innerRef,
      location,
      history,
      staticContext,
      match: routeMatch,
      ...rest
    } = this.props;

    // If there's no match, render the first route with no params
    let matchedIndex = 0;
    let match;
    if (index) {
      matchedIndex = index;
    } else {
      React.Children.forEach(children, (element, index) => {
        const { path: pathProp, exact, strict, from } = element.props;
        const path = pathProp || from;

        match = matchPath(location.pathname, { path, exact, strict });
        if (match) {
          matchedIndex = index;
        }
      });
    }

    const renderableRoutes = React.Children.toArray(children).filter(
      (element, index) =>
        !element.props.path.includes(":") ||
        Boolean(element.props.defaultParams) ||
        element.props.path in this.state.urls
    );

    return (
      <div
        {...rest}
        index={matchedIndex}
        onChangeIndex={this.handleIndexChange}
        ref={innerRef}
        className="flex-fill"
      >
        {renderableRoutes.map((element, index) => {
          const { path, component, render, children } = element.props;
          const props = { location, history, staticContext };

          let match = matchPath(location.pathname, element.props);
          if (match) {
            match.type = "full";
          } else if (path in this.state.urls) {
            match = matchPath(this.state.urls[path], element.props);
            match.type = "outOfView";
          } else {
            match = matchPath(
              generatePath(path, element.props.defaultParams),
              element.props
            );
            match.type = "none";
          }
          props.match = match;
          props.key = path;

          // A lot of this code is borrowed from the render method of
          // Route. Why can't I just render the Route then?
          // Because Route only renders the component|render|children
          // if there's a match with the location, while here I render
          // regardless of the location.
          return component
            ? React.createElement(component, props)
            : render
            ? render(props)
            : children
            ? typeof children === "function"
              ? children(props)
              : !Array.isArray(children) || children.length // Preact defaults to empty children array
              ? React.Children.only(children)
              : null
            : null;
        })}
      </div>
    );
  }
}

const patternCache = {}
const cacheLimit = 10000
let cacheCount = 0

const compileGenerator = (pattern) => {
  const cacheKey = pattern
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {})

  if (cache[pattern])
    return cache[pattern]

  const compiledGenerator = pathToRegexp.compile(pattern)

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledGenerator
    cacheCount++
  }

  return compiledGenerator
}

/**
 * Public API for generating a URL pathname from a pattern and parameters.
 */
const generatePath = (pattern = '/', params = {}) => {
  if (pattern === '/') {
    return pattern
  }
  const generator = compileGenerator(pattern)
  return generator(params)
}

const Navigator = withRouter(NavigatorWrapper);