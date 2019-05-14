import React, {useState,useContext,useEffect,Component} from 'react'
import {UserContext} from "../container/ContextContainer"
import { Editor } from 'slate-react'
import { Value } from 'slate'
import Plain from 'slate-plain-serializer'
import axios from 'axios'

var csrftoken = getCookie('csrftoken');


export default function StatusUpdate({currentPost,updateFeed,postedId,replyTo=null,style=null}){
    const initialValue = Value.fromJSON({
        document: {
          nodes: [
            {
              object: 'block',
              type: 'paragraph',
              nodes: [
                {
                  object: 'text',
                  leaves: [
                    {
                      text: '',
                    },
                  ],
                },
              ],
            },
          ],
        },
      })

    const [value,setValue] = useState(initialValue);
    const context = useContext(UserContext);

    const handleChange = (e) =>{

        setValue(e.value);
        if (e.value.document != value.document) {
            //const content = JSON.stringify(e.value.toJSON())
            const content = Plain.serialize(e.value)
            localStorage.setItem('content', content)
        }
    }

    const renderNode = (props, editor, next) => {
        switch (props.node.type) {
          case 'code':
            return <CodeNode {...props} />
          default:
            return next()
        }
    }
    

    return(
        <div style={{padding:10,fontSize:'1.5rem',backgroundColor:'#cfdeea',
        display:'flex',justifyContent:'stretch',...style}}>
            <div>
                <img src={context.currentBranch.branch_image} className="profile-picture" 
                style={{width:48,height:48,marginRight:10,display:'block'}}/>
            </div>
            <div style={{width:'100%'}}>
                <Editor 
                value={value}
                onChange={handleChange}
                renderNode={renderNode} 
                placeholder="Add a leaf"
                style={{padding:5,backgroundColor:'white',minWidth:0,width:'98%',borderRadius:10,
                wordBreak:'break-all',border:'1px solid #a6b7c5'}}/>
                <Toolbar2 branch={context.currentBranch} postedId={postedId} currentPost={currentPost} 
                updateFeed={updateFeed} replyTo={replyTo} value={Plain.serialize(value)}/>
            </div>
        </div>
    )
}

function CodeNode(props) {
    return (
        <pre {...props.attributes}>
            <code>{props.children}</code>
        </pre>
    )
}

function Toolbar({branch,postedId,currentPost=null,updateFeed,value,replyTo=null}){
    console.log(value);
    const handleClick = (e)=>{
        //let post = localStorage.getItem("content");
        let post = value;
        let type = replyTo?'reply':'post';
        if(post!==''){
            let data = {
                posted:postedId||currentPost.poster_id,
                posted_to:[postedId||currentPost.poster_id],
                type:type,
                text:post
            }
            let uri = `/api/branches/${branch.uri}/posts/new/`

            axios.post(
                uri,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    withCredentials: true
                }).then(response => {
                    console.log(response);
                    axios.get(`/api/branches/${branch.uri}/posts/${response.data.id}`).then(response =>{
                        if(replyTo){
                            let url = `/api/post/add_reply/${replyTo}/`
                            var data = {
                                replies:[response.data.id]
                            }
                            axios.patch(
                                url,
                                data,
                                {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrftoken
                                },
                                withCredentials: true,
                            }).then(response=>{
                                console.log(response);
                            })
                        }
                        updateFeed([response.data]);
                        console.log(response);
                    })
                    console.log(response)
                }).catch(error => {
                console.log(error)
            })
        }
    }

    return(
        <div style={{marginTop:5}}>
            <button onClick={handleClick}>Add</button>
        </div>
    )
}

function Toolbar2({branch,postedId,currentPost=null,updateFeed,value,replyTo=null}){
    console.log(value);
    const handleClick = (e)=>{
        //let post = localStorage.getItem("content");
        let post = value;
        let type = replyTo?'reply':'post';
        let data = {
            posted:postedId||currentPost.poster_id,
            posted_to:[postedId||currentPost.poster_id],
            type:type,
            text:post
        }
        
        if(replyTo){
            data = {...data,replied_to:replyTo}
        }

        let uri = `/api/branches/${branch.uri}/posts/new/`

        axios.post(
            uri,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                withCredentials: true
            }).then(response => {
                axios.get(`/api/branches/${branch.uri}/posts/${response.data.id}`).then(response =>{
                    updateFeed([response.data]);
                    console.log(response);
                })
                console.log(response);
            }).catch(error => {
            console.log(error)
        })
    }
    

    return(
        <div style={{marginTop:5}}>
            <button onClick={handleClick}>Add</button>
        </div>
    )
}