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
            uriError:null,
            profileImageError:null,
            fields: null,
        }

        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleSubmit(){
        event.preventDefault()
        console.log("form submitted")
        var self = this;
        var formElement = document.querySelector(".settings-form");
        var formData = new FormData(formElement);

        $.ajax({
            type: "POST",
            url: "/settings/",
            data: formData,
            processData: false,
            contentType: false,
            success: function handleFormSuccess(data, textStatus, jqXHR){
                console.log(data)
                console.log(textStatus)
                console.log(jqXHR)
                //$myForm.reset(); // reset form data
            },
            error: function handleFormError(jqXHR, textStatus, errorThrown){
                console.log(jqXHR)
                console.log(textStatus)
                var uriError = jqXHR.responseJSON.url ? jqXHR.responseJSON.url : null
                var profileImageError = jqXHR.responseJSON.profile_image ? jqXHR.responseJSON.profile_image : null
                console.log(uriError,profileImageError)
                self.setState({
                    uriError:uriError,
                    profileImageError:profileImageError
                })
            },
            complete: function(r){
                console.log(/*JSON.stringify*/(r.responseText));
                $.ajax({
                    url: '/api/profile/',
                    type: 'get',
                    success: function (data) {
                        document.getElementsByClassName('prof-pic')[0].setAttribute("src", data[0].profile_image);
                    },
                    failure: function (data) {
                        alert('failed to load profile image');
                    }
                });
            },
        })
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
        console.log(this.state.uriError)
        if (this.state.fields) {
            return (
                <form onSubmit={this.handleSubmit} className="settings-form" encType="multipart/form-data" method="POST" action="/settings/">
                <CSRFToken />
                    <p style={{margin: 0}}>
                        <label htmlFor={this.state.fields.url}>You can change your identifier. This is how your profile will appear when users search for you</label>
                    </p><div style={{ textAlign: 'left', display: 'flex' }}>
                        <span className="create-name-span" style={{ marginRight: 2 }}>www.subranch.com/</span>
                        <input name="url" maxLength={600} defaultValue={this.state.fields.url} required id="id_url" type="text" />
                        <div>{this.state.uriError}</div>
                    </div>
                    <p />
                    <p>
                        <label htmlFor="1">Change your profile picture</label>
                        <input name="profile_image" id="1" type="file" />
                        <div>{this.state.profileImageError}</div>
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


