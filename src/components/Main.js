import React, {Fragment} from 'react';
import axios from 'axios'
import {asyncContainer, Typeahead} from 'react-bootstrap-typeahead';
import { getAPIData } from '../common/apis';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const AsyncTypeahead = asyncContainer(Typeahead);


class Main extends React.Component {

		state = {
			selectedStock: {
				name: 'RAJESH EXPORTS',
				id: '',
				symbol: 'RAJESHEXPO'
			},
			duration: {
				radioModel: '92'
			},
			chartData: {
				days: []
			}
		}

		componentDidMount() {
			const selectedStock = this.state.selectedStock;
			const duration = this.state.duration;
			this.props.getAPIData(selectedStock, duration);
		}

		getStockDetails(selection) {
			const { name, id, url } = selection;
			const selectedStock = {
				name,
				id,
				symbol: url.split('/')[2]
			};
			// sessionStorage.setItem('selectedStock', JSON.stringify(selectedStock));
			this.setState({ selectedStock });
			this.props.getAPIData(selectedStock, this.state.duration);
		}

		renderSearch() {
			return (
				<Fragment>
					<input type="button" value="Search" className="btn" ng-class="{'btn-primary': search.selectedStock}" style={{ float: 'right', marginLeft: '5px' }} onClick={this.showStockDetails} />
					<div className="pull-right">
						<AsyncTypeahead
							id="stock-typeahead"
							isLoading={this.state.isLoading}
							labelKey="name"
							onSearch={query => {
								// this.setState({isLoading: true});
								axios.get(`http://localhost:3001/api/getSearchResult?q=${query}`)
									// .then(resp => resp.json())
									.then(json => {
										this.setState({
											// isLoading: false,
											options: json.data,
										});
									})
							}}
							options={this.state.options || []}
							onChange={(selected) => {
								console.log(selected);
								if (selected.length) {
									this.getStockDetails(selected[0]);
									// trigger API call get details for selected stock
								}
							}}
						/>
					</div>
				</Fragment>
			);
		}

		changeDuration = (value) => {
			debugger;
			this.setState({
				duration: { radioModel: value }
			})
			if (this.state.selectedStock) {
				const selectedStock = this.state.selectedStock;
				const duration = { radioModel: value };
				this.props.getAPIData(selectedStock, duration);
			}
		}

		renderDuration() {
			this.durationOptions = [
				{text: '1 Day',value: '1'},
				{text: '2 Week',value: '14'},
				{text: '1 Month',value: '31'},
				{text: '3 Month',value: '92'},
				{text: '6 Month',value: '183'},
				{text: '1 Year',value: '365'},
				{text: '3 Year',value: '1095'},
				{text: '5 Year',value: '1825'},
			];
			return (
				<div className="duration-container">
					<div className="btn-group btn-group-toggle" data-toggle="buttons">
						{this.durationOptions.map((item, index) => {
							const customClass = `btn btn-primary ${item.value === this.state.duration.radioModel ? 'active' : ''}`;
							return (
								<React.Fragment key={item.index}>
									<label className={customClass} onClick={() => this.changeDuration(item.value)}>{item.text}</label>
								</React.Fragment>
							);
						})}
					</div>
				</div>
			);
		}

    render() {
        return (
					<div id="container">
						
						{this.renderSearch()}
						
						<input type="button" value="Add to Watchlist" className="btn btn-primary pull-right" style={{ marginLeft: '5px' }} onClick={this.addToWatchlist} />
						
						<h1>
							<span style={{ fontSize: '18px' }}>
								{this.state.selectedStock.name} ({this.state.selectedStock.symbol})
							</span>
							{/* <a className="btn btn-lg" onClick={this.openNewsPopup} data-toggle="modal" data-target="#newsModal">
								News
							</a> */}
						</h1>
						
						{this.renderDuration()}
						<div id="chart-container">
							{!this.state.chartData.days.length && <span >No Data Available</span>}
						</div>
						
					</div>


        );
    }
}

// export default connect(null, (dispatch) => bindActionCreators({ getAPIData }, dispatch))(Main);
export default connect(null, (dispatch) => ({ getAPIData: getAPIData.bind(null, dispatch)}))(Main);