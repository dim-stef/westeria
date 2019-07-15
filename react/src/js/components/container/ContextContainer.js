import React from "react";

export const UserContext = React.createContext();
export const UserActionsContext = React.createContext({
    lastFrontPageTab:'feed'
});
export const RefreshContext = React.createContext();
export const NotificationsContext = React.createContext();
export const CachedBranchesContext = React.createContext({
    following:[],
    owned:[],
    foreign:[]
});
export const SingularPostContext = React.createContext(
    {
        counter:0,
        content:'feed',
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        lastVisibleIndex:0,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        openPosts:[],
        previousUri:null,
        branchUri:'',
    }
)
export const PostsContext = React.createContext(
    {
        counter:0,
        content:'feed',
        hasMore:true,
        next:null,
        scroll:0,
        lastVisibleElement:null,
        lastVisibleIndex:0,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        openPosts:[],
        previousUri:null,
        branchUri:'',
        params:{
            content: {
                value:'leaves',
                label:'Leaves'
            },
            ordering:{
                value:'-hot_score',
                label:'Hot'
            },
            past:{
                value:'all',
                label:'All time'
            }
        }
    });

export const BranchPostsContext = React.createContext(
    {
        content:'branch',
        hasMore:true,
        next:null,
        loadedPosts:[],
        cachedPosts:[],
        uniqueCached:[],
        openPosts:[],
        previousUri:null,
        params:{
            content: {
                value:'leaves',
                label:'Leaves'
            },
            ordering:{
                value:'-hot_score',
                label:'Hot'
            },
            past:{
                value:'all',
                label:'All time'
            }
        }
    });