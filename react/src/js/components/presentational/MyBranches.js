import React, { Component } from "react";
import {Branch} from "./PureGroup"
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';


export class MyBranches extends Component{
    constructor(props){
        super(props);

        this.state={
            lineHeight:0,
        }

        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(index,lastIndex,e){
        if(e.type === 'click'){
            var indexElement = document.querySelectorAll(`div[tabsliderindex="${index}"]`);
            var lastIndexElement = document.querySelectorAll(`div[tabsliderindex="${lastIndex}"]`);
            indexElement[0].classList.add("tab-slider-open")

            if(index !== lastIndex){
                lastIndexElement[0].classList.remove("tab-slider-open")
            }
        }
    }

    collectBranches(branches){
        return branches.map(b=>{
            return (
                <div style={{display:'flex',flexBasis:'100%',justifyContent:'center',margin:'30px 0 30px'}} key={b.uri}>
                    <Branch branch={b} style={{marginTop:0,marginBottom:0,width:'100%',flexBasis:'60%',bannerWidth:'100%'}}/>
                    <div style={{flexBasis:'15%',fontWeight:'lighter'}}>
                        <span>{b.name}</span>
                    </div>
                </div>
            )
        })
    }

    componentDidMount(){
        this.setState({lineHeight:this.el.clientHeight})
    }

    render(){
        var childBranches = null;
        var parentBranches = null;
        var noChildBranchMessage = null;
        var noParentBranchMessage = null;

        if(this.props.childBranches){
            childBranches = this.collectBranches(this.props.childBranches);
            if(childBranches.length === 0){
                noChildBranchMessage = <p style={{fontSize:'0.9em',fontWeight:'lighter',color:'#545454'}}>{this.props.branchDisplayed.uri} doesn't have any branches</p>;
            }
        }
        if(this.props.parentBranches){
            parentBranches = this.collectBranches(this.props.parentBranches);
            if(parentBranches.length === 0){
                noParentBranchMessage = <p style={{fontSize:'0.9em',fontWeight:'lighter',color:'#545454'}}>{this.props.branchDisplayed.uri} is not attached anywhere</p>;
            }
        }
        return(
            <div className="tabs">
                <Tabs onSelect={this.onSelect}
                    activetab={{
                        id: "tab1"
                    }}
                >
                    <TabList className="tabs-list">
                        <Tab className="tab" id="tab1" title="Tab 1">
                            <div className="tab-title">Settings</div>
                            <div className="tab-slider tab-slider-open" tabsliderindex="0"></div>
                            
                        </Tab>
                        <Tab className="tab" id="tab2" title="Tab 2">
                            <div className="tab-title">Branches</div>
                            <div className="tab-slider" tabsliderindex="1"></div>
                        </Tab>

                    </TabList>
                    <TabPanel>
                            <div className="identifier-container">
                                <label htmlFor="identifier" className="identifier-label" style={{lineHeight:`${this.state.lineHeight}px`}}>Identifier</label>
                                <input type="text" placeholder={this.props.branchDisplayed.uri} id="identifier" className="identifier" ref={el=> {this.el = el}}></input>
                            </div>
                    </TabPanel>

                    <TabPanel>
                            <div style={{display:'flex',flexFlow:'column',justifyContent:'center'}}>
                                <h1 style={{textAlign:'center'}}>
                        
                                    <span>
                                        Roots
                                    </span>
                                    {noParentBranchMessage}
                                    {parentBranches}

                                    <span>
                                        Branches
                                    </span>
                                    {noChildBranchMessage}
                                    {childBranches}
                                    
                                </h1>
                            </div>
                    </TabPanel>
                    
                </Tabs>
            </div>
        )
    }
}