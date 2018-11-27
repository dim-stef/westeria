import React, { Component } from "react";

export const MobileNavigation = () => {
    return (
        <div class="mobile-menu">
            <div style={{ width: '100%', position: 'relative', height: 100, backgroundColor: '#266277', zIndex: 5 }}>
                <div className="mobile-top-bar-container">
                    <MobileTopPageBar />
                </div>
            </div>
        </div>
    )
}

const MobileTopPageBar = () => {
    return (
        <div className="mobile-top-bar">
            <div className="search-container">
                <button className="search-button">
                    <i class="material-icons noselect" style={{ fontSize: "3em", color: "whitesmoke" }}>search</i>
                </button>
                <input className="search" type="text" placeholder="Search"></input>
            </div>
        </div>
    )
}
