import React, {Fragment} from 'react';
// import Typeahead from 'react-bootstrap-typeahead';
// import {Typeahead} from 'react-bootstrap-typeahead';
import {asyncContainer, Typeahead} from 'react-bootstrap-typeahead';
const AsyncTypeahead = asyncContainer(Typeahead);

export default class Main extends React.Component {

		state = {
			stock: {},
			duration: {
				radioModel: '30'
			},
			chartData: {
				days: []
			}
		}

		renderSearch() {
			return (
				<Fragment>
					<input type="button" value="Search" className="btn" ng-class="{'btn-primary': search.selectedStock}" style={{ float: 'right', marginLeft: '5px' }} onClick={this.showStockDetails} />
					<div className="pull-right">
					{/* <Typeahead
						// options={['John', 'Paul', 'George', 'Ringo']}
						options={[{
							filterOption: 'John',
							displayOption: 'John'
						},{
							filterOption: 'Paul',
							displayOption: 'Paul'
						},{
							filterOption: 'George',
							displayOption: 'George'
						},{
							filterOption: 'Ringo',
							displayOption: 'Ringo'
						}]}
						maxVisible={2}
					/> */}

						{/* <Typeahead
							// labelKey="name"
							// multiple={multiple}
							options={[
								{id: 1, name: 'John'},
								{id: 2, name: 'Miles'},
								{id: 3, name: 'Charles'},
								{id: 4, name: 'Herbie'},
							]}
							labelKey="name"
							placeholder="Choose a stock"
							onChange={(selected) => {
								console.log(selected);
							}}
						/> */}

						{/* $scope.updateSearch = function() {
								// $http.get('https://www.screener.in/api/company/search/?q='+$scope.search.selectedStock).then(function(response) {
								$http.get('/getSearchResult?q='+$scope.search.selectedStock).then(function(response) {
										$scope.search.stock = response.data;
								});
						}; */}

						<AsyncTypeahead
							isLoading={this.state.isLoading}
							onSearch={query => {
								this.setState({isLoading: true});
								fetch(`/api/getSearchResult?q=${query}`)
									.then(resp => resp.json())
									.then(json => this.setState({
										isLoading: false,
										options: json.data,
									}));
							}}
							// options={this.state.options}
							options={[]}
						/>
						{/* <FormGroup>
							<Control
								checked={multiple}
								onChange={(e) => this.setState({multiple: e.target.checked})}
								type="checkbox">
								Multi-Select
							</Control>
						</FormGroup> */}

						{/* <input type="text" onChange={this.updateSearch} value={search.selectedStock} placeholder="search stock" uib-typeahead="stock.name for stock in search.stock | filter:$viewValue | limitTo:5" typeahead-on-select="onTypeaheadSelection()" className="form-control"> */}
					</div>
				</Fragment>
			);
		}

    render() {
        return (

					<div id="container">
						
						{this.renderSearch()}
						
						<input type="button" value="Add to Watchlist" className="btn pull-right"style={{ marginLeft: '5p' }} onClick={this.addToWatchlist} />
						
						<h1>
							<span style={{ fontSize: '18px' }}>
								{this.state.stock.name} ({this.state.stock.symbol})
							</span>
							<a className="btn btn-lg" onClick={this.openNewsPopup} data-toggle="modal" data-target="#newsModal">
								News
							</a>
						</h1>
						
						<div className="duration-container">
							<div className="btn-group">
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="1">1 Day</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="7">1 Week</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="15">2 Week</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="30">1 Month</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="90">3 Month</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="180">6 Month</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="365">1 Year</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="1095">3 Year</label>
								<label className="btn btn-primary" value={this.state.duration.radioModel} onChange={this.durationChanged} uib-btn-radio="1825">5 Year</label>
							</div>
						</div>
						
						<div id="chart-container">
							{this.state.chartData.days.length && <span >No Data Available</span>}
						</div>
						
					</div>


        );
    }
}