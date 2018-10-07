import React, { Component } from "react";
import $ from "jquery";
import validator from 'validator'


var csrftoken = getCookie('csrftoken');

const CSRFToken = () => {
    return (
        <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
    );
};


export class SettingsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            uri: '',
            profileImage: '',
            fields: null,
        }
    }

    componentDidMount() {
        $.get('/api/profile').done((data) => {
            var uri = '/api/profile/' + data[0].user
            $.get(uri, (data) => {
                console.log(data);
                this.setState({
                    fields: data // fields is an array
                });
            })
        })
    }

    render() {
        if (this.state.fields) {
            return (
                <form className="settings-form" encType="multipart/form-data" method="POST" action="/settings/">
                <CSRFToken />
                    <p className="fieldWrapper">
                        <label htmlFor={this.state.fields.url}>You can change your identifier. This is how your profile will appear when users search for you</label>
                    </p><div style={{ textAlign: 'left', display: 'flex' }}>
                        <span className="create-name-span" style={{ marginRight: 2 }}>www.subranch.com/</span>
                        <input name="url" maxLength={60} defaultValue={this.state.fields.url} required id="id_url" type="text" />
                    </div>
                    <p />
                    <p>
                        <label htmlFor="1">Change your profile picture</label>
                        <input name="profile_image" id="1" type="file" />
                    </p>
                    <button type="submit">Submit</button>
                </form>
            )
        }
        else {
            return null;
        }
    }
}


