import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block'

class Blocks extends Component {

    state = {
        blocks: []
    }
    componentWillMount() {
        fetch(`${document.location.origin}/api/blocks`)
            .then(response => response.json())
            .then(json => this.setState({ blocks: json }))

    }
    render() {
        //const { blocks } = this.state;
        return (
            <div>
                <div><Link to='/'>Home</Link></div>
                <h3>Blocks</h3>
                {this.state.blocks.map(block => {
                    return (
                        <Block key={block.hash} block={block} />
                        )
                })}
            </div>
        )
    }


}
export default Blocks;