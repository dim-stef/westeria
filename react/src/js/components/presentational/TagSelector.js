import React, {useState,useEffect} from "react"
import Select from 'react-select';


const options = [
    {value:'tag1',label:'Tag1',icon:'cccc'},
    {value:'tag2',label:'Tag2',icon:'cccc222'},
]

const customStyles = {

    container: () => ({
      // none of react-select's styles are passed to <Control />
      width: '90%',
      position:'relative'
    }),
  }


export function TagSelector(){

    const [tags,setTags] = useState([])

    function handleChange(values){
        setTags(values);
    }

    return (
        <Select
            styles={customStyles}
            options={options}
            closeMenuOnSelect={false}
            isMulti
            onChange={handleChange}
        />
    )
}

const customSingleValue = ({ data }) => (
    <div className="input-select">
        <div className="input-select__single-value">
            { data.icon && <span className="input-select__icon">{ data.icon }</span> }
            <span>{ data.label }</span>
        </div>
    </div>
);