import React from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';

class Loader extends React.Component {
    render() {
        return (
            <LoadingOverlay
                active={this.props.loading}
                spinner
                text='API call in progress'
            >
                <p>API call in progress</p>
            </LoadingOverlay>
        );
    }
}

export default connect((state) => ({
    loading: state.common.loading
}))(Loader);

